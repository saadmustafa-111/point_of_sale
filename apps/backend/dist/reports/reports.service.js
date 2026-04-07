"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dailySales(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const sales = await this.prisma.sale.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: { cashier: { select: { fullName: true } }, items: true },
        });
        const total = sales.reduce((s, sale) => s + sale.total, 0);
        return { date, count: sales.length, total, sales };
    }
    async monthlySales(year, month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        const sales = await this.prisma.sale.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: { cashier: { select: { fullName: true } } },
        });
        const total = sales.reduce((s, sale) => s + sale.total, 0);
        return { year, month, count: sales.length, total, sales };
    }
    async topSellingProducts(limit = 10) {
        const items = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
        });
        const productIds = items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, sku: true },
        });
        return items.map((item) => ({
            product: products.find((p) => p.id === item.productId),
            totalQty: item._sum.quantity,
            totalRevenue: item._sum.total,
        }));
    }
    async lowStockReport() {
        return this.prisma.product.findMany({
            where: { stock: { lte: this.prisma.product.fields.lowStockLimit } },
            include: { category: true, brand: true },
            orderBy: { stock: 'asc' },
        });
    }
    async cashierWiseSales(startDate, endDate) {
        const where = {};
        if (startDate)
            where.createdAt = { gte: new Date(startDate) };
        if (endDate)
            where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
        const cashiers = await this.prisma.user.findMany({ where: { role: 'CASHIER' } });
        const results = [];
        for (const cashier of cashiers) {
            const sales = await this.prisma.sale.findMany({
                where: { cashierId: cashier.id, ...where },
            });
            results.push({
                cashier: { id: cashier.id, fullName: cashier.fullName },
                count: sales.length,
                total: sales.reduce((s, sale) => s + sale.total, 0),
            });
        }
        return results;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map