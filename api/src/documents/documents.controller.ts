import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, ApproveDocumentDto } from './dto/documents.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('my')
  @Roles('VENDOR')
  @ApiOperation({ summary: 'Get my documents' })
  findMy(@CurrentUser('sub') userId: string) {
    return this.documentsService.findMyDocuments(userId);
  }

  @Post('upload')
  @Roles('VENDOR')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload verification document' })
  upload(
    @CurrentUser('sub') userId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(userId, dto.type, file);
  }

  @Patch(':documentId/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve document (Admin only)' })
  approve(@Param('documentId') documentId: string) {
    return this.documentsService.approve(documentId);
  }

  @Patch(':documentId/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject document (Admin only)' })
  reject(
    @Param('documentId') documentId: string,
    @Body() dto: ApproveDocumentDto,
  ) {
    return this.documentsService.reject(documentId, dto.reason);
  }
}
