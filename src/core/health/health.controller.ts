import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

import { HealthService } from './health.service';
import { ConfigService } from '@/core/config/config.service';
import { ReadinessService } from './readiness.service';
import { Public } from '../security/decorators';
import { AppException } from '../errors/app-exception';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly readiness: ReadinessService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' }; //if the process is running, it is considered live
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new AppException('service_unavailable', 503);
    }
    if (!this.readiness.isReady()) {
      throw new AppException('service_unavailable', 503);
    }
    return { status: 'ok' };
  }

  @Get()
  @HealthCheck()
  async check() {
    const healthCheckEnabled = this.configService.get('HEALTH_CHECK_ENABLED');

    if (!healthCheckEnabled) {
      return this.healthService.getEmptyResponse();
    }

    return this.healthService.checkHealth();
  }
}
