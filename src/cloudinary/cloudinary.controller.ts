import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  UseInterceptors,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common/decorators/http/route-params.decorator';
import { Post, Delete, Query } from '@nestjs/common';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    try {
      const result = await this.cloudinaryService.uploadImage(file);

      return {
        message: 'Image uploaded successfully',
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Image upload failed',
        error.message,
      );
    }
  }
  @Post('upload-video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    try {
      const result = await this.cloudinaryService.uploadVideo(file);
      return {
        message: 'Video uploaded successfully',
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        'Video upload failed',
        err.message,
      );
    }
  }

  @Delete('delete')
  async deleteFile(@Query('publicId') publicId: string, @Query('type') type: 'image' | 'video' = 'image') {
    if (!publicId) {
      throw new BadRequestException('No public ID provided');
    }
    try {
      if (type === 'image') {
        await this.cloudinaryService.deleteImage(publicId);
      } else if (type === 'video') {
        await this.cloudinaryService.deleteVideo(publicId);
      } else {
        throw new BadRequestException('Invalid type provided');
      }
      return { message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` };
    } catch (error) {
      throw new InternalServerErrorException(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deletion failed`,
        error.message,
      );
    }
  }

}
