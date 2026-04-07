import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date: string) { return this.service.dailySales(date || new Date().toISOString().split('T')[0]); }

  @Get('monthly')
  monthly(@Query('year') year: string, @Query('month') month: string) {
    return this.service.monthlySales(+year || new Date().getFullYear(), +month || new Date().getMonth() + 1);
  }

  @Get('top-products')
  topProducts(@Query('limit') limit?: string) { return this.service.topSellingProducts(+limit || 10); }

  @Get('low-stock')
  lowStock() { return this.service.lowStockReport(); }

  @Get('cashier-sales')
  cashierSales(@Query('startDate') s?: string, @Query('endDate') e?: string) {
    return this.service.cashierWiseSales(s, e);
  }
}
