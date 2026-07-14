import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const DOCUMENT_TYPES = [
  'GOVERNMENT_ID',
  'CERTIFICATE',
  'TRADE_LICENSE',
  'POLICE_VERIFICATION',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export class UploadDocumentDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  type: DocumentType;
}

export class ApproveDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
