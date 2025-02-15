import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          enableOfflineQueue: false,
          lazyConnect: false,
          retryStrategy: () => null,
          maxRetriesPerRequest: 0,
          commandTimeout: 5000,
        });

        client.on('error', err => {
          console.error('Redis connection error:', err);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown() {
    try {
      const client = this.moduleRef.get('REDIS_CLIENT') as Redis;

      if (client.status !== 'end') {
        await client.disconnect();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}
