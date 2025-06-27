import { Controller, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WorkoutService } from "./workout.service";



@Controller('workout')
@UseGuards(JwtAuthGuard)
export  class WorkoutController {
    constructor(private readonly workoutService: WorkoutService) {}
}
