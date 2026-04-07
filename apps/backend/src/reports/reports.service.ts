import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async dailySales(date: string) {
    // Parse date parts and construct using local-timezone constructor
    // to avoid UTC-parse offset shifting the window by ±N hours
    const [y, m, d] = date.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end   = new Date(y, m - 1, d, 23, 59, 59, 999);
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { cashier: { select: { fullName: true } }, items: true },
    });
    const total     = sales.reduce((s, sale) => s + sale.total, 0);
    const discount  = sales.reduce((s, sale) => s + sale.discount, 0);
    const itemsSold = sales.reduce((s, sale) => s + sale.items.reduce((si, i) => si + i.quantity, 0), 0);
    return { date, count: sales.length, total, discount, itemsSold, sales };
  }

  async monthlySales(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { cashier: { select: { fullName: true } } },
    });
    const total = sales.reduce((s, sale) => s + sale.total, 0);
    return { year, month, count: sales.length, total, sales };
  }

  async topSellingProducts(limit = 10) {
    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    return items.map((item) => ({
      product: products.find((p) => p.id === item.productId),
      totalQty: item._sum.quantity,
      totalRevenue: item._sum.total,
    }));
  }

  async lowStockReport() {
    return this.prisma.product.findMany({
      where: { stock: { lte: this.prisma.product.fields.lowStockLimit as any } },
      include: { category: true, brand: true },
      orderBy: { stock: 'asc' },
    });
  }

  async cashierWiseSales(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const cashiers = await this.prisma.user.findMany({ where: { role: 'CASHIER' } });
    const results = [];
    for (const cashier of cashiers) {
      const sales = await this.prisma.sale.findMany({
        where: { cashierId: cashier.id, ...where },
      });
      results.push({
        cashier: { id: cashier.id, fullName: cashier.fullName },
        count: sales.length,
        total: sales.reduce((s, sale) => s + sale.total, 0),
      });
    }
    return results;
  }
}
