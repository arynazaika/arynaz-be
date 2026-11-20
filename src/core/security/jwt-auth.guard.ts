import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

import { ConfigService } from '@/core/config/config.service';
import { UserStatus } from '@/modules/users/user.entity';
import { UsersService } from '@/modules/users/users.service';
import { AuthRequest } from '@/modules/auth/auth.types';
import { IS_PUBLIC } from './decorators';
import { readMeta } from './read-meta';
import { AppException } from '../errors/app-exception';

interface AccessPayload {
  sub: string;
  token_use: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (readMeta<boolean>(this.reflector, IS_PUBLIC, context)) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const invalidSession = () => new AppException('invalid_session', 401);

    const token = request.cookies?.access_token;
    if (!token) throw invalidSession();

    let payload: AccessPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        issuer: this.config.get('JWT_ISSUER'),
        audience: this.config.get('JWT_AUDIENCE'),
        algorithms: ['HS256'],
      });
    } catch {
      throw invalidSession();
    }
    if (payload.token_use !== 'access') throw invalidSession();

    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== UserStatus.Active) throw invalidSession();

    request.user = user;
    return true;
  }
}
