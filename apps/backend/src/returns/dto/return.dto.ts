import { IsString, IsNumber, IsArray, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReturnItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsString()
  reason: string;

  @IsString()
  condition: string; // DEFECTIVE, UNOPENED, OPENED, DAMAGED

  @IsNumber()
  @Min(0)
  refundAmount: number;
}

export class CreateReturnDto {
  @IsString()
  originalSaleId: string;

  @IsString()
  type: string; // RETURN, EXCHANGE

  @IsString()
  reason: string;

  @IsNumber()
  @Min(0)
  refundAmount: number;

  @IsNumber()
  @Min(0)
  restockingFee: number;

  @IsString()
  processedBy: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}

export class UpdateReturnDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
