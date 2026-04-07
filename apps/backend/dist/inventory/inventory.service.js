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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const enums_1 = require("../common/enums");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(productId) {
        return this.prisma.inventoryLog.findMany({
            where: productId ? { productId } : undefined,
            include: {
                product: { select: { id: true, name: true, sku: true } },
                performedBy: { select: { id: true, fullName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, userId) {
        const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const stockChange = dto.type === enums_1.InventoryType.STOCK_IN
            ? dto.quantity
            : dto.type === enums_1.InventoryType.STOCK_OUT
                ? -dto.quantity
                : dto.quantity - product.stock;
        await this.prisma.$transaction(async (tx) => {
            await tx.inventoryLog.create({
                data: {
                    productId: dto.productId,
                    type: dto.type,
                    quantity: dto.quantity,
                    reason: dto.reason,
                    performedById: userId,
                },
            });
            await tx.product.update({
                where: { id: dto.productId },
                data: { stock: { increment: stockChange } },
            });
        });
        return this.prisma.product.findUnique({ where: { id: dto.productId } });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map