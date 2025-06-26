import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  Get,
  Body,
  UploadedFile,
  BadRequestException,
  Req,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostService } from './post.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from './dto/create-post.dto';

import { Request } from 'express';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('public')
  async getAllPublicPost() {
    return this.postService.getAllPublicPosts();
  }
  @Get()
  async getAllPosts(
    @Req() req: Request & { user?: { id: string } },
    @Query('take') take?: string,
    @Query('cursorId') cursorId?: string,
    @Query('cursorCreatedAt') cursorCreatedAt?: string,
  ) {
    const cursor =
      cursorId && cursorCreatedAt
        ? { id: cursorId, created_at: cursorCreatedAt }
        : undefined;

    return this.postService.getAllPosts(
      req.user?.id,
      Number(take) || 10,
      cursor,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createPost(
    @Body() dto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File | null,
    @Req() req: Request & { user: { id: string } },
  ) {
    if (!dto.title) throw new BadRequestException('Title is required');
    return this.postService.createPost(dto, file, req.user.id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updatePost(
    @Param('id') postId: string,
    @Body() dot: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File | null,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.updatePost(postId, dot, file, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.deletePost(postId, req.user.id);
  }
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLikePost(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    // Implement the like/unlike logic here
    return this.postService.toggleLikePost(postId, req.user.id);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async commentPost(
    @Param('id') postId: string,
    @Body('content') content: string,
    @Body('parentId') parentId: string | undefined,
    @Req() req: Request & { user: { id: string } },
  ) {
    if (!content) throw new BadRequestException('Comment content is required');
    return this.postService.commentPost(postId, req.user.id, content, parentId);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('id') commentId: string, 
    @Req() req: Request & { user: {id: string}}
  ) {
    console.log('Delete Comment - commentId:', commentId, 'userId:', req.user.id);
    return this.postService.deleteComment(commentId, req.user.id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  async sharePost(@Param('id') postId: string, @Req() req: Request & { user: { id: string}}) {
    return this.postService.sharePost(postId, req.user.id);
  }
  @Get('search')
  async searchPosts(
    @Query('query') query: string,
    @Req() req: Request & { user?: { id: string}},
    @Query('take') take?: string,
    @Query('cursorId') cursorId?: string,
    @Query('cursorCreatedAt') cursorCreatedAt?: string,
  ) {
    if(!query) throw new BadRequestException(" Search query is required");
    const cursor = cursorId && cursorCreatedAt ? { id: cursorId,  created_at: cursorCreatedAt} : undefined;
    return this.postService.searchPosts(query, req.user?.id, Number(take) || 10, cursor);

  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  async getComments(
    @Param('id') postId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10'
  ) {
    console.log('Get comments- postId:', postId, 'Skip:', skip, 'take:', take);
    const skipNum = parseInt(skip);
    const takeNum = parseInt(take);
    if(isNaN(skipNum) || isNaN(takeNum)) {
      throw new BadRequestException("Invalid skip or take parameters");
    }
    return this.postService.getComments(postId, skipNum, takeNum);
  }




}
