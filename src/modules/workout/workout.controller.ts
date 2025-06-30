import {  UseGuards,
     Controller,
  Post,
  Put,
  Param,
  Delete,
  Body,
  HttpStatus,
  HttpException,
 } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WorkoutService } from "./workout.service";
import { CreateWorkoutDto } from "./dto/create-workout.dto";
import { UpdateWorkoutDto } from "./dto/update-workout.dto";




@Controller('workout')
// @UseGuards(JwtAuthGuard)
export  class WorkoutController {
    constructor(private readonly workoutService: WorkoutService) {}

    @Post()
    async createWorkout(@Body() createWorkoutDto: CreateWorkoutDto) {
        try{
            const workout = await this.workoutService.createWorkout(createWorkoutDto);
            return { status: HttpStatus.CREATED, data: workout};
        } catch(err){
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        }
    } 

    @Put(':id')
    async updateWorkout(
        @Param('id') id: string,
        @Body() updateWorkerDto: UpdateWorkoutDto,
    ) {
        try {
            const workout = await this.workoutService.updateWorkout(id, updateWorkerDto);
            return { status: HttpStatus.OK, data: workout};
        }catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put(':id/toggle-timer')
    async toggleWorkoutTimer(
        @Param('id') id: string,
        @Body('active') active: boolean,
    ) {
        try{
            const result = await this.workoutService.toggleWorkoutTimer(id,active);
            const { status, ...rest } = result;
            return { status: HttpStatus.OK, ...rest };
        } catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }
    @Put(':workoutId/exercises/:exerciseId/toggle-timer')
    async toggleExerciseTimer(
        @Param('workoutId') workoutId: string,
        @Param('exerciseId') exerciseId: string,
        @Body('active') active: boolean,
    ){
        try{
            const result = await this.workoutService.toggleExerciseTimer(workoutId, exerciseId, active);

            const { status, ...rest } = result;
            return { status: HttpStatus.OK, ...rest};

        } catch(err){
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @Put(':workoutId/exercises/:exerciseId/sets/:setId/toggle-timer')
    async toggleExerciseSetTimer(
        @Param('workoutId') workoutId: string,
        @Param('exerciseId') exerciseId: string,
        @Param('setId') setId: string,
        @Body('active') active: boolean,
    ){
        try{
            const result = await this.workoutService.toggleExerciseSetTimer(workoutId, exerciseId, setId,active);
            return { status: HttpStatus.OK, data: result };
        } catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post(':id/start-sequence')
    async startWorkoutSequence(@Param('id') id: string) {
        try{
            const result = await this.workoutService.startWorkoutSequence(id);
            return { status: HttpStatus.OK, data: result};
        } catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

    @Delete(':exerciseSetId')
    async deleteExerciseSet(@Param('exerciseSetId') exerciseSetId: string) {
        try{
            const result =await this.workoutService.deleteExerciseSet(exerciseSetId);
            return { status: HttpStatus.OK, data: result};

        } catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

    @Delete('exercises/:exerciseId')
    async deleteExercise(@Param('exerciseId') exerciseId: string) {
        try {
            const result = await this.workoutService.deleteExercise(exerciseId);
            return {status: HttpStatus.OK, data: result};

        } catch(err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);

        }
    }

}
