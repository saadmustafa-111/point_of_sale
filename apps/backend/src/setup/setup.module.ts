import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule implements OnApplicationBootstrap {
  constructor(private setupService: SetupService) {}

  async onApplicationBootstrap() {
    await this.setupService.removeDemoUsersForFreshProductionDb();
  }
}
