import {
  IsString, IsOptional, IsNumber, IsArray,
  IsDateString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Purchase Order ──────────────────────────────────────────────────────────

class PurchaseOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class ReceiveOrderDto {
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsArray()
  receivedItems?: { itemId: string; receivedQty: number }[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Supplier Payment ────────────────────────────────────────────────────────

export class CreateSupplierPaymentDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // CASH, CHEQUE, BANK_TRANSFER, ONLINE

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  recordedBy?: string;
}
