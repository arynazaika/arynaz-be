import { HttpException } from '@nestjs/common';

export type ErrorCode =
  | 'bad_request'
  | 'invalid_session'
  | 'invalid_credentials'
  | 'permission_denied'
  | 'ownership_denied'
  | 'csrf_rejected'
  | 'not_found'
  | 'conflict'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'rate_limit_exceeded'
  | 'authorization_unavailable'
  | 'service_unavailable'
  | 'gateway_timeout';

export class AppException extends HttpException {
  constructor(code: ErrorCode, status: number, message: string = code) {
    super({ code, message }, status);
  }
}
