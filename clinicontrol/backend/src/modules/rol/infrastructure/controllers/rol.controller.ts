import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RolService } from '../../application/rol.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateRolDto, UpdateRolDto } from '../dto/create-rol.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@Roles('admin')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  findAll() {
    return this.rolService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  create(@Body() dto: CreateRolDto) {
    return this.rolService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolDto) {
    return this.rolService.update(id, dto);
  }
}
