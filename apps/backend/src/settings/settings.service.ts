import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() { return this.prisma.setting.findMany(); }

  async getPublicBranding() {
    const settings = await this.prisma.setting.findMany({
      where: { key: { in: ['pos_name', 'shop_name', 'shop_address', 'shop_phone', 'currency'] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      posName: map.pos_name || map.shop_name || 'Home Appliances POS',
      shopName: map.shop_name || map.pos_name || 'Home Appliances POS',
      shopAddress: map.shop_address || '',
      shopPhone: map.shop_phone || '',
      currency: map.currency || 'PKR',
    };
  }

  async get(key: string) { return this.prisma.setting.findUnique({ where: { key } }); }

  async upsert(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async upsertMany(entries: { key: string; value: string }[]) {
    return Promise.all(entries.map((e) => this.upsert(e.key, e.value)));
  }
}
