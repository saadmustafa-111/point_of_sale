import {
  IsString, IsOptional, IsNumber, IsBoolean,
  IsInt, Min, IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty()              @IsString()                name: string;
  @ApiProperty()              @IsString()                sku: string;
  @ApiPropertyOptional()      @IsOptional() @IsString()  barcode?: string;
  @ApiProperty()              @IsString()                categoryId: string;
  @ApiProperty()              @IsString()                brandId: string;
  @ApiProperty()              @Type(() => Number) @IsNumber() @IsPositive() purchasePrice: number;
  @ApiProperty()              @Type(() => Number) @IsNumber() @IsPositive() salePrice: number;
  @ApiProperty()              @Type(() => Number) @IsInt() @Min(0)          stock: number;
  @ApiPropertyOptional()      @Type(() => Number) @IsOptional() @IsInt() @Min(0) lowStockLimit?: number;
  @ApiPropertyOptional()      @Type(() => Number) @IsOptional() @IsInt() @Min(0) warrantyMonths?: number;
  @ApiPropertyOptional()      @IsOptional() @IsString()  imageUrl?: string;
  @ApiPropertyOptional()      @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional()      @IsOptional() @IsString()  description?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  brandId?: string;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @IsPositive() purchasePrice?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsNumber() @IsPositive() salePrice?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsInt() @Min(0) lowStockLimit?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsOptional() @IsInt() @Min(0) warrantyMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsString()  imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString()  description?: string;
}
