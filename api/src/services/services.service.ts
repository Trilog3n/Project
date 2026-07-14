import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private vendorsService: VendorsService,
  ) {}

  async create(userId: string, dto: CreateServiceDto) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    return this.prisma.service.create({
      data: { ...dto, vendorId: profile.id },
      include: { category: true },
    });
  }

  async findByVendor(vendorId: string) {
    return this.prisma.service.findMany({
      where: { vendorId, isActive: true },
      include: { category: true },
    });
  }

  async findMyServices(userId: string) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    return this.findByVendor(profile.id);
  }

  async update(userId: string, serviceId: string, dto: UpdateServiceDto) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.vendorId !== profile.id) {
      throw new ForbiddenException('Not your service');
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
      include: { category: true },
    });
  }

  async remove(userId: string, serviceId: string) {
    const profile = await this.vendorsService.ensureVendorProfile(userId);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.vendorId !== profile.id) {
      throw new ForbiddenException('Not your service');
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }
}
