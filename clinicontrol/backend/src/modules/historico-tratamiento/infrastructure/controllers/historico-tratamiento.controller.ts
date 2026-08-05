import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HistoricoTratamientoService } from '../../application/historico-tratamiento.service';
import { CreateHistoricoTratamientoDto } from '../dto/create-historico-tratamiento.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Histórico de Tratamientos')
@ApiBearerAuth()
@Controller('historico-tratamiento')
@Roles('admin', 'medico')
export class HistoricoTratamientoController {
  constructor(private readonly service: HistoricoTratamientoService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los registros de tratamiento' })
  findAll() {
    return this.service.findAll();
  }

  @Get('paciente/:pacienteId')
  @ApiOperation({ summary: 'Obtener histórico de tratamientos de un paciente' })
  findByPaciente(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.service.findByPaciente(pacienteId);
  }

  @Get('paciente/:pacienteId/activos')
  @ApiOperation({ summary: 'Obtener tratamientos activos de un paciente' })
  findActivos(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.service.findActivos(pacienteId);
  }

  @Get('paciente/:pacienteId/timeline')
  @ApiOperation({ summary: 'Obtener línea de tiempo completa de tratamientos' })
  getTimeline(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.service.getTimeline(pacienteId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear registro de tratamiento' })
  create(@Body() dto: CreateHistoricoTratamientoDto) {
    return this.service.create(dto);
  }

  @Put(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de un tratamiento' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string; motivoCambio?: string },
  ) {
    return this.service.updateEstado(id, body.estado, body.motivoCambio);
  }
}
