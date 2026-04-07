import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()         all()                              { return this.usersService.findAll(); }
  @Get(':id')    one(@Param('id') id: string)       { return this.usersService.findOne(id); }
  @Post()        create(@Body() dto: CreateUserDto) { return this.usersService.create(dto); }
  @Put(':id')    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string)   { return this.usersService.remove(id); }
}
