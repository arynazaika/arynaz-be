import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from '@/core/config/config.module';
import { ConfigService } from '@/core/config/config.service';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { PostgresThrottlerStorage } from '../rate-limit/postgres-throttler.storage';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule, RateLimitModule],
      inject: [ConfigService, RateLimitService],
      useFactory: (config: ConfigService, limits: RateLimitService) => {
        const ttl = Number(config.get('THROTTLE_GLOBAL_TTL'));
        const limit = Number(config.get('THROTTLE_GLOBAL_LIMIT'));

        return {
          throttlers: [
            {
              ttl,
              limit,
            },
          ],
          storage: new PostgresThrottlerStorage(limits),
        };
      },
    }),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
