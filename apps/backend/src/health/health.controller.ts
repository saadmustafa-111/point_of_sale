import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      app: 'POS Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
