import { Controller, Get, Post, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private service: SalesService) {}

  @Get()
  all(@Request() req) { return this.service.findAll(req.user.id, req.user.role); }

  @Get(':id')
  one(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Delete()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteAll() { return this.service.deleteAll(); }
}
