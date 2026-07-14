import { IsOptional, IsString, MaxLength, Matches, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international format',
  })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'LinkedIn URL must be a valid URL with protocol' })
  @MaxLength(500)
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Website URL must be a valid URL with protocol' })
  @MaxLength(500)
  websiteUrl?: string;
}
