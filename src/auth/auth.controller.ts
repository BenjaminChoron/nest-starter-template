import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/signup')
  createUser(@Body() body: SignUpDto) {
    return this.authService.signup(body.email, body.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signin(@Body() body: SignUpDto) {
    return this.authService.signin(body.email, body.password);
  }
}
