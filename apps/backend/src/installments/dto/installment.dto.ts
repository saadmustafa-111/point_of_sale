import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateInstallmentPlanDto {
  @IsString()
  saleId: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  downPayment: number;

  @IsNumber()
  @Min(0)
  monthlyAmount: number;

  @IsNumber()
  @Min(1)
  installments: number;

  @IsDateString()
  startDate: string;
}

export class RecordInstallmentPaymentDto {
  @IsString()
  planId: string;

  @IsNumber()
  installmentNo: number;

  @IsNumber()
  @Min(0)
  paidAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInstallmentPlanDto {
  @IsOptional()
  @IsString()
  status?: string;
}
