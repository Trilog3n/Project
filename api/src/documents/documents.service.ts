import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { EmailService } from '../email/email.service';
import { DocumentType } from './dto/documents.dto';
import { Express } from 'express'; // brings in Express namespace
import 'multer'; // ensures Multer types are available

@Injectable()
export class DocumentsService {
  private uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(userId: string, type: DocumentType, file: Express.Multer.File) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);

    const maxSize = this.configService.get<number>('MAX_FILE_SIZE', 5242880);
    if (file.size > maxSize) {
      throw new BadRequestException('File too large (max 5MB)');
    }

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      fs.writeFileSync(filepath, file.buffer);
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file');
    }

    const fileUrl = `/uploads/${filename}`;

    try {
      return await this.prisma.document.create({
        data: { vendorId: profile.id, type, fileUrl, status: 'PENDING' },
      });
    } catch (error) {
      try {
        fs.unlinkSync(filepath);
      } catch (e) {
        // ignore rollback errors
      }
      throw new InternalServerErrorException('Failed to save document');
    }
  }

  async approve(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { vendor: { include: { user: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED', verifiedAt: new Date() },
      include: { vendor: { include: { user: true } } },
    });

    await this.emailService.sendDocumentApprovalNotification(
      updated.vendor.user.email,
      {
        type: doc.type,
        vendorName: updated.vendor.user.name,
      },
    );

    return updated;
  }

  async reject(documentId: string, reason?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { vendor: { include: { user: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'REJECTED' },
      include: { vendor: { include: { user: true } } },
    });

    await this.emailService.sendDocumentRejectionNotification(
      updated.vendor.user.email,
      {
        type: doc.type,
        vendorName: updated.vendor.user.name,
        reason,
      },
    );

    return updated;
  }

  async findMyDocuments(userId: string) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    return this.prisma.document.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { vendor: { include: { user: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
}
