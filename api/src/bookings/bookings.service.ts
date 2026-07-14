import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateBookingDto, UpdateBookingStatusDto, BookingQueryDto, ProposeBookingTimeDto } from './dto/bookings.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private vendorsService: VendorsService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { vendor: { include: { user: true } } },
    });
    if (!service || !service.isActive) throw new NotFoundException('Service not found');
    if (service.vendorId !== dto.vendorId) throw new BadRequestException('Service vendor mismatch');
    if (service.vendor.vacationMode) throw new BadRequestException('Vendor is on vacation');

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        vendorId: dto.vendorId,
        serviceId: dto.serviceId,
        date: new Date(dto.date),
        time: dto.time,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
      },
      include: {
        service: true,
        vendor: { include: { user: true } },
        customer: true,
      },
    });

    const customer = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (customer) {
      await this.emailService.sendBookingConfirmation(customer.email, {
        service: service.name,
        date: dto.date,
        vendor: service.vendor.user.name,
      });
    }

    return booking;
  }

  async findCustomerBookings(customerId: string, query: BookingQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { customerId };
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: { include: { category: true } },
          vendor: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findVendorBookings(userId: string, query: BookingQueryDto) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { vendorId: profile.id };
    if (query.status) where.status = query.status;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { date: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: { include: { category: true } },
        vendor: { include: { user: { select: { id: true, name: true, phone: true } } } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        review: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'VENDOR') {
      const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
      if (!profile || booking.vendorId !== profile.id) throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async updateStatus(userId: string, role: string, bookingId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, service: true, vendor: { include: { user: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    this.validateStatusTransition(booking.status, dto.status, role);

    if (role === 'VENDOR') {
      const profile = await this.vendorsService.ensureVendorProfile(userId);
      if (booking.vendorId !== profile.id) throw new ForbiddenException('Not your booking');
    } else if (role === 'CUSTOMER') {
      if (booking.customerId !== userId) throw new ForbiddenException('Not your booking');
      if (!['CANCELLED'].includes(dto.status)) {
        throw new ForbiddenException('Customers can only cancel bookings');
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
      include: { service: true, vendor: { include: { user: true } }, customer: true },
    });

    if (dto.status === 'ACCEPTED') {
      await this.emailService.sendBookingAccepted(booking.customer.email, {
        service: booking.service.name,
        date: booking.date.toISOString().split('T')[0],
      });
    }

    if (dto.status === 'REJECTED') {
      await this.emailService.sendBookingRejected(booking.customer.email, {
        service: booking.service.name,
        date: booking.date.toISOString().split('T')[0],
        vendor: booking.vendor.user.name,
      });
    }

    if (dto.status === 'COMPLETED') {
      await this.prisma.vendorProfile.update({
        where: { id: booking.vendorId },
        data: { completedJobs: { increment: 1 } },
      });
    }

    return updated;
  }

  async proposeTime(userId: string, bookingId: string, dto: ProposeBookingTimeDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, service: true, vendor: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const profile = await this.vendorsService.ensureVendorProfile(userId);
    if (booking.vendorId !== profile.id) throw new ForbiddenException('Not your booking');
    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      throw new BadRequestException('Can only propose time for pending or accepted bookings');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        proposedDate: new Date(dto.proposedDate),
        proposedTime: dto.proposedTime,
      },
    });
  }

  async confirmProposedTime(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) throw new ForbiddenException('Not your booking');
    if (!booking.proposedDate || !booking.proposedTime) {
      throw new BadRequestException('No proposed time to confirm');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        date: booking.proposedDate,
        time: booking.proposedTime,
        status: 'ACCEPTED',
      },
    });
  }

  private validateStatusTransition(current: BookingStatus, next: BookingStatus, role: string) {
    const vendorTransitions: Record<string, BookingStatus[]> = {
      PENDING: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    };

    const customerTransitions: Record<string, BookingStatus[]> = {
      PENDING: ['CANCELLED'],
      ACCEPTED: ['CANCELLED'],
    };

    const allowed =
      role === 'VENDOR'
        ? vendorTransitions[current] || []
        : role === 'ADMIN'
          ? Object.values(BookingStatus)
          : customerTransitions[current] || [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(`Cannot transition from ${current} to ${next}`);
    }
  }
}
