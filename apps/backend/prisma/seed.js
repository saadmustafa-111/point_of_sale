"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const adminPass = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPass,
            fullName: 'System Administrator',
            role: client_1.Role.ADMIN,
        },
    });
    const cashierPass = await bcrypt.hash('cashier123', 10);
    await prisma.user.upsert({
        where: { username: 'cashier1' },
        update: {},
        create: {
            username: 'cashier1',
            password: cashierPass,
            fullName: 'Ali Cashier',
            role: client_1.Role.CASHIER,
        },
    });
    const cats = ['Air Conditioners', 'Refrigerators', 'Washing Machines', 'TVs', 'Small Appliances'];
    for (const name of cats) {
        await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    }
    const brands = ['Samsung', 'LG', 'Sony', 'Haier', 'Dawlance', 'Panasonic', 'Gree', 'Orient'];
    for (const name of brands) {
        await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
    }
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
    console.log('   Admin  → username: admin    password: admin123');
    console.log('   Cashier→ username: cashier1 password: cashier123');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map