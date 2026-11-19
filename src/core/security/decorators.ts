import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'security:isPublic';
export const REQUIRED_PERMISSION = 'security:permission';

export type PermissionName = 'users' | 'transformations' | 'rbac';

export interface RequiredPermission {
  permission: PermissionName;
  action: string;
}

export const Public = () => SetMetadata(IS_PUBLIC, true);

export const RequirePermission = (permission: PermissionName, action: string) =>
  SetMetadata(REQUIRED_PERMISSION, {
    permission,
    action,
  } satisfies RequiredPermission);
