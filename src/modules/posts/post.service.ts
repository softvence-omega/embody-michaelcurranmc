import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  UploadedFile,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Logger } from '@nestjs/common';
import { create } from 'domain';
// Remove the following line:
// import { Prisma } from '@prisma/client';
// Add this import:
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //   async createPost(
  //     dto: CreatePostDto,
  //     file: Express.Multer.File | null,
  //     userId: string,
  //   ) {
  //     try {

  //     // Validate user existence (optional, depending on requirements)
  //     const user = await this.prismaService.user.findUnique({

  //       where: { id: userId },
  //     });
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     // Handle media upload
  //     let mediaUpload: {
  //       secure_url: string;
  //       public_id: string;
  //       resource_type: 'image' | 'video';
  //     } | null = null;
  //     if (file) {
  //       const mime = file.mimetype;
  //       console.log('File MIME type:', mime);
  //       if (mime.startsWith('image/')) {
  //         const uploadResult = await this.cloudinaryService.uploadImage(file);
  //         if (uploadResult.resource_type !== 'image') {
  //           throw new BadRequestException(
  //             `Expected image resource, got ${uploadResult.resource_type}`,
  //           );
  //         }
  //         mediaUpload = {
  //           secure_url: uploadResult.secure_url,
  //           public_id: uploadResult.public_id,
  //           resource_type: uploadResult.resource_type,
  //         };
  //       } else if (mime.startsWith('video/')) {
  //         const uploadResult = await this.cloudinaryService.uploadVideo(file);
  //         if (uploadResult.resource_type !== 'video') {
  //           throw new BadRequestException(
  //             `Expected video resource, got ${uploadResult.resource_type}`,
  //           );
  //         }
  //         mediaUpload = {
  //           secure_url: uploadResult.secure_url,
  //           public_id: uploadResult.public_id,
  //           resource_type: uploadResult.resource_type,
  //         };
  //       } else {
  //         throw new BadRequestException(`Unsupported file type: ${mime}`);
  //       }
  //     }

  //     // Create post
  //     return this.prismaService.post.create({
  //       data: {
  //         title: dto.title,
  //         content: dto.content,
  //         caption: dto.caption ?? null,
  //         is_public: dto.is_public ?? true,
  //         is_featured: dto.is_featured ?? true,
  //         user_id: userId,
  //         image_url:
  //           mediaUpload?.resource_type === 'image'
  //             ? mediaUpload.secure_url
  //             : null,
  //         video_url:
  //           mediaUpload?.resource_type === 'video'
  //             ? mediaUpload.secure_url
  //             : null,
  //       },
  //     });
  //   } catch( err) {
  //     console.error('Post creation failed:', err);
  //     if (err instanceof BadRequestException || err instanceof NotFoundException) {
  //       throw err;
  //     }
  //     throw new InternalServerErrorException('Failed to create post');

  //   }
  // }

  async createPost(
    dto: CreatePostDto,
    file: Express.Multer.File | null,
    userId: string,
  ) {
    try {
      // Step 1: Validate user
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Step 2: Initialize media object
      let mediaUpload: {
        secure_url: string;
        public_id: string;
        resource_type: 'image' | 'video';
      } | null = null;

      // Step 3: Handle optional file
      if (file?.mimetype) {
        const mime = file.mimetype;

        try {
          if (mime.startsWith('image/')) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            if (uploadResult.resource_type !== 'image') {
              throw new BadRequestException(
                `Expected image, got ${uploadResult.resource_type}`,
              );
            }
            mediaUpload = {
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              resource_type: uploadResult.resource_type,
            };
          } else if (mime.startsWith('video/')) {
            const uploadResult = await this.cloudinaryService.uploadVideo(file);
            if (uploadResult.resource_type !== 'video') {
              throw new BadRequestException(
                `Expected video, got ${uploadResult.resource_type}`,
              );
            }
            mediaUpload = {
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              resource_type: uploadResult.resource_type,
            };
          } else {
            throw new BadRequestException(`Unsupported file type: ${mime}`);
          }
        } catch (uploadErr) {
          console.error('Cloudinary Upload Error:', uploadErr);
          throw new InternalServerErrorException('Media upload failed');
        }
      }

      // Step 4: Create the post
      const createdPost = await this.prismaService.post.create({
        data: {
          title: dto.title ?? 'Untitled Post',
          content: dto.content ?? '',
          caption: dto.caption ?? null,
          is_public: dto.is_public ?? true,
          is_featured: dto.is_featured ?? false,
          user_id: userId,
          image_url:
            mediaUpload?.resource_type === 'image'
              ? mediaUpload.secure_url
              : null,
          video_url:
            mediaUpload?.resource_type === 'video'
              ? mediaUpload.secure_url
              : null,
        },
      });

      return createdPost;
    } catch (err) {
      console.error('Post creation error:', err);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  async updatePost(
    postId: string,
    dto: UpdatePostDto,
    file: Express.Multer.File | null,
    userId: string,
  ) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.user_id !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this post',
      );
    }

    let mediaUpload: {
      secure_url: string;
      public_id: string;
      resource_type: 'image' | 'video';
    } | null = null;
    if (file) {
      const mime = file.mimetype;
      if (mime.startsWith('image/')) {
        const uploadResult = await this.cloudinaryService.uploadImage(file);
        if (uploadResult.resource_type !== 'image') {
          throw new BadRequestException(
            `Expected image resource, got ${uploadResult.resource_type}`,
          );
        }
        mediaUpload = {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type,
        };
      } else if (mime.startsWith('video/')) {
        const uploadResult = await this.cloudinaryService.uploadVideo(file);
        if (uploadResult.resource_type !== 'video') {
          throw new BadRequestException(
            `Expected video resource, got ${uploadResult.resource_type}`,
          );
        }
        mediaUpload = {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type,
        };
      } else {
        throw new BadRequestException(`Unsupported file type: ${mime}`);
      }
    }
    return this.prismaService.post.update({
      where: { id: postId },
      data: {
        title: dto.title ?? post.title,
        content: dto.content ?? post.content,
        caption: dto.caption ?? post.caption,
        is_public: dto.is_public ?? post.is_public,
        is_featured: dto.is_featured ?? post.is_featured,
        image_url:
          mediaUpload?.resource_type === 'image'
            ? mediaUpload.secure_url
            : post.image_url,
        image_publicId:
          mediaUpload?.resource_type === 'image'
            ? mediaUpload.public_id
            : post.image_publicId,
        video_url:
          mediaUpload?.resource_type === 'video'
            ? mediaUpload.secure_url
            : post.video_url,
        video_publicId:
          mediaUpload?.resource_type === 'video'
            ? mediaUpload.secure_url
            : post.video_publicId,
      },
    });
  }
  async getAllPublicPosts() {
    return this.prismaService.post.findMany({
      where: { is_public: true },
    });
  }
  // async getPostById(postId: string) {
  //   const post = this.prismaService.post.findUnique({
  //     where: { id: postId },
  //   });
  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }
  //   return post;
  // }

  async deletePost(postId: string, userId: string) {
    try {
      const post = await this.prismaService.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.user_id !== userId) {
        throw new UnauthorizedException(
          'You are not authorized to delete this post',
        );
      }

      return await this.prismaService.post.delete({
        where: { id: postId },
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      this.logger.error(`Error deleting post ${postId}`, error.stack);

      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong while deleting the post',
      );
    }
  }

  async toggleLikePost(postId: string, userId: string) {
    try {
      const post = await this.prismaService.post.findUniqueOrThrow({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      const existingLike = await this.prismaService.postLike.findUnique({
        where: {
          user_id_post_id: {
            user_id: userId,
            post_id: postId,
          },
        },
      });
      const liked = !existingLike;
      const [_, updatedPost] = await this.prismaService.$transaction([
        liked
          ? this.prismaService.postLike.create({
              data: { user_id: userId, post_id: postId },
            })
          : this.prismaService.postLike.delete({
              where: { user_id_post_id: { user_id: userId, post_id: postId } },
            }),
        this.prismaService.post.update({
          where: { id: postId },
          data: { like_count: { [liked ? 'increment' : 'decrement']: 1 } },
          select: { like_count: true },
        }),
      ]);

      return {
        liked,
        message: `Post ${liked ? 'liked' : 'unliked'}`,
        likeCount: updatedPost.like_count,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error.message;
      }
      throw new InternalServerErrorException(
        ' You are unable to like or unlike this post at the moment. Please try again later.',
      );
    }
  }

  async commentPost(
    postId: string,
    userId: string,
    content: string,
    parentId?: string,
  ) {
    try {
      const post = await this.prismaService.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      if (parentId) {
        const parent = await this.prismaService.postComment.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException('Parent comment not found');
        }
      }
      const [comment, updatedPost] = await this.prismaService.$transaction([
        this.prismaService.postComment.create({
          data: {
            content: content,
            user_id: userId,
            post_id: postId,
            parent_id: parentId,
          },
        }),
        this.prismaService.post.update({
          where: { id: postId },
          data: {
            comment_count: {
              increment: 1,
            },
          },
          select: { comment_count: true },
        }),
      ]);
      return { comment, commentCount: updatedPost.comment_count };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      ) {
        throw err.message;
      }
      throw new InternalServerErrorException(
        'You are unable to comment on this post at the moment. Please try again later.',
      );
    }
  }
  async deleteComment(commentId: string, userId: string) {
    try {
      const comment = await this.prismaService.postComment.findUniqueOrThrow({
        where: { id: commentId },
      });
      if (comment.user_id !== userId)
        throw new UnauthorizedException(
          'You are not authorized to delete this comment',
        );
      const [_, updatedPost] = await this.prismaService.$transaction([
        this.prismaService.postComment.delete({ where: { id: commentId } }),
        this.prismaService.post.update({
          where: { id: comment.post_id },
          data: { comment_count: { decrement: 1 } },
          select: { comment_count: true },
        }),
      ]);
      return {
        message: 'Comment deleted',
        commentCount: updatedPost.comment_count,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      )
        throw error;
      this.logger.error(`Failed to delete comment ${commentId}`, error.stack);
      throw new InternalServerErrorException(
        'Unable to delete comment at this time',
      );
    }
  }

  async sharePost(postId: string, userId: string) {
    try {
      await this.prismaService.post.findUniqueOrThrow({
        where: { id: postId },
      });
      const share = await this.prismaService.postShare.create({
        data: { user_id: userId, post_id: postId },
      });
      return { message: 'Post shared', share };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to share post ${postId}`, error.stack);
      throw new InternalServerErrorException(
        'Unable to share post at this time',
      );
    }
  }
  // Search posts with pagination and optional user like info
  async searchPosts(
    query: string,
    userId?: string,
    limit = 10,
    cursor?: { created_at: string; id: string },
  ) {
    try {
      const whereClause: any = {
        is_public: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { caption: { contains: query, mode: 'insensitive' } },
          { user: { username: { contains: query, mode: 'insensitive' } } },
        ],
      };

      const posts = await this.prismaService.post.findMany({
        where: whereClause,
        cursor: cursor
          ? { created_at: new Date(cursor.created_at), id: cursor.id }
          : undefined,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        include: {
          user: { select: { name: true } },
          post_likes: userId
            ? { where: { user_id: userId }, select: { id: true } }
            : false,
        },
      });

      const hasNextPage = posts.length > limit;
      const nextCursor = hasNextPage
        ? {
            created_at: posts[posts.length - 1].created_at.toISOString(),
            id: posts[posts.length - 1].id,
          }
        : null;
      if (hasNextPage) posts.pop();

      return {
        posts: posts.map((post) => ({
          ...post,
          liked: userId ? !!post.post_likes.length : false,
        })),
        hasNextPage,
        nextCursor,
      };
    } catch (error) {
      this.logger.error('Failed to search posts', error.stack);
      throw new InternalServerErrorException('Unable to search posts.');
    }
  }

  //=============get api ===========

  async getAllPosts(
    userId?: string,
    limit = 10,
    cursor?: { created_at: string; id: string },
  ) {
    try {
      const posts = await this.prismaService.post.findMany({
        where: { is_public: true },
        cursor: cursor
          ? { created_at: new Date(cursor.created_at), id: cursor.id }
          : undefined,
        skip: cursor ? 1 : 0,
        take: limit + 1,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          title: true,
          content: true,
          caption: true,
          is_public: true,
          is_featured: true,
          image_url: true,
          video_url: true,
          like_count: true,
          comment_count: true,
          created_at: true,
          updated_at: true,
          user: { select: { id: true, name: true } },
          post_likes: {
            where: userId ? { user_id: userId } : undefined,
            select: { id: true },
          },
        },
      });

      const hasNextPage = posts.length > limit;
      const nextCursor = hasNextPage
        ? {
            created_at: posts[posts.length - 1].created_at.toISOString(),
            id: posts[posts.length - 1].id,
          }
        : null;
      if (hasNextPage) posts.pop();

      return {
        posts: posts.map((post) => ({
          ...post,
          liked: userId ? !!post.post_likes.length : false,
        })),
        nextCursor,
        hasNextPage,
      };
    } catch (error) {
      this.logger.error('Failed to fetch posts', error.stack);
      throw new InternalServerErrorException('Unable to fetch posts.');
    }
  }

  async getPostById(postId: string, userId?: string) {
    try {
      const post = await this.prismaService.post.findFirstOrThrow({
        where: { id: postId },
        select: {
          id: true,
          user_id: true,
          title: true,
          content: true,
          caption: true,
          is_public: true,
          is_featured: true,
          image_url: true,
          video_url: true,
          like_count: true,
          comment_count: true,
          created_at: true,
          updated_at: true,
          user: { select: { id: true, name: true } },
          post_likes: userId
            ? { where: { user_id: userId }, select: { id: true } }
            : false,
          post_comments: {
            where: { parent_id: null },
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              content: true,
              user: { select: { id: true, name: true } },
              created_at: true,
              updated_at: true,
              replies: {
                select: {
                  id: true,
                  content: true,
                  user: { select: { id: true, name: true } },
                  created_at: true,
                  updated_at: true,
                },
                orderBy: { created_at: 'asc' },
              },
            },
          },
        },
      });
      if (!post.is_public && post.user_id !== userId) {
        throw new UnauthorizedException(
          ' You are not authorized to view the this post',
        );
      }
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      )
        throw err;
      this.logger.error(`Failed to fetch post &{postId}`, err.stack);
    }
  }
}
