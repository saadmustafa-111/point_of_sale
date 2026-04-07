import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
import { InventoryType } from '../common/enums';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  findAll(productId?: string) {
    return this.prisma.inventoryLog.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        performedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateInventoryLogDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const stockChange =
      dto.type === InventoryType.STOCK_IN
        ? dto.quantity
        : dto.type === InventoryType.STOCK_OUT
        ? -dto.quantity
        : dto.quantity - product.stock; // ADJUSTMENT sets absolute

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryLog.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          performedById: userId,
        },
      });
      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: { increment: stockChange } },
      });
    });

    return this.prisma.product.findUnique({ where: { id: dto.productId } });
  }
}
