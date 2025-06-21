import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "src/prisma/prisma.service";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [PostController],
    providers: [PostService, PrismaService, CloudinaryService],
    exports: [PostService],
})
export class PostModule{}