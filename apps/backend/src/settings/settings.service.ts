import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() { return this.prisma.setting.findMany(); }

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
