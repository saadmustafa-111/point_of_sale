import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get()
  all(@Query('productId') productId?: string) { return this.service.findAll(productId); }

  @Post()
  create(@Body() dto: CreateInventoryLogDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }
}
