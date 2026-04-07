import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()         all()                                { return this.service.findAll(); }
  @Get(':id')    one(@Param('id') id: string)         { return this.service.findOne(id); }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Post()        create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Put(':id')    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN) @UseGuards(RolesGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
