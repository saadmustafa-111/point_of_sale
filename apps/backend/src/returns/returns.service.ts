import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto, UpdateReturnDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReturnDto) {
    // Validate sale exists
    const sale = await this.prisma.sale.findUnique({
      where: { id: dto.originalSaleId },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Original sale not found');
    }

    // Generate return number
    const count = await this.prisma.return.count();
    const returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create return with items in a transaction
    const returnRecord = await this.prisma.$transaction(async (tx) => {
      const createdReturn = await tx.return.create({
        data: {
          returnNumber,
          originalSaleId: dto.originalSaleId,
          type: dto.type,
          reason: dto.reason,
          refundAmount: dto.refundAmount,
          restockingFee: dto.restockingFee,
          processedBy: dto.processedBy,
          customerId: dto.customerId,
          status: 'PENDING',
          notes: dto.notes,
        },
      });

      // Create return items
      for (const item of dto.items) {
        await tx.returnItem.create({
          data: {
            returnId: createdReturn.id,
            productId: item.productId,
            quantity: item.quantity,
            serialNumber: item.serialNumber,
            reason: item.reason,
            condition: item.condition,
            refundAmount: item.refundAmount,
          },
        });

        // If DEFECTIVE or restocking, update inventory
        if (item.condition !== 'DEFECTIVE') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return createdReturn;
    });

    return this.getReturn(returnRecord.id);
  }

  async getReturn(id: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        returnItems: {
          include: {
            return: true,
          },
        },
      },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    return returnRecord;
  }

  async getAll(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return this.prisma.return.findMany({
      where,
      include: {
        returnItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateReturnDto) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    return this.prisma.return.update({
      where: { id },
      data: dto,
    });
  }

  async approve(id: string, approvedBy: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    if (returnRecord.status !== 'PENDING') {
      throw new BadRequestException('Return has already been processed');
    }

    return this.prisma.return.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
      },
    });
  }

  async reject(id: string, approvedBy: string, notes?: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: { returnItems: true },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    if (returnRecord.status !== 'PENDING') {
      throw new BadRequestException('Return has already been processed');
    }

    // Revert inventory changes if rejected
    await this.prisma.$transaction(async (tx) => {
      for (const item of returnRecord.returnItems) {
        if (item.condition !== 'DEFECTIVE') {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.return.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedBy,
          notes: notes || returnRecord.notes,
        },
      });
    });

    return this.getReturn(id);
  }

  async complete(id: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    if (returnRecord.status !== 'APPROVED') {
      throw new BadRequestException('Return must be approved first');
    }

    return this.prisma.return.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }
}
