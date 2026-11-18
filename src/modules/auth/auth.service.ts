import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';

import { ConfigService } from '@/core/config/config.service';
import { User, UserStatus } from '@/modules/users/user.entity';
import { UsersService } from '@/modules/users/users.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_TTL_SECONDS = 15 * 60; // 15 mins
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash: string;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash('timing-equalizer-dummy-password');
  }

  async register(dto: RegisterDto): Promise<User> {
    const passwordHash = await argon2.hash(dto.password);

    try {
      return await this.users.create({
        email: dto.email,
        passwordHash,
        status: UserStatus.Active,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === '23505'
      ) {
        throw new ConflictException({ code: 'conflict' });
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<User> {
    const user = await this.users.findByEmail(dto.email);

    const passwordOk = await argon2.verify(
      user?.passwordHash ?? this.dummyHash,
      dto.password,
    );

    if (!user || !passwordOk || user.status !== UserStatus.Active) {
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    return user;
  }

  async issueTokens(userId: string) {
    const common = {
      issuer: this.config.get('JWT_ISSUER'),
      audience: this.config.get('JWT_AUDIENCE'),
      algorithm: 'HS256' as const,
    };

    const accessToken = await this.jwt.signAsync(
      { sub: userId, token_use: 'access' },
      {
        ...common,
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TTL_SECONDS,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, token_use: 'refresh' },
      {
        ...common,
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TTL_SECONDS,
      },
    );

    return {
      accessToken,
      refreshToken,
      ACCESS_TTL_SECONDS,
      REFRESH_TTL_SECONDS,
    };
  }
}
