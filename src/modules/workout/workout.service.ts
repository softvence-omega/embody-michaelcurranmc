import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from '../posts/dto/create-comment.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { Prisma } from 'generated/prisma';
import { timeout, timer, timestamp } from 'rxjs';
import { ExerciseUtilsService } from './exercise.utils';
import { ErrorHandlerService } from 'src/error/error-handler.service';


interface ExerciseWithSets {
  id: string;
  sets: Array<{
    id: string;
    duration: string | number;
    transition_time?: number;
  }>;
}
@Injectable()
export class WorkoutService {
  private readonly logger = new Logger(WorkoutService.name);

  constructor(
    private prisma: PrismaService,
    private exerciseUtils: ExerciseUtilsService,
    private errorHandler: ErrorHandlerService,
  ) {}
  private formatSuccessResponse(message: string, data: object) {
    return {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString,
    };
  }

  async createWorkout(createWorkoutDto: CreateWorkoutDto) {
    const { title, description, exercises } = createWorkoutDto;
    await this.exerciseUtils.validateUpdateInput('', {
      exercise: createWorkoutDto.exercises,
    });
    const workoutData = {
      title,
      description,
      is_public: true,
      timer_active: false,
      exercises: {
        create: createWorkoutDto.exercises.map((exercise) => ({
          name: exercise.name,
          type: exercise.type,
          timer_active: false,
          sets: {
            create:
              exercise.sets.map((set) => ({
                set_number: set.setNumber,
                weight: set.weight,
                reps: set.reps,
                distance_km: set.distanceKm,
                duration: set.duration,
                timer_active: false,
              })) || [],
          },
        })),
      },
    };
    try {
      return this.prisma.$transaction(async (prisma) => {
        return prisma.workouts.create({
          data: workoutData,
          include: { exercises: { include: { sets: true } } },
        });
      });
    } catch (err) {
      this.logger.error('Unknown error during workout creation', err);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async updateWorkout(id: string, updateWorkoutDto: UpdateWorkoutDto) {
    this.exerciseUtils.validateUpdateInput(id, updateWorkoutDto);
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const existingWorkout = await prisma.workouts.findUnique({
            where: { id },
            select: { id: true },
          });

          if (!existingWorkout) {
            throw new BadRequestException(`Workout with ID ${id} not found`);
          }
          const updateData = await this.prepareUpdateData(updateWorkoutDto);

          return await prisma.workouts.update({
            where: { id },
            data: updateData,
            include: {
              exercises: {
                include: {
                  sets: true,
                },
              },
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 10000,
        },
      );
    } catch (error) {
      this.errorHandler.handleError(
        error,
        'update',
        'workout',
        id,
        'Failed to update workout details',
      );
    }
  }

  async prepareUpdateData(
    dto: UpdateWorkoutDto,
  ): Promise<Prisma.WorkoutsUpdateInput> {
    return {
      title: dto.title,
      description: dto.description,
      exercises: {
        deleteMany: {},
        create:
          dto.exercise?.map((exercise) => ({
            name: exercise.name,
            type: exercise.type,
            timer_active: false,
            sets: {
              create: exercise.sets.map((set) => ({
                set_number: set.setNumber,
                weight: set.weight,
                reps: set.reps,
                distance_km: set.distanceKm,
                timer_active: set.timer_active ?? false,
              })),
            },
          })) ?? [],
      },
    };
  }

  async deleteExerciseSet(exerciseSetId: string) {
    const startTime = Date.now();
    this.logger.debug(`Attempting to delete exercise set ${exerciseSetId}`);
    try {
      await this.exerciseUtils.checkSetExits(exerciseSetId);

      const deletedSet = await this.prisma.exerciseSet.delete({
        where: { id: exerciseSetId },
        select: { id: true, exercise_id: true },
      });

      this.logger.log(
        `Successfully deleted exercise set ${exerciseSetId} in ${Date.now() - startTime}ms`,
      );
      return this.formatSuccessResponse('Exercise set deleted', {
        id: deletedSet.id,
        exerciseId: deletedSet.exercise_id,
      });
    } catch (err) {
      this.errorHandler.handleError(
        err,
        'delete',
        'exerciseSet',
        exerciseSetId,
      );
    }
  }

  async deleteExercise(exerciseId: string) {
    const startTime = Date.now();
    this.logger.debug(
      `Attempting to delete exercise ${exerciseId} with all sets`,
    );

    try {
      await this.exerciseUtils.checkExerciseExists(exerciseId);

      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Batch delete to handle large numbers of sets efficiently
          await this.exerciseUtils.batchDeleteSets(prisma, exerciseId);

          return await prisma.exercise.delete({
            where: { id: exerciseId },
            select: { id: true }, // Only return ID
          });
        },
        {
          maxWait: 10000, // 10 second max wait for transaction
          timeout: 10000, // 10 second timeout for transaction
        },
      );

      this.logger.log(
        `Successfully deleted exercise ${exerciseId} and all sets in ${Date.now() - startTime}ms`,
      );
      return this.formatSuccessResponse(
        'Exercise and all associated sets deleted',
        { id: result.id },
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'delete', 'exercise', exerciseId);
    }
  }

  async toggleWorkoutTimer(id: string, active: boolean) {
    const timerLabel = `WorkoutTimer ${id}`;

    console.time(timerLabel);

    try {
      await this.exerciseUtils.validateWorkoutExists(id);

      const updatedWorkout = await this.prisma.$transaction(async (tx) => {
        const workout = await tx.workouts.update({
          where: { id},
          data: {timer_active: active},
          include: {exercises: {select: {id: true}}},

        })
        if(!active){
          await this.deactivateAllTimers(tx, id, workout.exercises.map(e => e.id)); 
        }
        return workout;
      })
      const duration = Date.now() - (console as any)._times?.[timerLabel] || 0;
      console.timeEnd(timerLabel);
      this.exerciseUtils.logOperationSuccess('Workout timer', id, active, duration);
      return this.formatSuccessResponse('workout', { id: updatedWorkout.id, active });

    } catch(err) {
      this.errorHandler.handleError(err, 'toggle', 'workout', id);
    }
  }

  async toggleExerciseTimer(workoutId: string, exerxiseId: string, active: boolean){
    const timerLabel = `ExerciseTimer${exerxiseId}`;
     console.time(timerLabel);

     try{
      await this.exerciseUtils.validateExerciseExists(workoutId, exerxiseId);

      const updatedExercise = await this.prisma.$transaction(async (tx)=> {
        const exercise = await tx.exercise.update({
          where: {id: exerxiseId, workout_id: workoutId},
          data: {timer_active:active},
          include: {sets: {select: {id: true}}},
        });
        if(!active) {
          await tx.exerciseSet.updateMany({
            where: { exercise_id: exerxiseId},
            data: { timer_active: false},
          });

        }
      return exercise;
      })
      const duration = Date.now() - ((console as any)._times?.[timerLabel] || 0);
      console.timeEnd(timerLabel);
      this.exerciseUtils.logOperationSuccess('Exercise timer', exerxiseId, active, duration);
      return this.formatSuccessResponse('exercise', { id:updatedExercise.id, active});
     } catch(err) {
      this.errorHandler.handleError(err, 'toggle', exerxiseId, `Workout ID: ${workoutId}`);
     }

  }

  async toggleExerciseSetTimer(workoutId: string, exerciseId: string, setId: string, active: boolean) {
    const timerLabel = `SetTimer- ${setId}`;
    console.time(timerLabel);

    try {
      await this.exerciseUtils.validateSetExists(workoutId, exerciseId, setId);
      const updatedSet = await this.prisma.exerciseSet.update({
        where: {id: setId, exercise_id: exerciseId},
        data: { timer_active: active},
      });
       const duration = Date.now() - (console as any)._times?.[timerLabel] || 0;
      console.timeEnd(timerLabel);
      this.exerciseUtils.logOperationSuccess('Exercise set timer', setId, active, duration);

    } catch(err) {
      this.errorHandler.handleError(err, 'toggle', 'exerciseSetTimer', setId, `Workout ID: ${workoutId}, Exercise ID: ${exerciseId}`);
    }
  }

  async startWorkoutSequence(workoutId: string) {
    const timerLabel = `WorkoutSequence-${workoutId}`;
    console.time(timerLabel);

    try{
      const workout = await this.exerciseUtils.getWorkoutWithTimers(workoutId);
      if(!workout ){
        await this.toggleWorkoutTimer(workoutId, true);
      }

      for(const exercise of workout.exercises) {
        await this.processExerciseSequence(workoutId, exercise)
      }

      await this.toggleWorkoutTimer(workoutId, false);
      this.logger.log(`Workout sequence completed for ${workoutId} in ${console.timeEnd(timerLabel)}ms`);
      return this.formatSuccessResponse('Workout squence completed', { workoutId});

    } catch(err){
      await this.emergencyStopTimers(workoutId);
      this.errorHandler.handleError(err, 'start', 'workoutSequence', workoutId);

    }
  }




  //========helper methods====

  private async processExerciseSequence(workoutId: string, exercise: ExerciseWithSets) {
    await this.toggleExerciseTimer(workoutId, exercise.id, true);

    for(const set of exercise.sets) {
      await this.toggleExerciseSetTimer(workoutId, exercise.id, set.id, true);
      await this.exerciseUtils.delay(this.exerciseUtils.parseDuration(set.duration));
      await this.toggleExerciseSetTimer(workoutId, exercise.id, set.id, false);
      await this.exerciseUtils.delay(set.transition_time || 30);
    }
    await this.toggleExerciseTimer(workoutId, exercise.id, false);
  }

  private async emergencyStopTimers(workoutId: string) {
    try {
      const workout = await this.prisma.workouts.findUnique({
        where: {id: workoutId},
        include: {exercises: {include: { sets: true}}},

      });

      if(workout?.timer_active) {
        await this.toggleWorkoutTimer(workoutId, false);
      };

    } catch(err) {
      this.logger.error('Emergency stop failed', err);

    }

  }

  private async deactivateAllTimers(
    tx: Prisma.TransactionClient,
    workoutId: string,
    exerciseId: string[],
  ) {
    await Promise.all([
      tx.exercise.updateMany({
        where: {workout_id: workoutId},
        data: { timer_active: false}
      }),
      tx.exerciseSet.updateMany({
        where: { exercise_id: { in: exerciseId}},
        data: { timer_active: false}
      }),
    ]);
    
  }
  

}
