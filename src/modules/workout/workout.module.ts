import { Module } from "@nestjs/common";
import { Workouts } from '../../../generated/prisma/index';
import { PrismaService } from "src/prisma/prisma.service";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { WorkoutService } from "./workout.service";
import { WorkoutController } from "./workout.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";


@Module ({
    imports: [PrismaModule, AuthModule],
    controllers: [WorkoutController],
    providers: [PrismaService, CloudinaryService],
    exports:[WorkoutService],
})

export class WorkoutModule{}