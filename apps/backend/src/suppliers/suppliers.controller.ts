import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  getAll(@Query('search') search?: string) {
    return this.suppliersService.getAll(search);
  }

  @Get('summary')
  @Roles(Role.ADMIN)
  getSummary() {
    return this.suppliersService.getSummary();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  getOne(@Param('id') id: string) {
    return this.suppliersService.getOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }
}
