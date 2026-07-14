import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto, BookingQueryDto, ProposeBookingTimeDto } from './dto/bookings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Create booking' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  @Get('my')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Get customer bookings' })
  findMy(@CurrentUser('sub') userId: string, @Query() query: BookingQueryDto) {
    return this.bookingsService.findCustomerBookings(userId, query);
  }

  @Get('vendor')
  @Roles('VENDOR')
  @ApiOperation({ summary: 'Get vendor bookings' })
  findVendor(@CurrentUser('sub') userId: string, @Query() query: BookingQueryDto) {
    return this.bookingsService.findVendorBookings(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingsService.findById(id, userId, role);
  }

  @Patch(':id/status')
  @Roles('CUSTOMER', 'VENDOR', 'ADMIN')
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(userId, role, id, dto);
  }

  @Patch(':id/propose-time')
  @Roles('VENDOR')
  @ApiOperation({ summary: 'Vendor proposes an alternative time' })
  proposeTime(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ProposeBookingTimeDto,
  ) {
    return this.bookingsService.proposeTime(userId, id, dto);
  }

  @Patch(':id/confirm-time')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Customer confirms vendor proposed time' })
  confirmTime(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bookingsService.confirmProposedTime(userId, id);
  }
}
