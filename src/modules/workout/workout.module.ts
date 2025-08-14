import { Module } from "@nestjs/common";
import { Workouts } from '../../../generated/prisma/index';
import { PrismaService } from "src/prisma/prisma.service";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { WorkoutService } from "./workout.service";
import { WorkoutController } from "./workout.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ExerciseUtilsService } from "./exercise.utils";
import { ErrorHandlerService } from "src/error/error-handler.service";


@Module ({
    imports: [PrismaModule, AuthModule],
    controllers: [WorkoutController],
    providers: [ExerciseUtilsService,PrismaService, CloudinaryService,ErrorHandlerService, WorkoutService, ],
    exports:[WorkoutService],
})

export class WorkoutModule{}