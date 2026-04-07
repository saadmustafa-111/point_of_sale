import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomersController {
    private service;
    constructor(service: CustomersService);
    all(s?: string): import(".prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
    }[]>;
    one(id: string): Promise<{
        sales: {
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
        }[];
    } & {
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
    }>;
    create(dto: CreateCustomerDto): import(".prisma/client").Prisma.Prisma__CustomerClient<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
    }>;
}
