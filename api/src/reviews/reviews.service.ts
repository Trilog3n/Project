import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenException('Not your booking');
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed bookings');
    }
    if (booking.review) throw new BadRequestException('Review already exists');

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        customerId,
        vendorId: booking.vendorId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images || [],
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    await this.updateVendorRating(booking.vendorId);
    return review;
  }

  async getByVendor(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { vendorId, isFlagged: false },
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(limit, 100),
      }),
      this.prisma.review.count({ where: { vendorId, isFlagged: false } }),
    ]);
    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(customerId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.customerId !== customerId) throw new ForbiddenException('Not your review');

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating ?? review.rating,
        comment: dto.comment ?? review.comment,
        images: dto.images ?? review.images,
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    // Recalculate vendor rating after update
    await this.updateVendorRating(review.vendorId);
    return updated;
  }

  private async updateVendorRating(vendorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { vendorId, isFlagged: false },
      select: { rating: true },
    });
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    await this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { rating: Math.round(avg * 10) / 10 },
    });
  }
}
