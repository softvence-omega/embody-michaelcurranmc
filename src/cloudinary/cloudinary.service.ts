import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'images',
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          if (result) {
            return resolve(result);
          } else {
            return reject(new Error('Upload failed: result is undefined'));
          }
        },
      );
      Readable.from(file.buffer).pipe(upload);
    });
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadVideo = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'videos',
        },
        (err, result) => {
          if (err) return reject(err);
          if (result) return resolve(result);
          else return reject(new Error('Upload failed: result is undefined'));
        },
      );
      Readable.from(file.buffer).pipe(uploadVideo);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        if (result.result === 'ok') return resolve();
        else return reject(new Error('Delete failed: result is not ok'));
      });
    });
  }
  async deleteVideo(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'video' },
        (error, result) => {
          if (error) return reject(error);
          if (result.result === 'ok') return resolve();
          else return reject(new Error('Delete failed: result is not ok'));
        },
      );
    });
  }
}
