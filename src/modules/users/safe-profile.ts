import { User, UserStatus } from './user.entity';

export interface SafeProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export function toSafeProfile(user: User): SafeProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoKey ? `/users/${user.id}/photo` : null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
