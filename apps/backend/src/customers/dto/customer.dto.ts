import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty()         @IsString()                 name: string;
  @ApiPropertyOptional() @IsOptional() @IsString()   phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail()    email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()   address?: string;
}
export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail()   email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  address?: string;
}
