import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Public } from './decorators/public.decorator';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalGuard } from './guards/local-auth.guard';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'Pa$$w0rd!',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Registration successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'Email already exists' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'Pa$$w0rd!',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Request() req: ExpressRequest & { user: User },
  ): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer access_token',
    required: true,
    schema: { example: 'Bearer eyJhbGciOiJIUzI1NiIs...' },
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getProfile(
    @Request() req: ExpressRequest & { user: User },
  ): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer refresh_token',
    required: true,
    schema: { example: 'Bearer eyJhbGciOiJIUzI1NiIs...' },
  })
  @ApiCreatedResponse({
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refreshTokens(@Request() req: RequestWithUser) {
    const user = req.user;
    const refreshToken = req.get('Authorization').replace('Bearer', '').trim();

    return this.authService.refreshTokens(user.id, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer access_token',
    required: true,
    schema: { example: 'Bearer eyJhbGciOiJIUzI1NiIs...' },
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully logged out',
    schema: { example: { message: 'Logout successful' } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: RequestWithUser): Promise<void> {
    const token = req.get('authorization').replace('Bearer', '').trim();
    this.logger.debug(`User ${req.user.id} logging out`);
    await this.authService.logout(req.user.id, token);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reset token sent successfully',
    schema: {
      example: {
        message: 'If the email exists, a reset token has been sent',
      },
    },
  })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.generateResetToken(email);

    return { message: 'If the email exists, a reset token has been sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIs...',
        newPassword: 'NewPa$$w0rd!',
      },
    },
  })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      example: {
        message: 'Password reset successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIs...',
      },
    },
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      example: {
        message: 'Email verified successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer access_token',
    required: true,
    schema: { example: 'Bearer eyJhbGciOiJIUzI1NiIs...' },
  })
  @ApiOkResponse({
    description: 'Verification email sent',
    schema: {
      example: {
        message: 'Verification email sent successfully',
      },
    },
  })
  async resendVerification(@Request() req: RequestWithUser): Promise<void> {
    await this.authService.resendVerificationEmail(req.user.id);
  }
}
