import {
  BadRequestException,
  ConflictException,
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
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input.email, input.password);

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    }

    return this.login(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async getTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    await this.usersService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(user: User): Promise<AuthResponseDto> {
    const tokens = await this.getTokens(user);
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
      const tokens = await this.getTokens(user);

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

    const tokens = await this.getTokens(user);
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
      this.tokenBlacklistService.blacklist(token);

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

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.usersService.update(user.id, { password: hashedPassword });
      await this.usersService.removeRefreshToken(user.id); // Invalidate all sessions
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async generateResetToken(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
        expiresIn: '15m',
      },
    );

    await this.emailService.sendPasswordResetEmail(email, token);
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
