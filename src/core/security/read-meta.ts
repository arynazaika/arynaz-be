import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export function readMeta<T>(
  reflector: Reflector,
  key: string,
  context: ExecutionContext,
): T | undefined {
  return reflector.getAllAndOverride<T>(key, [
    context.getHandler(),
    context.getClass(),
  ]);
}
