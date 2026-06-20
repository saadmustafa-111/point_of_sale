import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirstAdminDto {
  @ApiProperty({ example: 'Home Appliances POS' })
  @IsString()
  @MinLength(2)
  posName: string;

  @ApiProperty({ example: 'Al-Noor Home Appliances' })
  @IsString()
  @MinLength(2)
  shopName: string;

  @ApiProperty({ example: 'Owner Name' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'strong-password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'owner@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+92-300-0000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
