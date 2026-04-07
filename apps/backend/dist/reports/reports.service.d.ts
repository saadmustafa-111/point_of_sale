import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    dailySales(date: string): Promise<{
        date: string;
        count: number;
        total: number;
        discount: number;
        itemsSold: number;
        sales: ({
            items: {
                id: string;
                warrantyMonths: number;
                productId: string;
                quantity: number;
                unitPrice: number;
                discount: number;
                serialNumber: string | null;
                total: number;
                saleId: string;
            }[];
            cashier: {
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discount: number;
            customerId: string | null;
            tax: number;
            amountPaid: number;
            paymentMethod: string;
            notes: string | null;
            invoiceNumber: string;
            cashierId: string;
            subtotal: number;
            taxAmount: number;
            total: number;
            changeGiven: number;
        })[];
    }>;
    monthlySales(year: number, month: number): Promise<{
        year: number;
        month: number;
        count: number;
        total: number;
        sales: ({
            cashier: {
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discount: number;
            customerId: string | null;
            tax: number;
            amountPaid: number;
            paymentMethod: string;
            notes: string | null;
            invoiceNumber: string;
            cashierId: string;
            subtotal: number;
            taxAmount: number;
            total: number;
            changeGiven: number;
        })[];
    }>;
    topSellingProducts(limit?: number): Promise<{
        product: {
            name: string;
            id: string;
            sku: string;
        };
        totalQty: number;
        totalRevenue: number;
    }[]>;
    lowStockReport(): Promise<({
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
    cashierWiseSales(startDate?: string, endDate?: string): Promise<any[]>;
}
