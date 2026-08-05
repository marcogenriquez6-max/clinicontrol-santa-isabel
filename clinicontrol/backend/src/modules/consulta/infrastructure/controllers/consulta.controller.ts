import {
  Controller,
  Get,
  Post,
  Put,
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
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Ownership } from '../../../../common/decorators/ownership.decorator';
import { OwnershipGuard } from '../../../../common/guards/ownership.guard';
import { ConsultaService } from '../../application/consulta.service';
import {
  CreateConsultaDto,
  UpdateConsultaDto,
} from '../dto/create-consulta.dto';
import { CreateConsultaCompletaDto } from '../dto/create-consulta-completa.dto';

@ApiTags('Consultas Médicas')
@ApiBearerAuth()
@Controller('consultas')
@Roles('admin', 'medico', 'enfermeria')
export class ConsultaController {
  constructor(private readonly consultaService: ConsultaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar consultas con filtros' })
  @ApiQuery({ name: 'pacienteId', required: false })
  @ApiQuery({ name: 'medicoId', required: false })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('medicoId') medicoId?: string,
    @Query('fecha') fecha?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.consultaService.findAll({
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      medicoId: medicoId ? Number(medicoId) : undefined,
      fecha: fecha ? new Date(fecha) : undefined,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('paciente/:pacienteId/timeline')
  @Ownership('patient')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Timeline clínico completo del paciente' })
  getTimeline(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.consultaService.getPacienteTimeline(pacienteId);
  }

  @Get('paciente/:pacienteId/historial')
  @Ownership('patient')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Historial clínico completo del paciente' })
  getHistorial(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.consultaService.getHistorialCompleto(pacienteId);
  }

  @Get(':id')
  @Ownership('consultation')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Obtener consulta por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultaService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva consulta médica' })
  @ApiResponse({ status: 201, description: 'Consulta creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @Body(ValidationPipe) dto: CreateConsultaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.consultaService.create(dto, user.id);
  }

  @Put(':id')
  @Ownership('consultation')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Actualizar consulta' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateConsultaDto,
  ) {
    return this.consultaService.update(id, dto);
  }

  @Post('completa')
  @ApiOperation({
    summary: 'Crear consulta completa con diagnósticos SOAP y recetas',
  })
  @ApiResponse({ status: 201, description: 'Consulta completa creada' })
  @ApiResponse({ status: 400, description: 'Error de validación clínica' })
  createCompleta(
    @Body(ValidationPipe) dto: CreateConsultaCompletaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.consultaService.createConsultaCompleta({
      pacienteId: dto.pacienteId,
      medicoId: user.id,
      citaId: dto.citaId,
      motivoConsulta: dto.motivoConsulta,
      sintomas: dto.sintomas,
      enfermedadActual: dto.enfermedadActual,
      examenFisico: dto.examenFisico,
      peso: dto.peso,
      talla: dto.talla,
      temperatura: dto.temperatura,
      frecuenciaCardiaca: dto.frecuenciaCardiaca,
      frecuenciaRespiratoria: dto.frecuenciaRespiratoria,
      presionArterialSistolica: dto.presionArterialSistolica,
      presionArterialDiastolica: dto.presionArterialDiastolica,
      saturacionOxigeno: dto.saturacionOxigeno,
      glucosaCapilar: dto.glucosaCapilar,
      evaluacion: dto.evaluacion,
      planTratamiento: dto.planTratamiento,
      indicaciones: dto.indicaciones,
      diagnosticos: dto.diagnosticos.map((d) => ({
        cie10Id: d.cie10Id,
        descripcion: d.descripcion,
        tipo: d.tipo,
        esCronico: d.esCronico ?? false,
      })),
      recetas: dto.recetas?.map((r) => ({
        medicamentoId: r.medicamentoId,
        dosis: r.dosis,
        frecuencia: r.frecuencia,
        duracion: r.duracion,
        cantidad: r.cantidad,
        observaciones: r.observaciones,
      })),
      esContinuacion: dto.esContinuacion,
      consultaOriginalId: dto.consultaOriginalId,
      motivoContinuacion: dto.motivoContinuacion,
    });
  }

  @Post(':id/continuar')
  @Ownership('consultation')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Continuar consulta (continuidad de cuidado)' })
  @ApiResponse({ status: 201, description: 'Consulta continuada creada' })
  continuar(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: CreateConsultaCompletaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.consultaService.continuarConsulta(id, user.id, {
      motivoConsulta: dto.motivoConsulta,
      sintomas: dto.sintomas,
      enfermedadActual: dto.enfermedadActual,
      examenFisico: dto.examenFisico,
      evaluacion: dto.evaluacion,
      planTratamiento: dto.planTratamiento,
      indicaciones: dto.indicaciones,
      peso: dto.peso,
      talla: dto.talla,
      temperatura: dto.temperatura,
      frecuenciaCardiaca: dto.frecuenciaCardiaca,
      frecuenciaRespiratoria: dto.frecuenciaRespiratoria,
      presionArterialSistolica: dto.presionArterialSistolica,
      presionArterialDiastolica: dto.presionArterialDiastolica,
      saturacionOxigeno: dto.saturacionOxigeno,
      glucosaCapilar: dto.glucosaCapilar,
      diagnosticos: dto.diagnosticos.map((d) => ({
        cie10Id: d.cie10Id,
        descripcion: d.descripcion,
        tipo: d.tipo,
        esCronico: d.esCronico ?? false,
      })),
      recetas: dto.recetas?.map((r) => ({
        medicamentoId: r.medicamentoId,
        dosis: r.dosis,
        frecuencia: r.frecuencia,
        duracion: r.duracion,
        cantidad: r.cantidad,
        observaciones: r.observaciones,
      })),
      motivoContinuacion: dto.motivoContinuacion,
    });
  }
}
