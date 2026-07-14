import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaints.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'File a complaint' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(userId, dto);
  }

  @Get('my')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Get my complaints' })
  findMy(@CurrentUser('sub') userId: string) {
    return this.complaintsService.findMy(userId);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all complaints (admin)' })
  findAll(@Query('status') status?: string) {
    return this.complaintsService.findAll(status);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update complaint (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateComplaintDto) {
    return this.complaintsService.update(id, dto);
  }
}
