import { Controller, Get, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('vendors/pending')
  @ApiOperation({ summary: 'Get pending vendor verifications' })
  getPendingVendors() {
    return this.adminService.getPendingVendors();
  }

  @Patch('vendors/:id/verify')
  @ApiOperation({ summary: 'Verify or reject vendor' })
  verifyVendor(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.adminService.verifyVendor(id, approved);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getUsers(@Query('role') role?: string) {
    return this.adminService.getAllUsers(role);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate user' })
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings' })
  getBookings(@Query('status') status?: string) {
    return this.adminService.getAllBookings(status);
  }

  @Get('documents/pending')
  @ApiOperation({ summary: 'Get pending documents' })
  getPendingDocuments() {
    return this.adminService.getPendingDocuments();
  }

  @Patch('documents/:id/approve')
  @ApiOperation({ summary: 'Approve document' })
  approveDocument(@Param('id') id: string) {
    return this.adminService.approveDocument(id);
  }

  @Patch('documents/:id/reject')
  @ApiOperation({ summary: 'Reject document' })
  rejectDocument(@Param('id') id: string) {
    return this.adminService.rejectDocument(id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews' })
  getReviews() {
    return this.adminService.getAllReviews();
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Patch('reviews/:id/flag')
  @ApiOperation({ summary: 'Flag review' })
  flagReview(@Param('id') id: string) {
    return this.adminService.flagReview(id);
  }
}
