import { PaymentMethod } from '../../common/enums';
export declare class SaleItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    serialNumber?: string;
    warrantyMonths?: number;
}
export declare class CreateSaleDto {
    customerId?: string;
    items: SaleItemDto[];
    discount?: number;
    tax?: number;
    amountPaid?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
}
