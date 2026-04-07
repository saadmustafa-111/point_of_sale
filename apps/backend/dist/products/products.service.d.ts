import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(search?: string): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    findByBarcode(barcode: string): Promise<{
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    create(dto: CreateProductDto): Promise<{
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    remove(id: string): Promise<{
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
    getLowStock(): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
        brand: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    })[]>;
}
