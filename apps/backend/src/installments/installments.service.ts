import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstallmentPlanDto, RecordInstallmentPaymentDto, UpdateInstallmentPlanDto } from './dto/installment.dto';

@Injectable()
export class InstallmentsService {
  constructor(private prisma: PrismaService) {}

  async createPlan(dto: CreateInstallmentPlanDto) {
    // Validate sale exists
    const sale = await this.prisma.sale.findUnique({
      where: { id: dto.saleId },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Check if plan already exists for this sale
    const existing = await this.prisma.installmentPlan.findUnique({
      where: { saleId: dto.saleId },
    });

    if (existing) {
      throw new BadRequestException('Installment plan already exists for this sale');
    }

    // Calculate end date
    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.installments);

    // Create plan
    const plan = await this.prisma.installmentPlan.create({
      data: {
        saleId: dto.saleId,
        totalAmount: dto.totalAmount,
        downPayment: dto.downPayment,
        monthlyAmount: dto.monthlyAmount,
        installments: dto.installments,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });

    // Generate payment schedule
    const payments = [];
    for (let i = 1; i <= dto.installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      payments.push({
        planId: plan.id,
        installmentNo: i,
        amount: dto.monthlyAmount,
        dueDate,
        status: 'PENDING',
      });
    }

    await this.prisma.installmentPayment.createMany({ data: payments });

    return this.getPlan(plan.id);
  }

  async getPlan(id: string) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            customer: true,
            cashier: { select: { id: true, fullName: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
        payments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    if (!plan) {
      throw new NotFoundException('Installment plan not found');
    }

    return plan;
  }

  async getAll(status?: string) {
    const where = status ? { status } : {};

    return this.prisma.installmentPlan.findMany({
      where,
      include: {
        sale: {
          include: {
            customer: true,
            cashier: { select: { id: true, fullName: true } },
          },
        },
        payments: {
          where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlanBySale(saleId: string) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { saleId },
      include: {
        payments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    if (!plan) {
      throw new NotFoundException('No installment plan found for this sale');
    }

    return plan;
  }

  async recordPayment(dto: RecordInstallmentPaymentDto) {
    const payment = await this.prisma.installmentPayment.findFirst({
      where: {
        planId: dto.planId,
        installmentNo: dto.installmentNo,
      },
      include: {
        plan: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Installment payment not found');
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException('This installment has already been paid');
    }

    const updatedPayment = await this.prisma.installmentPayment.update({
      where: { id: payment.id },
      data: {
        paidDate: new Date(),
        paidAmount: dto.paidAmount,
        status: dto.paidAmount >= payment.amount ? 'PAID' : 'PARTIAL',
        notes: dto.notes,
      },
    });

    // Check if all payments are completed
    const allPayments = await this.prisma.installmentPayment.findMany({
      where: { planId: dto.planId },
    });

    const allPaid = allPayments.every((p) => p.status === 'PAID');

    if (allPaid) {
      await this.prisma.installmentPlan.update({
        where: { id: dto.planId },
        data: { status: 'COMPLETED' },
      });
    }

    return updatedPayment;
  }

  async updatePlan(id: string, dto: UpdateInstallmentPlanDto) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Installment plan not found');
    }

    return this.prisma.installmentPlan.update({
      where: { id },
      data: dto,
    });
  }

  async getOverduePayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.installmentPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
      },
      include: {
        plan: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getUpcomingPayments(days: number = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + days);

    return this.prisma.installmentPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: today,
          lte: future,
        },
      },
      include: {
        plan: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markOverduePayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.installmentPayment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    return { updated: result.count };
  }
}
