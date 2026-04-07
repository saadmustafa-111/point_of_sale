import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Role } from '../src/common/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPass = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { fullName: 'Saad Mustafa', password: adminPass, email: 'saaddevpro123@gmail.com' },
    create: {
      username: 'admin',
      password: adminPass,
      fullName: 'Saad Mustafa',
      email: 'saaddevpro123@gmail.com',
      role: Role.ADMIN,
    },
  });

  // Demo cashier
  const cashierPass = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: { fullName: 'Ali Cashier', password: cashierPass },
    create: {
      username: 'cashier1',
      password: cashierPass,
      fullName: 'Ali Cashier',
      role: Role.CASHIER,
    },
  });

  // Categories
  const cats = ['Air Conditioners', 'Refrigerators', 'Washing Machines', 'TVs', 'Small Appliances'];
  for (const name of cats) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Brands
  const brands = ['Samsung', 'LG', 'Sony', 'Haier', 'Dawlance', 'Panasonic', 'Gree', 'Orient'];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Settings
  const defaults = [
    { key: 'shop_name', value: 'Al-Noor Home Appliances' },
    { key: 'shop_address', value: 'Main Bazaar, Lahore, Pakistan' },
    { key: 'shop_phone', value: '+92-300-0000000' },
    { key: 'currency', value: 'PKR' },
    { key: 'receipt_footer', value: 'Thank you for shopping with us!' },
    { key: 'tax_rate', value: '0' },
  ];
  for (const s of defaults) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log('✅ Seeding complete');
  console.log('   Admin  → username: admin    password: 123456');
  console.log('   Cashier→ username: cashier1 password: 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
