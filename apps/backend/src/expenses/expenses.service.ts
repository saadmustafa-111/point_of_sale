import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private async nextExpenseNumber() {
    const expenseModel = (this.prisma as any).expense;
    const count = await expenseModel.count();
    return `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }

  findAll(startDate?: string, endDate?: string, category?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    return (this.prisma as any).expense.findMany({
      where,
      include: { createdBy: { select: { id: true, fullName: true, username: true } } },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async create(dto: CreateExpenseDto, userId: string) {
    return (this.prisma as any).expense.create({
      data: {
        expenseNumber: await this.nextExpenseNumber(),
        title: dto.title,
        category: dto.category,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        paymentMethod: dto.paymentMethod || 'CASH',
        notes: dto.notes,
        receiptNumber: dto.receiptNumber,
        vendor: dto.vendor,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, fullName: true, username: true } } },
    });
  }

  async remove(id: string) {
    const expense = await (this.prisma as any).expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return (this.prisma as any).expense.delete({ where: { id } });
  }

  summary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    return (this.prisma as any).expense.findMany({
      where,
      select: { amount: true, category: true, expenseDate: true },
    }).then((expenses) => {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const byCategory = expenses.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});
      return { total, count: expenses.length, byCategory, expenses };
    });
  }
}
