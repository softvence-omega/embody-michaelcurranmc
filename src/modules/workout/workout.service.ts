import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateCommentDto } from "../posts/dto/create-comment.dto";
import { CreateWorkoutDto } from "./dto/create-workout.dto";



@Injectable()
export class WorkoutService{

    constructor(private prisma: PrismaService) {}
async createWorkout(createWorkoutDto: CreateWorkoutDto) {
    return this.prisma.workouts.create( {
        data: {
            title: createWorkoutDto.title,
            is_public: true,
            timer_active: false,
            exercises: {
                create: createWorkoutDto.exercise.map(exercise => ({
                    name: exercise.name,
                    type: exercise.type,
                    timer_active: false,
                    sets: {
                        create: exercise.setes.map(set => ({}))
                    }
                }))
            }
        }
    })
}

}