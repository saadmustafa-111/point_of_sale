import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { FirstAdminDto } from './dto/first-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

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

  @Delete('reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reset() {
    return this.service.resetApplicationData();
  }
}
