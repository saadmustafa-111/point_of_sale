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
      include: { cashier: { select: { fullName: true } }, items: { include: { product: { select: { purchasePrice: true } } } } },
    });
    const total     = sales.reduce((s, sale) => s + sale.total, 0);
    const discount  = sales.reduce((s, sale) => s + sale.discount, 0);
    const itemsSold = sales.reduce((s, sale) => s + sale.items.reduce((si, i) => si + i.quantity, 0), 0);
    const cogs = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + (item.product?.purchasePrice || 0) * item.quantity, 0), 0);
    const grossProfit = total - cogs;
    return { date, count: sales.length, total, discount, itemsSold, cogs, grossProfit, sales };
  }

  async monthlySales(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { cashier: { select: { fullName: true } }, items: { include: { product: { select: { purchasePrice: true } } } } },
    });
    const total = sales.reduce((s, sale) => s + sale.total, 0);
    const cogs = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + (item.product?.purchasePrice || 0) * item.quantity, 0), 0);
    return { year, month, count: sales.length, total, cogs, grossProfit: total - cogs, sales };
  }

  async weeklySales(endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: { select: { purchasePrice: true } } } } },
    });

    const total = sales.reduce((s, sale) => s + sale.total, 0);
    const cogs = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + (item.product?.purchasePrice || 0) * item.quantity, 0), 0);
    return { startDate: start.toISOString(), endDate: end.toISOString(), count: sales.length, total, cogs, grossProfit: total - cogs, sales };
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

  async inventorySummary() {
    const [products, stockIn, stockOut, adjustments, soldLogs] = await Promise.all([
      this.prisma.product.findMany({ select: { id: true, stock: true, purchasePrice: true } }),
      this.prisma.inventoryLog.count({ where: { type: 'STOCK_IN' } }),
      this.prisma.inventoryLog.count({ where: { type: 'STOCK_OUT' } }),
      this.prisma.inventoryLog.count({ where: { type: 'ADJUSTMENT' } }),
      this.prisma.inventoryLog.findMany({ where: { type: 'STOCK_OUT', reason: { startsWith: 'Sale ' } }, select: { quantity: true } }),
    ]);

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.stock * (p.purchasePrice || 0), 0);
    const soldUnits = soldLogs.reduce((sum, log) => sum + log.quantity, 0);

    return { totalProducts, totalUnits, inventoryValue, stockIn, stockOut, adjustments, soldUnits };
  }

  async expenseSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const expenses = await (this.prisma as any).expense.findMany({
      where,
      select: { amount: true, category: true, expenseDate: true },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    return { totalExpenses, expenseCount: expenses.length, byCategory, expenses };
  }

  async profitSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const prismaAny = this.prisma as any;
    const [sales, expenses] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: { items: { include: { product: { select: { purchasePrice: true } } } } },
      }),
      prismaAny.expense.findMany({
        where: startDate || endDate ? { expenseDate: where.createdAt } : undefined,
        select: { amount: true, category: true, expenseDate: true },
      }),
    ]);

    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const cogs = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + (item.product?.purchasePrice || 0) * item.quantity, 0), 0);
    const grossProfit = revenue - cogs;
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = grossProfit - expenseTotal;

    return { revenue, cogs, grossProfit, expenseTotal, netProfit, salesCount: sales.length, expenseCount: expenses.length };
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
