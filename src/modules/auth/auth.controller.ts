import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { ConfigService } from '@/core/config/config.service';
import { toSafeProfile } from '@/modules/users/safe-profile';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '@/core/security/decorators';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register') // POST 201 Created
  async register(@Body() dto: RegisterDto) {
    const user = await this.auth.register(dto);
    return toSafeProfile(user);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const user = await this.auth.login(dto);
    const tokens = await this.auth.issueTokens(user.id);

    const secure = this.config.get('NODE_ENV') === 'production';

    reply.setCookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: tokens.ACCESS_TTL_SECONDS,
    });

    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/auth/refresh', // browser will send refresh token only to this endpoint
      maxAge: tokens.REFRESH_TTL_SECONDS,
    });

    return toSafeProfile(user);
  }
}
