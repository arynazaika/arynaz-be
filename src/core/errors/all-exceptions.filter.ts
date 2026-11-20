import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { QueryFailedError } from 'typeorm';

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'invalid_session',
  403: 'permission_denied',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  429: 'rate_limit_exceeded',
  503: 'service_unavailable',
  504: 'gateway_timeout',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    let status = 500;
    let code = 'internal_error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as {
        code?: string;
        message?: unknown;
      };
      code = body?.code ?? CODE_BY_STATUS[status] ?? 'error';
      if (status === 400 && Array.isArray(body?.message))
        details = body.message;
    } else if (exception instanceof QueryFailedError) {
      // #2: error from Postgres. Postgres error codes:
      //   23505 — unique violation (email already exists)
      //   23503 — foreign key violation (deleting a role that is assigned to someone)
      const pgCode = (exception as any).driverError?.code;
      if (pgCode === '23505' || pgCode === '23503') {
        status = 409;
        code = 'conflict';
      } else {
        this.logger.error(exception);
      }
    } else if (typeof (exception as any)?.statusCode === 'number') {
      // #3: errors from Fastify itself (e.g., too large payload — 413)
      status = (exception as any).statusCode;
      code = CODE_BY_STATUS[status] ?? 'error';
    } else {
      // #4: everything else (unexpected, bug in code, DB down...)
      this.logger.error(exception);
    }

    reply
      .status(status)
      .send({ code, message: code, ...(details ? { details } : {}) });
  }
}
