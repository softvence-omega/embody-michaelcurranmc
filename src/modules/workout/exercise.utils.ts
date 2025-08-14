import {
  Injectable,
  Logger,
  Delete,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { error } from 'console';
import { timestamp } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

interface ExerciseWithSets {
  id: string;
  sets: Array<{
    id: string;
    duration: string | number;
    transition_time?: number;
  }>;
}

@Injectable()
export class ExerciseUtilsService {
  private readonly logger = new Logger(ExerciseUtilsService.name);
  private readonly batchSize: number = Number(process.env.BATCH_SIZE);

  constructor(private readonly prisma: PrismaService) {}

  async validateUpdateInput(id: string, dto: any) {
    const { exercise } = dto;
    if (!exercise?.length) {
      throw new BadRequestException('At least one exercise is required');
    }
    if (exercise.some((exercise) => !exercise.sets?.length)) {
      throw new BadRequestException('Each exercise must have at least one set');
    }
  }

  async batchDeleteSets(prisma: Prisma.TransactionClient, exerciseId: string) {
    let hasMore = true;
    while (hasMore) {
      const deletedCount = await prisma.exerciseSet.deleteMany({
        where: { exerciseId: exerciseId },
        take: this.batchSize,
      });
      hasMore = deletedCount.count === this.batchSize;
    }
  }

  async checkSetExits(setId: string) {
    const exists = await this.prisma.exerciseSet.findUnique({
      where: { id: setId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Exercise set ${setId} not found`);
    }
  }

  async checkExerciseExists(exerciseId: string) {
    const exists = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Exercise ${exerciseId} not found`);
    }
  }

  async getWorkoutWithTimers(workoutId: string) {
    return this.prisma.workouts.findUnique({
      where: {
        id: workoutId,
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { set_number: 'asc' },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });
  }

  delay(second: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, second * 1000));
  }

  parseDuration(duration: string | number): number {
    return typeof duration === 'string' ? parseInt(duration, 10) : duration;
  }

  logOperationSuccess(
    entityTye: string,
    id: string,
    active: boolean,
    duration: number,
  ) {
    this.logger.log(
      `${entityTye} ${id} ${active ? 'activate' : 'deactivated'} in ${duration}ms`,
    );
  }

  formatTimerResponse(entityType: string, id: string, active: boolean) {
    return {
      status: 'success',
      message: `${entityType} timer ${active ? 'started' : 'stopped'}`,
      data: { id, timer_active: active },
      timestamp: new Date().toISOString(),
    };
  }
     async validateWorkoutExists(workoutId: string) {
    const exists = await this.prisma.workouts.count({
      where: { id: workoutId },
    });
    if (!exists) throw new NotFoundException(`Workout ${workoutId} not found`);
  }

   async validateExerciseExists(workoutId: string, exerciseId: string) {
    const exists = await this.prisma.exercise.count({
      where: { id: exerciseId, workout_id: workoutId },
    });

    if (!exists)
      throw new NotFoundException(
        `Exercise ${exerciseId} not found in workout ${workoutId}`,
      );
  }

   async validateSetExists(
    workoutId: string,
    exerciseId: string,
    setId: string,
  ) {
    const exists = await this.prisma.exerciseSet.count({
      where: { id: setId, exercise_id: exerciseId },
    });
    if (!exists)
      throw new NotFoundException(
        `Set ${setId} not found in exercise ${exerciseId}`,
      );
  }
  
}
