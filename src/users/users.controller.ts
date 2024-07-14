import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
@Serialize(UserDto)
export class UsersController {
  constructor(private usersService: UsersService) {}

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

  @Patch('/:uuid')
  updateUser(@Param('uuid') uuid: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(uuid, body);
  }

  @Delete('/:uuid')
  removeUser(@Param('uuid') uuid: string) {
    return this.usersService.remove(uuid);
  }
}
