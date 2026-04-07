import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { barcode: { contains: search } },
            ],
          }
        : undefined,
      include: { category: true, brand: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id }, include: { category: true, brand: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findByBarcode(barcode: string) {
    const p = await this.prisma.product.findFirst({
      where: { barcode }, include: { category: true, brand: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findFirst({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException('SKU already exists');
    return this.prisma.product.create({ data: dto, include: { category: true, brand: true } });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id }, data: dto, include: { category: true, brand: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  getLowStock() {
    return this.prisma.product.findMany({
      where: { stock: { lte: this.prisma.product.fields.lowStockLimit as any } },
      include: { category: true, brand: true },
    });
  }
}
