import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { toSafeProfile } from '@/modules/users/safe-profile';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '@/core/security/decorators';
import { AuthCookies } from './auth-cookies.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
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
    this.cookies.set(reply, await this.auth.issueTokens(user.id));

    return toSafeProfile(user);
  }

  @Post('refresh')
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const userId = await this.auth.verifyRefreshToken(
      req.cookies.refresh_token,
    );
    this.cookies.set(reply, await this.auth.issueTokens(userId));
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    this.cookies.clear(reply);
  }
}
