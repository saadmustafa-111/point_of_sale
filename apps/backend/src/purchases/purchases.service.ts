import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseOrderDto,
  ReceiveOrderDto,
  UpdatePurchaseOrderDto,
  CreateSupplierPaymentDto,
} from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  // ─── Purchase Orders ───────────────────────────────────────────────────────

  async createOrder(dto: CreatePurchaseOrderDto) {
    // Validate supplier
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Generate order number
    const count = await this.prisma.purchaseOrder.count();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = dto.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const discount = dto.discountAmount ?? 0;
    const tax = dto.taxAmount ?? 0;
    const totalAmount = subtotal - discount + tax;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: dto.supplierId,
          status: 'PENDING',
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
          subtotal,
          discountAmount: discount,
          taxAmount: tax,
          totalAmount,
          remainingAmount: totalAmount,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId ?? null,
              productName: item.productName,
              sku: item.sku ?? null,
              quantity: item.quantity,
              receivedQty: 0,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
              notes: item.notes ?? null,
            })),
          },
        },
        include: { items: true },
      });

      // Increase supplier balance (we now owe them)
      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: { currentBalance: { increment: totalAmount } },
      });

      return created;
    });

    return this.getOrder(order.id);
  }

  async getOrders(supplierId?: string, status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        ...(supplierId ? { supplierId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    return order;
  }

  async receiveOrder(id: string, dto: ReceiveOrderDto) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot receive a cancelled order');
    }

    await this.prisma.$transaction(async (tx) => {
      const receivedDate = dto.receivedDate ? new Date(dto.receivedDate) : new Date();

      // Update each item's received qty and increase stock
      for (const item of order.items) {
        const override = dto.receivedItems?.find((r) => r.itemId === item.id);
        const qty = override ? override.receivedQty : item.quantity;

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: qty },
        });

        // Update product stock if linked
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: qty } },
          });
        }
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: order.paidAmount >= order.totalAmount ? 'PAID' : 'RECEIVED',
          receivedDate,
          notes: dto.notes ? `${order.notes ?? ''}\n${dto.notes}` : order.notes,
        },
      });
    });

    return this.getOrder(id);
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Purchase order not found');
    if (['PAID', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel an order with status: ${order.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
      // Reverse supplier balance if order was affecting it
      if (order.status !== 'PENDING') {
        const outstanding = order.totalAmount - order.paidAmount;
        await tx.supplier.update({
          where: { id: order.supplierId },
          data: { currentBalance: { decrement: outstanding } },
        });
      } else {
        await tx.supplier.update({
          where: { id: order.supplierId },
          data: { currentBalance: { decrement: order.totalAmount } },
        });
      }
    });

    return this.getOrder(id);
  }

  // ─── Supplier Payments ─────────────────────────────────────────────────────

  async recordPayment(dto: CreateSupplierPaymentDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    if (dto.orderId) {
      const order = await this.prisma.purchaseOrder.findUnique({
        where: { id: dto.orderId },
      });
      if (!order) throw new NotFoundException('Purchase order not found');
      if (order.supplierId !== dto.supplierId) {
        throw new BadRequestException('Order does not belong to this supplier');
      }
    }

    // Generate payment number
    const count = await this.prisma.supplierPayment.count();
    const paymentNumber = `SP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierPayment.create({
        data: {
          paymentNumber,
          supplierId: dto.supplierId,
          orderId: dto.orderId ?? null,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod ?? 'CASH',
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          referenceNo: dto.referenceNo ?? null,
          notes: dto.notes ?? null,
          recordedBy: dto.recordedBy ?? null,
        },
      });

      // Reduce supplier balance
      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: { currentBalance: { decrement: dto.amount } },
      });

      // If order-specific – update order paid/remaining amounts and status
      if (dto.orderId) {
        const order = await tx.purchaseOrder.findUnique({ where: { id: dto.orderId } });
        if (order) {
          const newPaid = order.paidAmount + dto.amount;
          const newRemaining = Math.max(0, order.totalAmount - newPaid);
          const newStatus =
            newRemaining <= 0
              ? 'PAID'
              : order.status === 'RECEIVED' || order.status === 'PARTIALLY_PAID'
              ? 'PARTIALLY_PAID'
              : order.status;

          await tx.purchaseOrder.update({
            where: { id: dto.orderId },
            data: { paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus },
          });
        }
      }

      return created;
    });

    return payment;
  }

  async getPayments(supplierId?: string, orderId?: string) {
    return this.prisma.supplierPayment.findMany({
      where: {
        ...(supplierId ? { supplierId } : {}),
        ...(orderId ? { orderId } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  // ─── Dashboard Stats ───────────────────────────────────────────────────────

  async getStats() {
    const [
      totalOrders,
      pendingOrders,
      receivedOrders,
      totalOutstanding,
      recentPayments,
    ] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { status: { not: 'CANCELLED' } } }),
      this.prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.purchaseOrder.count({ where: { status: { in: ['RECEIVED', 'PARTIALLY_PAID'] } } }),
      this.prisma.supplier
        .aggregate({ _sum: { currentBalance: true } })
        .then((r) => r._sum.currentBalance ?? 0),
      this.prisma.supplierPayment.findMany({
        orderBy: { paymentDate: 'desc' },
        take: 5,
        include: { supplier: { select: { name: true } } },
      }),
    ]);

    return { totalOrders, pendingOrders, receivedOrders, totalOutstanding, recentPayments };
  }
}
