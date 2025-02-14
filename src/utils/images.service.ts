import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';

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

const DEFAULT_OPTIONS: UploadOptions = {
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  transformation: {
    quality: 'auto',
  },
};

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Express.Multer.File | string,
    options: UploadOptions = {},
  ): Promise<CloudinaryResponse> {
    try {
      const mergedOptions = this.mergeOptions(options);
      this.validateFile(file, mergedOptions);

      const uploadResult = await this.uploadToCloudinary(file, mergedOptions);
      this.logger.debug(
        `File uploaded successfully to Cloudinary: ${uploadResult.public_id}`,
      );

      return uploadResult;
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary', error?.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Image upload failed');
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
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

  private mergeOptions(options: UploadOptions): UploadOptions {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
      folder: options.folder || this.configService.get('CLOUDINARY_FOLDER'),
      transformation: {
        ...DEFAULT_OPTIONS.transformation,
        ...options.transformation,
      },
    };
  }

  private validateFile(
    file: Express.Multer.File | string,
    options: UploadOptions,
  ): void {
    if (typeof file !== 'string' && file?.size > options.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${
          options.maxFileSize / 1024 / 1024
        }MB`,
      );
    }

    if (typeof file !== 'string') {
      const format = file.mimetype.split('/')[1];

      if (!options.allowedFormats.includes(format)) {
        throw new BadRequestException(
          `Invalid file format. Allowed formats are: ${options.allowedFormats.join(
            ', ',
          )}`,
        );
      }
    }
  }

  private uploadToCloudinary(
    file: Express.Multer.File | string,
    options: UploadOptions,
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder,
        allowed_formats: options.allowedFormats,
        transformation: options.transformation,
      };

      const uploadCallback = (
        error: UploadApiErrorResponse,
        result: CloudinaryResponse,
      ) => {
        if (error) return reject(error);
        resolve(result);
      };

      if (typeof file === 'string') {
        void cloudinary.uploader.upload(file, uploadOptions, uploadCallback);
      } else {
        void cloudinary.uploader.upload(
          file.path,
          uploadOptions,
          uploadCallback,
        );
      }
    });
  }
}
