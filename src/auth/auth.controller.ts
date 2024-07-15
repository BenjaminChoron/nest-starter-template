import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpInboundDto } from './dtos/sign-up.inbound.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoggedUserOutboundDto } from './dtos/logged-user.outbound.dto';
import { GetProfileOutboundDto } from './dtos/get-profile.outbound.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: SignUpInboundDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The record has been successfully created.',
    type: LoggedUserOutboundDto,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The email already exists.',
  })
  createUser(@Body() body: SignUpInboundDto) {
    return this.authService.signup(body.email, body.password);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log user in' })
  @ApiBody({ type: SignUpInboundDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has successfully logged in.',
    type: LoggedUserOutboundDto,
  })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The credentials are invalid.',
  })
  signin(@Body() body: SignUpInboundDto) {
    return this.authService.authenticate({
      email: body.email,
      password: body.password,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('whoami')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has successfully been retrieved.',
    type: GetProfileOutboundDto,
  })
  @ApiUnauthorizedResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'The user is not authenticated.',
  })
  getProfile(@Request() req) {
    return req.user;
  }
}
