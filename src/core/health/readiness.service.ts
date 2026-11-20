import { Injectable } from '@nestjs/common';

type Flag = 'routeAudit';

@Injectable()
export class ReadinessService {
  private readonly flags: Record<Flag, boolean> = {
    routeAudit: false,
  };

  set(flag: Flag, value: boolean) {
    this.flags[flag] = value;
  }

  isReady(): boolean {
    return Object.values(this.flags).every(Boolean);
  }
}
