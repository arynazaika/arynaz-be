import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RateLimitService {
  constructor(private readonly dataSource: DataSource) {}

  async hit(key: string, windowMs: number) {
    const [row] = await this.dataSource.query(
      `INSERT INTO rate_limit_buckets (key, hits, expires_at)
       VALUES ($1, 1, now() + $2::int * interval '1 millisecond')
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE
           WHEN rate_limit_buckets.expires_at < now() THEN 1
           ELSE rate_limit_buckets.hits + 1
         END,
         expires_at = CASE
           WHEN rate_limit_buckets.expires_at < now() THEN EXCLUDED.expires_at
           ELSE rate_limit_buckets.expires_at
         END
       RETURNING hits, EXTRACT(EPOCH FROM expires_at - now()) AS seconds_left`,
      [key, windowMs],
    );
    return {
      hits: Number(row.hits),
      secondsLeft: Math.max(0, Math.ceil(Number(row.seconds_left))),
    };
  }

  async peek(key: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT hits FROM rate_limit_buckets WHERE key = $1 AND expires_at > now()`,
      [key],
    );
    return row ? Number(row.hits) : 0;
  }
}
