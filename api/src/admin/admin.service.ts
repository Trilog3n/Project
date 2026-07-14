import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private documentsService: DocumentsService,
  ) {}

  async getDashboardStats() {
    const [customers, vendors, bookings, pendingVerifications, pendingComplaints] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.user.count({ where: { role: 'VENDOR' } }),
        this.prisma.booking.count(),
        this.prisma.document.count({ where: { status: 'PENDING' } }),
        this.prisma.complaint.count({ where: { status: 'OPEN' } }),
      ]);

    return { customers, vendors, bookings, pendingVerifications, pendingComplaints };
  }

  async getPendingVendors() {
    return this.prisma.vendorProfile.findMany({
      where: { verified: false },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        documents: true,
        services: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyVendor(vendorId: string, approved: boolean) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.prisma.$transaction([
      this.prisma.vendorProfile.update({
        where: { id: vendorId },
        data: { verified: approved },
      }),
      this.prisma.user.update({
        where: { id: vendor.userId },
        data: { status: approved ? 'ACTIVE' : 'SUSPENDED' },
      }),
    ]);

    return { message: approved ? 'Vendor verified' : 'Vendor rejected' };
  }

  async suspendUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
  }

  async getAllUsers(role?: string) {
    const where = role ? { role: role as never } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        vendorProfile: { select: { verified: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllBookings(status?: string) {
    const where = status ? { status: status as never } : {};
    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        customer: { select: { id: true, name: true, email: true } },
        vendor: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getPendingDocuments() {
    return this.prisma.document.findMany({
      where: { status: 'PENDING' },
      include: { vendor: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveDocument(documentId: string) {
    return this.documentsService.approve(documentId);
  }

  async rejectDocument(documentId: string) {
    return this.documentsService.reject(documentId);
  }

  async getAllReviews() {
    return this.prisma.review.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        vendor: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Review deleted' };
  }

  async flagReview(reviewId: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isFlagged: true },
    });
  }
}
