import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { FirstAdminDto } from './dto/first-admin.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}

  async removeDemoUsersForFreshProductionDb() {
    if (process.env.NODE_ENV !== 'production' || process.env.POS_FRESH_DB !== '1') return;

    const saleCount = await this.prisma.sale.count();
    if (saleCount > 0) return;

    await this.prisma.user.deleteMany({
      where: {
        OR: [
          { username: 'admin' },
          { username: 'cashier1' },
        ],
      },
    });
  }

  async getStatus() {
    const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    return {
      needsFirstAdmin: adminCount === 0,
      adminExists: adminCount > 0,
    };
  }

  async createFirstAdmin(dto: FirstAdminDto) {
    const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount > 0) {
      throw new BadRequestException('First admin has already been created');
    }

    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Username already taken');

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: dto.username,
          password,
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          role: Role.ADMIN,
          isActive: true,
        },
      });

      const settings = [
        { key: 'pos_name', value: dto.posName },
        { key: 'shop_name', value: dto.shopName },
        { key: 'shop_phone', value: dto.phone || '' },
        { key: 'currency', value: 'PKR' },
        { key: 'receipt_footer', value: 'Thank you for shopping with us!' },
        { key: 'tax_rate', value: '0' },
        { key: 'receipt_format', value: 'thermal_80' },
      ];

      for (const setting of settings) {
        await tx.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting,
        });
      }

      return created;
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }
}
