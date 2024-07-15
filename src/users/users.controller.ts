import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@Serialize(UserDto)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/:uuid')
  @ApiOperation({ summary: 'Find a user by uuid' })
  @ApiParam({ name: 'uuid', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user was found.',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
  })
  async findUserByUuid(@Param('uuid') uuid: string) {
    const user = await this.usersService.findByUuid(uuid);

    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }

    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user was found.',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
  })
  async findUserByEmail(@Query('email') email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:uuid')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'uuid', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user was updated.',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
  })
  updateUser(@Param('uuid') uuid: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(uuid, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:uuid')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a user' })
  @ApiParam({ name: 'uuid', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user was removed.',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user was not found.',
  })
  removeUser(@Param('uuid') uuid: string) {
    return this.usersService.remove(uuid);
  }
}
