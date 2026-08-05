import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { MedicoService } from '../../application/medico.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateMedicoDto, UpdateMedicoDto } from '../dto/create-medico.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Médicos')
@ApiBearerAuth()
@Controller('medicos')
@Roles('admin', 'recepcionista', 'secretaria')
export class MedicoController {
  constructor(private readonly medicoService: MedicoService) {}

  @Get()
  @Roles('admin', 'recepcionista', 'secretaria', 'medico', 'enfermeria')
  @ApiOperation({ summary: 'Obtener todos los médicos' })
  findAll() {
    return this.medicoService.findAll();
  }

  @Get('especialidad/:especialidadId')
  @Roles('admin', 'recepcionista', 'secretaria', 'medico', 'enfermeria')
  @ApiOperation({ summary: 'Obtener médicos por especialidad' })
  findByEspecialidad(
    @Param('especialidadId', ParseIntPipe) especialidadId: number,
  ) {
    return this.medicoService.findByEspecialidad(especialidadId);
  }

  @Get(':id')
  @Roles('admin', 'recepcionista', 'secretaria', 'medico', 'enfermeria')
  @ApiOperation({ summary: 'Obtener médico por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo médico' })
  create(@Body(ValidationPipe) dto: CreateMedicoDto) {
    return this.medicoService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar médico' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateMedicoDto,
  ) {
    return this.medicoService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar médico' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.medicoService.delete(id);
  }
}
