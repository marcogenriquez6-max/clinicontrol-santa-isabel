import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TurnoService } from '../../application/turno.service';
import {
  CreateTurnoDto,
  UpdateTurnoEstadoDto,
  TurnoQueryDto,
} from '../dto/create-turno.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Turnos')
@ApiBearerAuth()
@Controller('turnos')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  @Get()
  @Roles('admin', 'medico', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Listar turnos con filtros' })
  findAll(@Query() query: TurnoQueryDto) {
    return this.turnoService.findAll(query);
  }

  @Get('tv')
  @Roles('admin', 'medico', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Obtener turnos activos para pantalla TV' })
  getTV() {
    return this.turnoService.getTV();
  }

  @Get(':id')
  @Roles('admin', 'medico', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Obtener turno por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.turnoService.findOne(id);
  }

  @Post()
  @Roles('admin', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Crear nuevo turno' })
  @ApiResponse({ status: 201, description: 'Turno creado' })
  create(@Body(ValidationPipe) dto: CreateTurnoDto) {
    return this.turnoService.create(dto);
  }

  @Put(':id/estado')
  @Roles('admin', 'medico', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Actualizar estado de turno' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateTurnoEstadoDto,
  ) {
    return this.turnoService.updateEstado(id, dto.estado);
  }

  @Put(':id/pagar')
  @Roles('admin', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Marcar turno como pagado' })
  marcarPagado(@Param('id', ParseIntPipe) id: number) {
    return this.turnoService.marcarPagado(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar turno' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.turnoService.remove(id);
  }
}
