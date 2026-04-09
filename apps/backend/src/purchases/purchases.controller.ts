import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import {
  CreatePurchaseOrderDto,
  ReceiveOrderDto,
  CreateSupplierPaymentDto,
} from './dto/purchase.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // ─── Purchase Orders ────────────────────────────────────────────────────────

  @Post('orders')
  @Roles(Role.ADMIN)
  createOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasesService.createOrder(dto);
  }

  @Get('orders')
  @Roles(Role.ADMIN)
  getOrders(
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
  ) {
    return this.purchasesService.getOrders(supplierId, status);
  }

  @Get('orders/:id')
  @Roles(Role.ADMIN)
  getOrder(@Param('id') id: string) {
    return this.purchasesService.getOrder(id);
  }

  @Post('orders/:id/receive')
  @Roles(Role.ADMIN)
  receiveOrder(@Param('id') id: string, @Body() dto: ReceiveOrderDto) {
    return this.purchasesService.receiveOrder(id, dto);
  }

  @Post('orders/:id/cancel')
  @Roles(Role.ADMIN)
  cancelOrder(@Param('id') id: string) {
    return this.purchasesService.cancelOrder(id);
  }

  // ─── Supplier Payments ──────────────────────────────────────────────────────

  @Post('payments')
  @Roles(Role.ADMIN)
  recordPayment(@Body() dto: CreateSupplierPaymentDto) {
    return this.purchasesService.recordPayment(dto);
  }

  @Get('payments')
  @Roles(Role.ADMIN)
  getPayments(
    @Query('supplierId') supplierId?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.purchasesService.getPayments(supplierId, orderId);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.purchasesService.getStats();
  }
}
