import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import * as bcrypt from 'bcrypt';
import { ImagesService } from '../utils/images.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly imagesService: ImagesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email exists
    const existingUser = await this.usersRepository.findOneBy({
      email: createUserDto.email.toLowerCase().trim(),
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }

    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update({ id }, { lastLoginAt: new Date() });
  }

  async update(id: string, attrs: Partial<User>): Promise<UserResponseDto> {
    const user = await this.findById(id);
    Object.assign(user, attrs);
    await this.usersRepository.save(user);

    return new UserResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(
      { id: userId },
      { refreshToken: hashedRefreshToken },
    );
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user?.refreshToken) return false;

    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    try {
      await this.usersRepository.update({ id: userId }, { refreshToken: null });
      this.logger.debug(`Refresh token removed for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove refresh token for user ${userId}`,
        error?.stack,
      );

      throw new InternalServerErrorException('Failed to remove refresh token');
    }
  }

  async setEmailVerificationToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const user = await this.findById(userId);

    if (user.avatar) {
      const publicId = this.extractPublicId(user.avatar);
      await this.imagesService.delete(publicId).catch(error => {
        this.logger.warn(
          `Failed to delete old avatar: ${publicId}`,
          error?.stack,
        );
      });
    }

    const uploadResult = await this.imagesService.upload(file, {
      transformation: {
        width: 150,
        height: 150,
        crop: 'fill',
      },
    });

    this.logger.debug(
      `Avatar updated for user ${userId}: ${uploadResult.secure_url}`,
    );

    return this.update(userId, { avatar: uploadResult.secure_url });
  }

  private extractPublicId(url: string): string {
    const matches = url.match(/\/v\d+\/([^/]+)\./);

    return matches ? matches[1] : '';
  }
}
