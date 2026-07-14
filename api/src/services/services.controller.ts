import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorator';
import { Public } from '../common/decorators/auth.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Public()
  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get services by vendor' })
  findByVendor(@Param('vendorId') vendorId: string) {
    return this.servicesService.findByVendor(vendorId);
  }

  @Get('my')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my services' })
  findMy(@CurrentUser('sub') userId: string) {
    return this.servicesService.findMyServices(userId);
  }

  @Post()
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(userId, dto);
  }

  @Patch(':id')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(userId, id, dto);
  }

  @Delete(':id')
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.servicesService.remove(userId, id);
  }
}
