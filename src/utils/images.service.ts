import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse;
export type UploadOptions = {
  folder?: string;
  allowedFormats?: string[];
  maxFileSize?: number; // in bytes
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  };
};

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private readonly configService: ConfigService) {
    v2.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Express.Multer.File,
    options?: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      this.validateFile(file);

      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return await v2.uploader.upload(base64, {
        folder: this.configService.get('CLOUDINARY_FOLDER', 'nest-starter'),
        ...options,
      });
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary', error?.stack);

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      if (!publicId) {
        this.logger.warn('No public ID provided for deletion');

        return;
      }

      const result = await v2.uploader.destroy(publicId);

      if (result.result !== 'ok') {
        throw new Error(`Failed to delete image: ${result.result}`);
      }

      this.logger.debug(
        `File deleted successfully from Cloudinary: ${publicId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${publicId}`,
        error?.stack,
      );

      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file?.mimetype) {
      throw new BadRequestException('Invalid file');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG and PNG are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB');
    }
  }
}
