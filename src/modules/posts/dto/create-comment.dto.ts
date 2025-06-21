import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Parent comment ID for replies', required: false })
  @IsOptional()
  @IsString()
  parent_id?: string;
}