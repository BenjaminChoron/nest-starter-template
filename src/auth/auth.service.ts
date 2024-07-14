import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { UsersService } from '../users/users.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const usersWithSameEmail = await this.usersService.findByEmail(email);
    if (usersWithSameEmail) {
      throw new BadRequestException('Email already exists');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    const user = await this.usersService.create(email, result);

    const payload = { uuid: user.uuid, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Bad password');
    }

    const payload = { uuid: user.uuid, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
