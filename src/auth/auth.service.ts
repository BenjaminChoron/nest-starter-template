import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { User } from 'src/users/entities/user.entity';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { EmailService } from '../email/email.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { PasswordHistoryService } from './services/password-history.service';

type AuthInput = { email: string; password: string };
type AuthResult = {
  accessToken: string;
  user: UserResponseDto;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly passwordHistoryService: PasswordHistoryService,
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input.email, input.password);

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    }

    return this.login(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async login(user: User): Promise<AuthResponseDto> {
    const tokens = await this.getTokens(user.id, user.email);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
    await this.usersService.updateLastLogin(user.id);

    return new AuthResponseDto({
      ...tokens,
      user: new UserResponseDto(user),
    });
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    const usersWithSameEmail = await this.usersService.findByEmail(email);

    if (usersWithSameEmail) {
      throw new BadRequestException('Email already exists');
    }

    return this.register({ email, password });
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.create(createUserDto);
      const verificationToken = await this.generateEmailVerificationToken(user);

      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
      const tokens = await this.getTokens(user.id, user.email);

      return new AuthResponseDto({
        ...tokens,
        user: new UserResponseDto(user),
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new UnauthorizedException('Registration failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (
        !user?.emailVerificationToken ||
        user.emailVerificationToken !== token
      ) {
        throw new UnauthorizedException('Invalid verification token');
      }

      if (user.emailVerificationExpires < new Date()) {
        throw new UnauthorizedException('Verification token has expired');
      }

      await this.usersService.verifyEmail(user.id);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = await this.generateEmailVerificationToken(user);
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);

    return new UserResponseDto(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    const isValid = await this.usersService.validateRefreshToken(
      userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.getTokens(userId, user.email);
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, token: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);

      if (!user) {
        this.logger.warn(`Logout attempted for non-existent user: ${userId}`);

        throw new NotFoundException('User not found');
      }

      // Blacklist the current access token
      await this.tokenBlacklistService.blacklist(token);

      // Remove refresh token
      await this.usersService.removeRefreshToken(userId);
      this.logger.debug(`User ${userId} successfully logged out`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to logout user ${userId}`, error?.stack);

      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    // Check if password was recently used
    const isReused = await this.passwordHistoryService.isPasswordReused(
      userId,
      newPassword,
    );

    if (isReused) {
      throw new BadRequestException(
        'Password was recently used. Please choose a different password.',
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    // Add to history
    await this.passwordHistoryService.addToHistory(userId, newPassword);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async generateResetToken(email: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (user) {
        const token = await this.jwtService.signAsync(
          { sub: user.id, email: user.email },
          {
            secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
            expiresIn: '15m',
          },
        );

        await this.emailService.sendPasswordResetEmail(email, token);
      }

      // Always return the same message whether the email exists or not
      // This prevents user enumeration
      this.logger.debug(`Password reset requested for email: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to generate reset token for ${email}`,
        error?.stack,
      );
      // Still return success to prevent user enumeration
    }
  }

  private async generateEmailVerificationToken(user: User): Promise<string> {
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_VERIFICATION_SECRET'),
        expiresIn: '24h',
      },
    );

    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.usersService.setEmailVerificationToken(user.id, token, expires);

    return token;
  }
}
