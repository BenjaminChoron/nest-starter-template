import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // Clean up expired tokens periodically
    setInterval(
      () => {
        void this.cleanupExpiredTokens();
      },
      1000 * 60 * 60,
    ); // Every hour
  }

  async blacklist(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded === 'string') return;

      const exp = decoded.exp * 1000; // Convert to milliseconds
      const ttl = Math.max(0, exp - Date.now());

      await this.redis.set(`blacklist:${token}`, '1', 'PX', ttl);
    } catch (error) {
      // Invalid token format, ignore
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redis.exists(`blacklist:${token}`);

    return exists === 1;
  }

  private async cleanupExpiredTokens(): Promise<void> {
    // Redis automatically removes expired keys
    // This method is kept for potential future implementation
  }
}
