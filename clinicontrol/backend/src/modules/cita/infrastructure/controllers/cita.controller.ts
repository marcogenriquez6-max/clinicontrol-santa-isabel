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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CitaService } from '../../application/cita.service';
import {
  CreateCitaDto,
  UpdateCitaDto,
  CitaQueryDto,
} from '../dto/create-cita.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Ownership } from '../../../../common/decorators/ownership.decorator';
import { OwnershipGuard } from '../../../../common/guards/ownership.guard';

@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
@Roles('admin', 'medico', 'recepcionista', 'secretaria')
export class CitaController {
  constructor(private readonly citaService: CitaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar citas con filtros' })
  @ApiQuery({ name: 'pacienteId', required: false })
  @ApiQuery({ name: 'medicoId', required: false })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: CitaQueryDto) {
    return this.citaService.findAll(query);
  }

  @Get('medico/:medicoId/disponibilidad')
  @ApiOperation({ summary: 'Ver disponibilidad de medico por fecha' })
  getDisponibilidad(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string,
  ) {
    return this.citaService.getDisponibilidad(medicoId, new Date(fecha));
  }

  @Get(':id')
  @Ownership('appointment')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Obtener cita por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citaService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva cita' })
  @ApiResponse({ status: 201, description: 'Cita creada' })
  @ApiResponse({ status: 409, description: 'Horario no disponible' })
  create(
    @Body(ValidationPipe) dto: CreateCitaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.citaService.create(dto, user.id);
  }

  @Put(':id')
  @Ownership('appointment')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Actualizar cita' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateCitaDto,
  ) {
    return this.citaService.update(id, dto);
  }

  @Put(':id/cancelar')
  @Ownership('appointment')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Cancelar cita' })
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @CurrentUser() user: { id: number },
  ) {
    return this.citaService.cancelar(id, motivo, user.id);
  }

  @Post(':id/llegada')
  @Ownership('appointment')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Registrar llegada a cita' })
  @ApiResponse({ status: 201, description: 'Llegada registrada y turno emitido' })
  @ApiResponse({ status: 409, description: 'La cita ya tiene turno o no puede ser atendida' })
  async llegada(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.citaService.llegada(id, user.id);
  }

  @Delete(':id')
  @Ownership('appointment')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Eliminar cita' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.citaService.remove(id);
  }
}
