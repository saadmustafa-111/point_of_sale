import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}
  findAll()      { return this.prisma.brand.findMany({ orderBy: { name: 'asc' } }); }
  async findOne(id: string) {
    const b = await this.prisma.brand.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }
  create(dto: CreateBrandDto)                { return this.prisma.brand.create({ data: dto }); }
  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    return this.prisma.brand.update({ where: { id }, data: dto });
  }
  async remove(id: string) { await this.findOne(id); return this.prisma.brand.delete({ where: { id } }); }
}
