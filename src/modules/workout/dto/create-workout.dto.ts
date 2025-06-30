import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// import { SetDto, ExerciseDto } from './update-workout.dto'; // Commented out to avoid duplicate declaration
import { Exercise, ExerciseType } from '../../../../generated/prisma/index';
import { 
    IsArray,
  IsBoolean, 
  IsInt, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  IsString, 
  Min, 
  ValidateNested
} from 'class-validator';



export class SetDto {
    @ApiProperty({
        description: ' The ordinal number of the set in the exercise', 
        example:1,
        minimum: 1,
    })
    @IsInt()
    @IsPositive()
    setNumber: number;

    @ApiPropertyOptional({
        description: 'Weight used in kilograms',
        example: 20.0,
        minimum: 0
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    weight?: number;

    @ApiPropertyOptional({
        description: 'Number of repetitions performed',
        example: 12,
        minimum: 1
    })
    @IsInt()
    @IsPositive()
    @IsOptional()
    reps?: number;

    @ApiPropertyOptional({
        description:" Distance covered in kilometers for cardio",
        example: 4.3,
        minimum: 0
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    distanceKm?: number;

    @ApiPropertyOptional({
        description: 'Duration of the set in HH:MM:SS or MM:SS format',
        example: '1:30'
    })
    @IsString()
    @IsOptional()
    duration?: string;

    @ApiPropertyOptional({
        description: "Whether the timner is active for this set ",
        example: false
    })
    @IsBoolean()
    @IsOptional()
    timer_active?: boolean;


}

export class ExerciseDto {
    @ApiProperty({
        description: 'Name of the exercise', 
        example: 'Bench press'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Type of exercise',
        enum: ExerciseType,
        example: ExerciseType.strength
    })
    type: string;

    @ApiProperty({
        description: 'List of sets for this exercise',
        type: [SetDto]
    })
    @IsArray()
    @ValidateNested({each: true})
    @Type(()=> SetDto)
    sets: SetDto[];

    @ApiPropertyOptional({
        description: 'Whether the time is active for this exercise',
        example: true
    })
    @IsBoolean()
    @IsOptional()
    timer_active?: boolean;
}

export class CreateWorkoutDto {
    @ApiProperty({ description: "Title of the workout", example: 'Updder body strength Training'})
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({
        description: 'Description of the workout',
        example: 'Focus on chest and back muscles'
    })
    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    timer_active?: boolean;

    @ApiProperty({
        description: 'List of exercise in the workout',
        type: [ExerciseDto]
    })
    @IsArray()
    @ValidateNested({each: true})
    @Type(()=> ExerciseDto)
    exercises: ExerciseDto[];
}