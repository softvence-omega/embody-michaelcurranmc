import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({ description: 'Post title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Post content', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Post caption', required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ description: 'Is post public?', required: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiProperty({ description: 'Is post featured?', required: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}