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
  ApiConflictResponse,
  ApiCreatedResponse,
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
  @ApiCreatedResponse({
    description: 'Registration successful',
    type: AuthResponseDto,
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
  @ApiCreatedResponse({
    description: 'Login successful',
    type: AuthResponseDto,
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
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: UserResponseDto,
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
  @ApiCreatedResponse({
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
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
  @ApiResponse({ status: 201, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: RequestWithUser): Promise<void> {
    const token = req.get('authorization').replace('Bearer', '').trim();
    this.logger.debug(`User ${req.user.id} logging out`);
    await this.authService.logout(req.user.id, token);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 201, description: 'Reset token sent successfully' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.generateResetToken(email);

    return { message: 'If the email exists, a reset token has been sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiOkResponse({ description: 'Password reset successfully' })
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
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiOkResponse({ description: 'Verification email sent' })
  async resendVerification(@Request() req: RequestWithUser): Promise<void> {
    await this.authService.resendVerificationEmail(req.user.id);
  }
}
