import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, UpdateReturnDto } from './dto/return.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CASHIER)
  create(@Body() dto: CreateReturnDto) {
    return this.returnsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CASHIER)
  getAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.returnsService.getAll(status, type);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CASHIER)
  getReturn(@Param('id') id: string) {
    return this.returnsService.getReturn(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateReturnDto) {
    return this.returnsService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.returnsService.approve(id, approvedBy);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  reject(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @Body('notes') notes?: string,
  ) {
    return this.returnsService.reject(id, approvedBy, notes);
  }

  @Post(':id/complete')
  @Roles(Role.ADMIN, Role.CASHIER)
  complete(@Param('id') id: string) {
    return this.returnsService.complete(id);
  }
}
