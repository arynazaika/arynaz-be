import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/current-user.decorator';

import { toSafeProfile } from './safe-profile';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { RequirePermission } from '@/core/security/decorators';
import { AppException } from '@/core/errors/app-exception';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':userId')
  @RequirePermission('users', 'read')
  async getOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() actor: User,
  ) {
    if (userId !== actor.id) {
      throw new AppException('ownership_denied', 403);
    }

    const user = await this.users.findById(userId);
    if (!user) throw new AppException('not_found', 404);

    return toSafeProfile(user);
  }
}
