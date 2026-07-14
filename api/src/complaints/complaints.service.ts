import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaints.dto';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, dto: CreateComplaintDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { complaint: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenException('Not your booking');
    if (booking.complaint) throw new BadRequestException('Complaint already filed');

    return this.prisma.complaint.create({
      data: {
        bookingId: dto.bookingId,
        customerId,
        description: dto.description,
      },
      include: {
        booking: { include: { service: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findMy(customerId: string) {
    return this.prisma.complaint.findMany({
      where: { customerId },
      include: { booking: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as never } : {};
    return this.prisma.complaint.findMany({
      where,
      include: {
        booking: { include: { service: true, vendor: { include: { user: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateComplaintDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');

    return this.prisma.complaint.update({
      where: { id },
      data: dto,
      include: {
        booking: { include: { service: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }
}
