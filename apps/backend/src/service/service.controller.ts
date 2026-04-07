import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceJobDto, UpdateServiceJobDto, AddServicePartsDto, AddServiceChargesDto } from './dto/service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';

@Controller('service')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post('jobs')
  @Roles(Role.ADMIN, Role.CASHIER)
  create(@Body() dto: CreateServiceJobDto) {
    return this.serviceService.create(dto);
  }

  @Get('jobs')
  @Roles(Role.ADMIN, Role.CASHIER)
  getAll(@Query('status') status?: string, @Query('priority') priority?: string) {
    return this.serviceService.getAll(status, priority);
  }

  @Get('jobs/:id')
  @Roles(Role.ADMIN, Role.CASHIER)
  getJob(@Param('id') id: string) {
    return this.serviceService.getJob(id);
  }

  @Put('jobs/:id')
  @Roles(Role.ADMIN, Role.CASHIER)
  update(@Param('id') id: string, @Body() dto: UpdateServiceJobDto) {
    return this.serviceService.update(id, dto);
  }

  @Post('parts')
  @Roles(Role.ADMIN, Role.CASHIER)
  addParts(@Body() dto: AddServicePartsDto) {
    return this.serviceService.addParts(dto);
  }

  @Post('charges')
  @Roles(Role.ADMIN, Role.CASHIER)
  addCharges(@Body() dto: AddServiceChargesDto) {
    return this.serviceService.addCharges(dto);
  }

  @Get('customer/:customerId')
  @Roles(Role.ADMIN, Role.CASHIER)
  getByCustomer(@Param('customerId') customerId: string) {
    return this.serviceService.getByCustomer(customerId);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.serviceService.getStats();
  }
}
