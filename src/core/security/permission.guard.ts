import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  IS_PUBLIC,
  REQUIRED_PERMISSION,
  RequiredPermission,
} from './decorators';
import { readMeta } from './read-meta';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (readMeta<boolean>(this.reflector, IS_PUBLIC, context)) return true;

    const required = readMeta<RequiredPermission>(
      this.reflector,
      REQUIRED_PERMISSION,
      context,
    );
    if (!required)
      throw new ServiceUnavailableException({ code: 'service_unavailable' });

    return true;
  }
}
