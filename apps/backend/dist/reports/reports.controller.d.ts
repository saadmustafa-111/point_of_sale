import { ReportsService } from './reports.service';
export declare class ReportsController {
    private service;
    constructor(service: ReportsService);
    daily(date: string): Promise<{
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
    monthly(year: string, month: string): Promise<{
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
    topProducts(limit?: string): Promise<{
        product: {
            name: string;
            id: string;
            sku: string;
        };
        totalQty: number;
        totalRevenue: number;
    }[]>;
    lowStock(): Promise<({
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
    cashierSales(s?: string, e?: string): Promise<any[]>;
}
