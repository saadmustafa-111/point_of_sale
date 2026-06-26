import { Controller, Get, Post, Delete, Query, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/expense.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  findAll(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('category') category?: string) {
    return this.service.findAll(startDate, endDate, category);
  }

  @Get('summary')
  summary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.service.summary(startDate, endDate);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
