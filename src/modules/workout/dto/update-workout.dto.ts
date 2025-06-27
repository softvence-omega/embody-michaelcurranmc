import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ExerciseType } from 'generated/prisma';

export class SetDto {
  @ApiProperty({ description: 'The set number', example: 1 })
  @IsInt()
  @IsPositive()
  setNumber: number;

  @ApiPropertyOptional({ description: 'weight in KG', example: 20.5 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  weigth?: number;

  @ApiPropertyOptional({ description: ' Number of repetitions', example: 14 })
  @IsPositive()
  @IsOptional()
  reps?: number;

  @ApiPropertyOptional({ description: 'distance in kilometers', example: 1.5 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  distanceKm?: number;

  @ApiPropertyOptional({ description: 'Duration as string', example: '2:4' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({
    description: ' Whether timer is active for this set',
    example: false,
  })
  timer_active?: boolean;
}

export class ExerciseDto {
  @ApiProperty({ description: 'Berbell bench press', example: 'bench press' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of Exercise',
    enum: ExerciseType,
    example: ExerciseType.strength,
  })
  @IsEnum(ExerciseType)
  type: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetDto)
  sets: SetDto[];

  @ApiPropertyOptional({
    description: 'Whether timer is active for this exercise',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  timer_active?: boolean;
}

export class UpdateWorkoutDto {
  @ApiProperty({
    description: 'Title of the workout',
    example: 'morening routine',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the work',
    example: 'Updated full workout',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of exercises',
    type: [ExerciseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  @IsOptional()
  exercise?: ExerciseDto[];

  @ApiPropertyOptional({
    description: 'Whether the workout is public',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}
