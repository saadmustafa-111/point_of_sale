import { IsString, IsNumber, IsArray, IsOptional, IsDateString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServicePartDto {
  @IsString()
  partName: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsString()
  supplier?: string;
}

class ServiceChargeDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateServiceJobDto {
  @IsString()
  customerId: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsString()
  issue: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  warrantyStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateServiceJobDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  solution?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsString()
  technicianName?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsDateString()
  deliveredDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddServicePartsDto {
  @IsString()
  jobId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePartDto)
  parts: ServicePartDto[];
}

export class AddServiceChargesDto {
  @IsString()
  jobId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceChargeDto)
  charges: ServiceChargeDto[];
}
