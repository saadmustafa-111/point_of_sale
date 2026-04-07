import { IsString, IsEnum, IsInt, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryType } from '../../common/enums';

export class CreateInventoryLogDto {
  @ApiProperty()              @IsString()                   productId: string;
  @ApiProperty({ enum: InventoryType }) @IsEnum(InventoryType) type: InventoryType;
  @ApiProperty()   @Type(() => Number) @IsInt() @IsPositive() quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString()          reason?: string;
}
