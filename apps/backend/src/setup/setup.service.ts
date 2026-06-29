import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { FirstAdminDto } from './dto/first-admin.dto';
import * as bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = '123456';
const DEFAULT_ADMIN_NAME = 'System Administrator';
const DEFAULT_POS_NAME = 'Home Appliances POS';
const DEFAULT_SHOP_NAME = 'My Home Appliances Shop';

@Injectable()
export class SetupService {
  constructor(private prisma: PrismaService) {}

  async ensureDefaultAdminAccount() {
    const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount > 0) return;

    const password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          username: DEFAULT_ADMIN_USERNAME,
          password,
          fullName: DEFAULT_ADMIN_NAME,
          role: Role.ADMIN,
          isActive: true,
        },
      });

      const settings = [
        { key: 'pos_name', value: DEFAULT_POS_NAME },
        { key: 'shop_name', value: DEFAULT_SHOP_NAME },
        { key: 'shop_phone', value: '' },
        { key: 'currency', value: 'PKR' },
        { key: 'receipt_footer', value: 'Thank you for shopping with us!' },
        { key: 'tax_rate', value: '0' },
        { key: 'receipt_format', value: 'thermal_80' },
      ];

      for (const setting of settings) {
        await tx.setting.upsert({
          where: { key: setting.key },
          update: {},
          create: setting,
        });
      }
    });
  }

  async removeDemoUsersForFreshProductionDb() {
    if (process.env.NODE_ENV !== 'production' || process.env.POS_FRESH_DB !== '1') return;

    const saleCount = await this.prisma.sale.count();
    if (saleCount > 0) return;

    await this.prisma.user.deleteMany({
      where: { role: { not: Role.ADMIN } },
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

  async resetApplicationData() {
    return this.prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({});
      await tx.installmentPlan.deleteMany({});
      await tx.returnItem.deleteMany({});
      await tx.return.deleteMany({});
      await tx.servicePart.deleteMany({});
      await tx.serviceCharge.deleteMany({});
      await tx.serviceJob.deleteMany({});
      await tx.creditTransaction.deleteMany({});
      await tx.customerCredit.deleteMany({});
      await tx.supplierPayment.deleteMany({});
      await tx.purchaseOrderItem.deleteMany({});
      await tx.purchaseOrder.deleteMany({});
      await tx.saleItem.deleteMany({});
      await tx.sale.deleteMany({});
      await tx.expense.deleteMany({});
      await tx.inventoryLog.deleteMany({});
      await tx.product.deleteMany({});
      await tx.customer.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.brand.deleteMany({});
      await tx.category.deleteMany({});
      await tx.setting.deleteMany({});
      await tx.user.deleteMany({});
    });

    return {
      success: true,
      needsFirstAdmin: false,
      message: 'All application data has been deleted.',
    };
  }
}
