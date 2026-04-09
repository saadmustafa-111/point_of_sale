import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Supplier "${dto.name}" already exists`);
    }

    return this.prisma.supplier.create({ data: { ...dto, currentBalance: 0 } });
  }

  async getAll(search?: string) {
    return this.prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { contactPerson: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            _count: { select: { payments: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async getSummary() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
    });

    const totalOutstanding = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalSuppliers = suppliers.length;
    const suppliersWithBalance = suppliers.filter((s) => s.currentBalance > 0).length;

    return { totalSuppliers, totalOutstanding, suppliersWithBalance };
  }
}
