import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { TokenExpiredException } from '../exceptions/token-expired.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { JwtPayload } from 'jsonwebtoken';
import { IUserRepository } from '../repositories/user.repository.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    // Store refresh token in user entity
    user.setRefreshToken(refreshToken);
    await this.userRepository.save(user); // Save to persist the refresh token

    return { accessToken, refreshToken };
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.getId(),
      email: user.getEmail(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.getId(),
      email: user.getEmail(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });
  }

  async generateEmailToken(payload: {
    sub: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_VERIFICATION_SECRET'),
      expiresIn: '24h',
    });
  }

  async verifyEmailToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_VERIFICATION_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }

      throw new InvalidTokenException();
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }

      throw new InvalidTokenException();
    }
  }

  async generateResetToken(payload: {
    sub: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: '1h',
    });
  }

  async verifyResetToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }

      throw new InvalidTokenException();
    }
  }

  getRefreshTokenTTL(): number {
    const expiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const match = expiration.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60;

    const [, value, unit] = match;

    const multipliers: { [key: string]: number } = {
      d: 86400,
      h: 3600,
      m: 60,
      s: 1,
    };

    return parseInt(value) * multipliers[unit];
  }
}
