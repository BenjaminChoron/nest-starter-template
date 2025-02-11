import {
  Body,
  Controller,
  Get,
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
}
