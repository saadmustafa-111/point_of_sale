import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

class UpsertSettingDto { @IsString() value: string; }

class SettingEntryDto {
  @IsString() key: string;
  @IsString() value: string;
}

class BulkUpsertDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingEntryDto)
  entries: SettingEntryDto[];
}

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()                 all()                                      { return this.service.getAll(); }
  @Get(':key')           one(@Param('key') key: string)             { return this.service.get(key); }
  @Put(':key')           set(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.service.upsert(key, dto.value);
  }
  @Put()                 bulk(@Body() dto: BulkUpsertDto)           { return this.service.upsertMany(dto.entries); }
}
