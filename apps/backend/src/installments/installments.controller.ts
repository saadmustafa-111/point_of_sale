import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InstallmentsService } from './installments.service';
import { CreateInstallmentPlanDto, RecordInstallmentPaymentDto, UpdateInstallmentPlanDto } from './dto/installment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';

@Controller('installments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Post('plans')
  @Roles(Role.ADMIN, Role.CASHIER)
  createPlan(@Body() dto: CreateInstallmentPlanDto) {
    return this.installmentsService.createPlan(dto);
  }

  @Get('plans')
  @Roles(Role.ADMIN, Role.CASHIER)
  getAll(@Query('status') status?: string) {
    return this.installmentsService.getAll(status);
  }

  @Get('plans/:id')
  @Roles(Role.ADMIN, Role.CASHIER)
  getPlan(@Param('id') id: string) {
    return this.installmentsService.getPlan(id);
  }

  @Get('plans/sale/:saleId')
  @Roles(Role.ADMIN, Role.CASHIER)
  getPlanBySale(@Param('saleId') saleId: string) {
    return this.installmentsService.getPlanBySale(saleId);
  }

  @Post('payments')
  @Roles(Role.ADMIN, Role.CASHIER)
  recordPayment(@Body() dto: RecordInstallmentPaymentDto) {
    return this.installmentsService.recordPayment(dto);
  }

  @Put('plans/:id')
  @Roles(Role.ADMIN)
  updatePlan(@Param('id') id: string, @Body() dto: UpdateInstallmentPlanDto) {
    return this.installmentsService.updatePlan(id, dto);
  }

  @Get('overdue')
  @Roles(Role.ADMIN, Role.CASHIER)
  getOverduePayments() {
    return this.installmentsService.getOverduePayments();
  }

  @Get('upcoming')
  @Roles(Role.ADMIN, Role.CASHIER)
  getUpcomingPayments(@Query('days') days?: string) {
    return this.installmentsService.getUpcomingPayments(days ? parseInt(days) : 7);
  }

  @Post('mark-overdue')
  @Roles(Role.ADMIN)
  markOverduePayments() {
    return this.installmentsService.markOverduePayments();
  }
}
