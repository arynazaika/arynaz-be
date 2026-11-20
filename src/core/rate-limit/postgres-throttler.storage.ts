import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

import { RateLimitService } from './rate-limit.service';

export class PostgresThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly limits: RateLimitService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    _blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const { hits, secondsLeft } = await this.limits.hit(
      `${throttlerName}:${key}`,
      ttl,
    );
    const isBlocked = hits > limit;
    return {
      totalHits: hits,
      timeToExpire: secondsLeft,
      isBlocked,
      timeToBlockExpire: isBlocked ? secondsLeft : 0,
    };
  }
}
