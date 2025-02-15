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
  ApiBearerAuth,
  ApiBody,
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
import { User } from '../users/entities/user.entity';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ErrorResponseDto } from './dtos/error-response.dto';
import { TokensResponseDto } from './dtos/tokens-response.dto';
import {
  GetCurrentUser,
  GetCurrentUserId,
} from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account and return authentication tokens',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return access/refresh tokens',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
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
  @ApiOperation({
    summary: 'Refresh tokens',
    description: 'Generate new access/refresh tokens using refresh token',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer refresh_token',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Tokens refreshed successfully',
    type: TokensResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    type: ErrorResponseDto,
  })
  async refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<TokensResponseDto> {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate current access/refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async logout(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<void> {
    this.logger.debug(`User ${userId} logging out`);
    await this.authService.logout(userId, refreshToken);
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
