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
  ApiQuery,
} from '@nestjs/swagger';
import { HospitalizacionService } from '../../application/hospitalizacion.service';
import {
  CreateHospitalizacionDto,
  UpdateHospitalizacionDto,
  DarAltaDto,
  CreateCamaDto,
  UpdateCamaDto,
  CreateNotaEvolucionDto,
  HospitalizacionQueryDto,
} from '../dto/create-hospitalizacion.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@ApiTags('Hospitalización')
@ApiBearerAuth()
@Controller('hospitalizacion')
@Roles('admin', 'medico', 'enfermeria')
export class HospitalizacionController {
  constructor(private readonly hospService: HospitalizacionService) {}

  @Post()
  @ApiOperation({ summary: 'Admitir paciente (hospitalización)' })
  @ApiResponse({ status: 201, description: 'Hospitalización creada' })
  create(
    @Body(ValidationPipe) dto: CreateHospitalizacionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.hospService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar hospitalizaciones' })
  findAll(@Query(ValidationPipe) query: HospitalizacionQueryDto) {
    return this.hospService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de ocupación' })
  getStats() {
    return this.hospService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener hospitalización por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hospService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar hospitalización' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateHospitalizacionDto,
  ) {
    return this.hospService.update(id, dto);
  }

  @Post(':id/alta')
  @ApiOperation({ summary: 'Dar de alta al paciente' })
  darAlta(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: DarAltaDto,
  ) {
    return this.hospService.darAlta(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar hospitalización' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hospService.remove(id);
  }

  @Post(':id/notas')
  @ApiOperation({ summary: 'Agregar nota de evolución' })
  createNota(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: CreateNotaEvolucionDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.hospService.createNotaEvolucion(id, dto, user.id);
  }

  @Get(':id/notas')
  @ApiOperation({ summary: 'Obtener notas de evolución' })
  findNotas(@Param('id', ParseIntPipe) id: number) {
    return this.hospService.findNotasEvolucion(id);
  }
}

@ApiTags('Camas')
@ApiBearerAuth()
@Controller('camas')
@Roles('admin', 'medico', 'enfermeria', 'recepcionista', 'secretaria')
export class CamaController {
  constructor(private readonly hospService: HospitalizacionService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear nueva cama' })
  create(@Body(ValidationPipe) dto: CreateCamaDto) {
    return this.hospService.createCama(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar camas' })
  @ApiQuery({ name: 'servicio', required: false })
  findAll(@Query('servicio') servicio?: string) {
    return this.hospService.findAllCamas(servicio);
  }

  @Get('disponibles')
  @ApiOperation({ summary: 'Camas disponibles' })
  @ApiQuery({ name: 'servicio', required: false })
  getDisponibles(@Query('servicio') servicio?: string) {
    return this.hospService.getCamasDisponibles(servicio);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cama por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hospService.findCama(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar cama' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateCamaDto,
  ) {
    return this.hospService.updateCama(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar cama' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.hospService.removeCama(id);
  }
}
