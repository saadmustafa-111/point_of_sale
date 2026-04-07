import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
export declare class SalesController {
    private service;
    constructor(service: SalesService);
    all(req: any): Promise<({
        customer: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
        };
        items: ({
            product: {
                category: {
                    name: string;
                };
                brand: {
                    name: string;
                };
                name: string;
                id: string;
                sku: string;
                barcode: string;
                warrantyMonths: number;
            };
        } & {
            id: string;
            warrantyMonths: number;
            productId: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            serialNumber: string | null;
            total: number;
            saleId: string;
        })[];
        cashier: {
            username: string;
            id: string;
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
    })[]>;
    one(id: string, req: any): Promise<{
        customer: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
        };
        items: ({
            product: {
                category: {
                    name: string;
                };
                brand: {
                    name: string;
                };
                name: string;
                id: string;
                sku: string;
                barcode: string;
                warrantyMonths: number;
            };
        } & {
            id: string;
            warrantyMonths: number;
            productId: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            serialNumber: string | null;
            total: number;
            saleId: string;
        })[];
        cashier: {
            username: string;
            id: string;
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
    }>;
    create(dto: CreateSaleDto, req: any): Promise<{
        customer: {
            name: string;
            id: string;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
        };
        items: ({
            product: {
                category: {
                    name: string;
                };
                brand: {
                    name: string;
                };
                name: string;
                id: string;
                sku: string;
                barcode: string;
                warrantyMonths: number;
            };
        } & {
            id: string;
            warrantyMonths: number;
            productId: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            serialNumber: string | null;
            total: number;
            saleId: string;
        })[];
        cashier: {
            username: string;
            id: string;
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
    }>;
    deleteAll(): Promise<void>;
}
