import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/sale.dto';
import { Role } from '../common/enums';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private saleInclude = {
    cashier: { select: { id: true, fullName: true, username: true } },
    customer: true,
    items: {
      include: {
        product: {
          select: {
            id: true, name: true, sku: true, barcode: true, warrantyMonths: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    },
  };

  async findAll(userId: string, userRole: Role) {
    return this.prisma.sale.findMany({
      where: userRole === Role.CASHIER ? { cashierId: userId } : undefined,
      include: this.saleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const sale = await this.prisma.sale.findUnique({ where: { id }, include: this.saleInclude });
    if (!sale) throw new NotFoundException('Sale not found');
    if (userRole === Role.CASHIER && sale.cashierId !== userId)
      throw new ForbiddenException('Access denied');
    return sale;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.sale.count();
    const seq = String(count + 1).padStart(5, '0');
    return `INV-${year}-${seq}`;
  }

  async create(dto: CreateSaleDto, cashierId: string) {
    // Validate & load all products
    const productMap = new Map<string, any>();
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (!product.isActive) throw new BadRequestException(`Product ${product.name} is inactive`);
      if (product.stock < item.quantity)
        throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      productMap.set(item.productId, product);
    }

    const taxRate = dto.tax || 0;
    const subtotal = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity - (i.discount || 0), 0);
    const discountAmount = dto.discount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = +(taxableAmount * (taxRate / 100)).toFixed(2);
    const total = +(taxableAmount + taxAmount).toFixed(2);
    const amountPaid = dto.amountPaid ?? (dto.paymentMethod === 'CASH' ? total : total);
    const changeGiven = +(amountPaid - total).toFixed(2);

    const invoiceNumber = await this.generateInvoiceNumber();

    const sale = await this.prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({
        data: {
          invoiceNumber,
          cashierId,
          customerId: dto.customerId,
          subtotal,
          discount: discountAmount,
          tax: taxRate,
          taxAmount,
          total,
          amountPaid,
          changeGiven: Math.max(0, changeGiven),
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          items: {
            create: dto.items.map((i) => {
              const prod = productMap.get(i.productId);
              return {
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discount: i.discount || 0,
                total: +(i.unitPrice * i.quantity - (i.discount || 0)).toFixed(2),
                serialNumber: i.serialNumber,
                warrantyMonths: i.warrantyMonths ?? prod?.warrantyMonths ?? 0,
              };
            }),
          },
        },
        include: this.saleInclude,
      });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'STOCK_OUT',
            quantity: item.quantity,
            reason: `Sale ${invoiceNumber}`,
            performedById: cashierId,
          },
        });
      }
      return s;
    });

    return sale;
  }

  async deleteAll() {
    return this.prisma.$transaction(async (tx) => {
      // Restore stock for all sold items before deleting
      const items = await tx.saleItem.findMany({ select: { productId: true, quantity: true } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      // Delete inventory logs created by sales (STOCK_OUT with 'Sale' reason)
      await tx.inventoryLog.deleteMany({ where: { type: 'STOCK_OUT', reason: { startsWith: 'Sale ' } } });
      // Delete all sale items then sales
      await tx.saleItem.deleteMany({});
      await tx.sale.deleteMany({});
    });
  }
}
