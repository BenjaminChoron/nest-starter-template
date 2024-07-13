import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';

@Controller('auth')
@Serialize(UserDto)
export class UsersController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('/signup')
  async createUser(@Body() body: CreateUserDto) {
    const user = await this.authService.signup(body.email, body.password);
    return user;
  }

  @Get('/:uuid')
  async findUserByUuid(@Param('uuid') uuid: string) {
    const user = await this.usersService.findByUuid(uuid);

    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }

    return user;
  }

  @Get()
  async findUserByEmail(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }
}
