import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { UpdateVendorProfileDto, SearchVendorsDto, WorkingHoursDto } from './dto/vendors.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public, Roles } from '../common/decorators/auth.decorator';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search vendors' })
  search(@Query() dto: SearchVendorsDto) {
    return this.vendorsService.search(dto);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured vendors' })
  getFeatured(@Query('city') city?: string) {
    return this.vendorsService.getFeatured(city);
  }

  @Get('me/profile')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own vendor profile' })
  getMyProfile(@CurrentUser('sub') userId: string) {
    return this.vendorsService.getMyProfile(userId);
  }

  @Patch('me/profile')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateVendorProfileDto) {
    return this.vendorsService.updateProfile(userId, dto);
  }

  @Patch('me/working-hours')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update working hours' })
  updateWorkingHours(@CurrentUser('sub') userId: string, @Body() hours: WorkingHoursDto[]) {
    return this.vendorsService.updateWorkingHours(userId, hours);
  }

  @Get('me/dashboard')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor dashboard stats' })
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.vendorsService.getDashboardStats(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get vendor profile by ID' })
  getById(@Param('id') id: string) {
    return this.vendorsService.getById(id);
  }
}
