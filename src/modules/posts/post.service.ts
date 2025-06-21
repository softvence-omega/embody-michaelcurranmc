import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  UploadedFile,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
// TODO: Ensure the file '../cloudinary/cloudinary.service.ts' exists and is correctly named, then uncomment the import above.

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
async createPost(
  dto: CreatePostDto,
  file: Express.Multer.File | null,
  userId: string,
) {
  // Validate user existence (optional, depending on requirements)
  const user = await this.prismaService.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Handle media upload
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

  // Create post
  return this.prismaService.post.create({
    data: {
      title: dto.title,
      content: dto.content,
      caption: dto.caption,
      is_public: dto.is_public ?? true,
      is_featured: dto.is_featured ?? false,
      user_id: userId,
      // Align with previous schema
      image_url: mediaUpload?.resource_type === 'image' ? mediaUpload.secure_url : null,
      video_url: mediaUpload?.resource_type === 'video' ? mediaUpload.secure_url : null,
    },
  });
}
}
