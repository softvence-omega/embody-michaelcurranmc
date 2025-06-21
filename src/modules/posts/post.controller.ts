import { Controller, UseGuards, UseInterceptors, Post, Body, UploadedFile, BadRequestException,Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PostService } from './post.service';
import { FileInterceptor } from "@nestjs/platform-express";
import { CreatePostDto } from './dto/create-post.dto';




@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
    constructor(private readonly postService:PostService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async createPost(
        @Body() dto: CreatePostDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request & { user: {id: string}}
    ) {

        if(!dto.title) throw new BadRequestException('Title is required');
        return this.postService.createPost(dto, file, req.user.id);
    }
}


