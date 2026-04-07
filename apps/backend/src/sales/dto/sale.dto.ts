import { Type } from 'class-transformer';
import {
  IsString, IsOptional, IsNumber, IsArray, ValidateNested,
  IsEnum, IsPositive, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../common/enums';

export class SaleItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @IsPositive() unitPrice: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @Min(0) discount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsInt() @Min(0) warrantyMonths?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiProperty({ type: [SaleItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SaleItemDto) items: SaleItemDto[];
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @Min(0) discount?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @Min(0) tax?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @Min(0) amountPaid?: number;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
