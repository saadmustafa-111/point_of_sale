import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { FirstAdminDto } from './dto/first-admin.dto';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private service: SetupService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }

  @Post('first-admin')
  createFirstAdmin(@Body() dto: FirstAdminDto) {
    return this.service.createFirstAdmin(dto);
  }
}
