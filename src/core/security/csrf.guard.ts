import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { ConfigService } from '@/core/config/config.service';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      config
        .get('CORS_ALLOWED_ORIGINS')
        .split(',')
        .map((s) => s.trim()),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!UNSAFE_METHODS.has(request.method)) return true;

    const rejected = () => new ForbiddenException({ code: 'csrf_rejected' });

    const origin = request.headers.origin;
    if (origin && !this.allowedOrigins.has(origin)) throw rejected();

    if (request.headers['x-csrf-protection'] !== '1') throw rejected();

    return true;
  }
}
