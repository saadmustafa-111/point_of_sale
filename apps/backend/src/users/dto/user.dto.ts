import {
  IsString, IsEnum, IsOptional, MinLength, IsBoolean, IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty() @IsString() username: string;
  @ApiProperty() @IsString() fullName: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(6) password?: string;
  @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}
