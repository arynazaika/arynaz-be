import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { ConfigService } from '@/core/config/config.service';

export const ACCESS_TTL_SECONDS = 15 * 60; // 15 mins
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class AuthCookies {
  private readonly secure: boolean;

  constructor(config: ConfigService) {
    this.secure = config.get('NODE_ENV') === 'production';
  }

  set(
    reply: FastifyReply,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    reply.setCookie('access_token', tokens.accessToken, {
      ...this.options('/'),
      maxAge: ACCESS_TTL_SECONDS,
    });
    reply.setCookie('refresh_token', tokens.refreshToken, {
      ...this.options('/auth/refresh'),
      maxAge: REFRESH_TTL_SECONDS,
    });
  }

  clear(reply: FastifyReply) {
    reply.clearCookie('access_token', this.options('/'));
    reply.clearCookie('refresh_token', this.options('/auth/refresh'));
  }

  private options(path: string) {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict' as const,
      path,
    };
  }
}
