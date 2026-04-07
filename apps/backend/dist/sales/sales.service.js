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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const enums_1 = require("../common/enums");
let SalesService = class SalesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.saleInclude = {
            cashier: { select: { id: true, fullName: true, username: true } },
            customer: true,
            items: {
                include: {
                    product: {
                        select: {
                            id: true, name: true, sku: true, barcode: true, warrantyMonths: true,
                            brand: { select: { name: true } },
                            category: { select: { name: true } },
                        },
                    },
                },
            },
        };
    }
    async findAll(userId, userRole) {
        return this.prisma.sale.findMany({
            where: userRole === enums_1.Role.CASHIER ? { cashierId: userId } : undefined,
            include: this.saleInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId, userRole) {
        const sale = await this.prisma.sale.findUnique({ where: { id }, include: this.saleInclude });
        if (!sale)
            throw new common_1.NotFoundException('Sale not found');
        if (userRole === enums_1.Role.CASHIER && sale.cashierId !== userId)
            throw new common_1.ForbiddenException('Access denied');
        return sale;
    }
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const count = await this.prisma.sale.count();
        const seq = String(count + 1).padStart(5, '0');
        return `INV-${year}-${seq}`;
    }
    async create(dto, cashierId) {
        const productMap = new Map();
        for (const item of dto.items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (!product)
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            if (!product.isActive)
                throw new common_1.BadRequestException(`Product ${product.name} is inactive`);
            if (product.stock < item.quantity)
                throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            productMap.set(item.productId, product);
        }
        const taxRate = dto.tax || 0;
        const subtotal = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity - (i.discount || 0), 0);
        const discountAmount = dto.discount || 0;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = +(taxableAmount * (taxRate / 100)).toFixed(2);
        const total = +(taxableAmount + taxAmount).toFixed(2);
        const amountPaid = dto.amountPaid ?? (dto.paymentMethod === 'CASH' ? total : total);
        const changeGiven = +(amountPaid - total).toFixed(2);
        const invoiceNumber = await this.generateInvoiceNumber();
        const sale = await this.prisma.$transaction(async (tx) => {
            const s = await tx.sale.create({
                data: {
                    invoiceNumber,
                    cashierId,
                    customerId: dto.customerId,
                    subtotal,
                    discount: discountAmount,
                    tax: taxRate,
                    taxAmount,
                    total,
                    amountPaid,
                    changeGiven: Math.max(0, changeGiven),
                    paymentMethod: dto.paymentMethod,
                    notes: dto.notes,
                    items: {
                        create: dto.items.map((i) => {
                            const prod = productMap.get(i.productId);
                            return {
                                productId: i.productId,
                                quantity: i.quantity,
                                unitPrice: i.unitPrice,
                                discount: i.discount || 0,
                                total: +(i.unitPrice * i.quantity - (i.discount || 0)).toFixed(2),
                                serialNumber: i.serialNumber,
                                warrantyMonths: i.warrantyMonths ?? prod?.warrantyMonths ?? 0,
                            };
                        }),
                    },
                },
                include: this.saleInclude,
            });
            for (const item of dto.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
                await tx.inventoryLog.create({
                    data: {
                        productId: item.productId,
                        type: 'STOCK_OUT',
                        quantity: item.quantity,
                        reason: `Sale ${invoiceNumber}`,
                        performedById: cashierId,
                    },
                });
            }
            return s;
        });
        return sale;
    }
    async deleteAll() {
        return this.prisma.$transaction(async (tx) => {
            const items = await tx.saleItem.findMany({ select: { productId: true, quantity: true } });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            await tx.inventoryLog.deleteMany({ where: { type: 'STOCK_OUT', reason: { startsWith: 'Sale ' } } });
            await tx.saleItem.deleteMany({});
            await tx.sale.deleteMany({});
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map