import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}
  @Get()      all(@Query('search') s?: string)    { return this.service.findAll(s); }
  @Get(':id') one(@Param('id') id: string)        { return this.service.findOne(id); }
  @Post()     create(@Body() dto: CreateCustomerDto) { return this.service.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
