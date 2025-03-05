import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
    });
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.redis.set(`bl_${token}`, '1', 'EX', expiresIn);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`bl_${token}`);

    return !!result;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
