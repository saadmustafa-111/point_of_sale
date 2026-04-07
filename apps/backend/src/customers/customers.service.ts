import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id }, include: { sales: true } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  create(dto: CreateCustomerDto) { return this.prisma.customer.create({ data: dto }); }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) { await this.findOne(id); return this.prisma.customer.delete({ where: { id } }); }
}
