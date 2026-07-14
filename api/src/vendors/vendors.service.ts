import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorProfileDto, SearchVendorsDto, WorkingHoursDto } from './dto/vendors.dto';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchVendorsDto) {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      user: { status: 'ACTIVE', role: 'VENDOR' },
      vacationMode: false,
    };

    if (dto.city) where.city = dto.city;
    if (dto.verifiedOnly) where.verified = true;
    if (dto.minRating) where.rating = { gte: dto.minRating };
    if (dto.query) {
      where.OR = [
        { bio: { contains: dto.query, mode: 'insensitive' } },
        { user: { name: { contains: dto.query, mode: 'insensitive' } } },
      ];
    }
    if (dto.category) {
      where.services = { some: { category: { name: dto.category }, isActive: true } };
    }
    if (dto.minPrice || dto.maxPrice) {
      where.services = {
        some: {
          isActive: true,
          ...(dto.minPrice && { price: { gte: dto.minPrice } }),
          ...(dto.maxPrice && { price: { lte: dto.maxPrice } }),
        },
      };
    }

    let orderBy: Record<string, string> = { rating: 'desc' };
    if (dto.sortBy === 'experience') orderBy = { experience: 'desc' };
    if (dto.sortBy === 'rating') orderBy = { rating: 'desc' };

    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          services: { where: { isActive: true }, include: { category: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return {
      data: vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeatured(city = 'Kochi') {
    return this.prisma.vendorProfile.findMany({
      where: { verified: true, city, user: { status: 'ACTIVE' } },
      include: {
        user: { select: { id: true, name: true } },
        services: { where: { isActive: true }, take: 3, include: { category: true } },
      },
      orderBy: { rating: 'desc' },
      take: 6,
    });
  }

  async getById(id: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        services: { where: { isActive: true }, include: { category: true } },
        workingHours: true,
        reviews: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        documents: { where: { status: 'APPROVED' }, select: { type: true, status: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        services: { include: { category: true } },
        workingHours: true,
        documents: true,
      },
    });
    if (!profile) throw new NotFoundException('Vendor profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateVendorProfileDto) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    return this.prisma.vendorProfile.update({
      where: { userId },
      data: dto,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
  }

  async updateWorkingHours(userId: string, hours: WorkingHoursDto[]) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    await this.prisma.workingHours.deleteMany({ where: { vendorId: profile.id } });
    await this.prisma.workingHours.createMany({
      data: hours.map((h) => ({ ...h, vendorId: profile.id })),
    });

    return this.prisma.workingHours.findMany({ where: { vendorId: profile.id } });
  }

  async getDashboardStats(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Vendor profile not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayBookings, upcoming, completed] = await Promise.all([
      this.prisma.booking.count({
        where: { vendorId: profile.id, date: { gte: today, lt: tomorrow } },
      }),
      this.prisma.booking.count({
        where: { vendorId: profile.id, status: { in: ['PENDING', 'ACCEPTED'] }, date: { gte: today } },
      }),
      this.prisma.booking.count({
        where: { vendorId: profile.id, status: 'COMPLETED' },
      }),
    ]);

    return {
      todayBookings,
      upcoming,
      completed,
      rating: profile.rating,
    };
  }

  async ensureVendorProfile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Vendor profile required');
    return profile;
  }
}
