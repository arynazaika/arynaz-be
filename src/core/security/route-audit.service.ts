import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

import { IS_PUBLIC, REQUIRED_PERMISSION } from './decorators';
import { ReadinessService } from '../health/readiness.service';

@Injectable()
export class RouteAuditService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RouteAuditService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly readiness: ReadinessService,
  ) {}

  onApplicationBootstrap() {
    const unprotected: string[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const prototype = Object.getPrototypeOf(instance);

      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = prototype[methodName];

        //@Get/@Post/... put a METHOD_METADATA tag. If there is no tag, this is not a route, but a regular method
        const isRoute =
          Reflect.getMetadata(METHOD_METADATA, handler) !== undefined;
        if (!isRoute) continue;

        const targets = [handler, metatype];
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC, targets);
        const permission = this.reflector.getAllAndOverride(
          REQUIRED_PERMISSION,
          targets,
        );

        if (!isPublic && !permission) {
          unprotected.push(`${metatype.name}.${methodName}`);
        }
      }
    }

    if (unprotected.length > 0) {
      this.logger.error(
        `Routes without @Public() or @RequirePermission(): ${unprotected.join(', ')}`,
      );
      this.readiness.set('routeAudit', false);
      process.exit(1);
    }
    this.readiness.set('routeAudit', true);
  }
}
