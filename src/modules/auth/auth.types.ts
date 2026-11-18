import type { FastifyRequest } from 'fastify';
import type { User } from '@/modules/users/user.entity';

export type AuthRequest = FastifyRequest & { user?: User };
