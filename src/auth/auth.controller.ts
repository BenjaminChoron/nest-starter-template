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
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { GetProfileOutboundDto } from './dtos/get-profile.outbound.dto';
import { LoggedUserOutboundDto } from './dtos/logged-user.outbound.dto';
import { SignUpInboundDto } from './dtos/sign-up.inbound.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: SignUpInboundDto })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: LoggedUserOutboundDto,
  })
  @ApiBadRequestResponse({
    description: 'The email already exists.',
  })
  createUser(@Body() body: SignUpInboundDto) {
    return this.authService.signup(body.email, body.password);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log user in' })
  @ApiBody({ type: SignUpInboundDto })
  @ApiCreatedResponse({
    description: 'The user has successfully logged in.',
    type: LoggedUserOutboundDto,
  })
  @ApiUnauthorizedResponse({
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
  @ApiOkResponse({
    description: 'The user has successfully been retrieved.',
    type: GetProfileOutboundDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not authenticated.',
  })
  getProfile(@Request() req: any) {
    return req.user;
  }
}
