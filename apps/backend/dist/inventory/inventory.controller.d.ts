import { InventoryService } from './inventory.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
export declare class InventoryController {
    private service;
    constructor(service: InventoryService);
    all(productId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        product: {
            name: string;
            id: string;
            sku: string;
        };
        performedBy: {
            id: string;
            fullName: string;
        };
    } & {
        type: string;
        id: string;
        createdAt: Date;
        productId: string;
        quantity: number;
        reason: string | null;
        performedById: string;
    })[]>;
    create(dto: CreateInventoryLogDto, req: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        barcode: string | null;
        categoryId: string;
        brandId: string;
        purchasePrice: number;
        salePrice: number;
        stock: number;
        lowStockLimit: number;
        warrantyMonths: number;
        imageUrl: string | null;
    }>;
}
