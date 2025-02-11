import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UserResponseDto } from '../users/dtos/user-response.dto';
import { User } from 'src/users/entities/user.entity';
import { AuthResponseDto } from './dtos/auth-response.dto';

type AuthInput = { email: string; password: string };
type AuthResult = {
  accessToken: string;
  user: UserResponseDto;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input.email, input.password);

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    }

    return this.login(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: User): Promise<AuthResponseDto> {
    await this.usersService.updateLastLogin(user.id);

    return new AuthResponseDto({
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: new UserResponseDto(user),
    });
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    const usersWithSameEmail = await this.usersService.findByEmail(email);

    if (usersWithSameEmail) {
      throw new BadRequestException('Email already exists');
    }

    return this.register({ email, password });
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.create(createUserDto);

      return new AuthResponseDto({
        accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
        user,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new UnauthorizedException('Registration failed');
    }
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);

    return new UserResponseDto(user);
  }
}
