import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { scrypt as _scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

import { UsersService } from '../users/users.service';

const scrypt = promisify(_scrypt);

type AuthInput = { email: string; password: string };
type Payload = { uuid: string; email: string };
type AuthResult = { accessToken: string };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new UnauthorizedException('Bad credentials');
    }

    return this.signIn(user);
  }

  async validateUser(input: AuthInput): Promise<Payload | null> {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      return null;
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(input.password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      return null;
    }

    const payload = { uuid: user.uuid, email: user.email };

    return payload;
  }

  async signIn(user: Payload): Promise<AuthResult> {
    const tokenPayload = { sub: user.uuid, email: user.email };
    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return {
      accessToken: accessToken,
    };
  }

  async signup(email: string, password: string): Promise<AuthResult> {
    const usersWithSameEmail = await this.usersService.findByEmail(email);

    if (usersWithSameEmail) {
      throw new BadRequestException('Email already exists');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');

    const user = await this.usersService.create(email, result);

    return this.signIn(user);
  }
}
