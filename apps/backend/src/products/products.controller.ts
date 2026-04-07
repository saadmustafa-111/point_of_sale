import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @ApiQuery({ name: 'search', required: false })
  @Get()          all(@Query('search') search?: string)    { return this.service.findAll(search); }
  @Get('low-stock') lowStock()                             { return this.service.getLowStock(); }
  @Get('barcode/:code') byBarcode(@Param('code') c: string){ return this.service.findByBarcode(c); }
  @Get(':id')     one(@Param('id') id: string)             { return this.service.findOne(id); }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Post()         create(@Body() dto: CreateProductDto)    { return this.service.create(dto); }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Put(':id')     update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Delete(':id')  remove(@Param('id') id: string)          { return this.service.remove(id); }
}
