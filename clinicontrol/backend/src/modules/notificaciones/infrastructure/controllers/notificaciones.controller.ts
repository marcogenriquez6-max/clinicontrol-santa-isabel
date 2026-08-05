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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from '../../application/notificaciones.service';
import {
  CreateNotificacionDto,
  CreateNotificacionMasivaDto,
  UpdatePreferenciasDto,
  NotificacionQueryDto,
} from '../dto/create-notificacion.dto';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post()
  @Roles('admin', 'medico', 'enfermeria', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Crear notificación para un usuario' })
  create(@Body(ValidationPipe) dto: CreateNotificacionDto) {
    return this.notificacionesService.create(dto);
  }

  @Post('masiva')
  @Roles('admin')
  @ApiOperation({ summary: 'Enviar notificación masiva' })
  createMasiva(
    @Body(ValidationPipe) dto: CreateNotificacionMasivaDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.notificacionesService.createMasiva(dto, user.id);
  }

  @Get('mis-notificaciones')
  @ApiOperation({ summary: 'Mis notificaciones' })
  findMine(
    @CurrentUser() user: { id: number },
    @Query(ValidationPipe) query: NotificacionQueryDto,
  ) {
    return this.notificacionesService.findByUser(user.id, query);
  }

  @Get('no-leidas')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas' })
  getNonReadCount(@CurrentUser() user: { id: number }) {
    return this.notificacionesService.getNonReadCount(user.id);
  }

  @Put(':id/leer')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.notificacionesService.marcarLeida(id, user.id);
  }

  @Put('leer-todas')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  marcarTodasLeidas(@CurrentUser() user: { id: number }) {
    return this.notificacionesService.marcarTodasLeidas(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.notificacionesService.remove(id, user.id);
  }

  @Get('preferencias')
  @ApiOperation({ summary: 'Obtener preferencias de notificación' })
  getPreferencias(@CurrentUser() user: { id: number }) {
    return this.notificacionesService.getPreferencias(user.id);
  }

  @Put('preferencias')
  @ApiOperation({ summary: 'Actualizar preferencias de notificación' })
  updatePreferencias(
    @CurrentUser() user: { id: number },
    @Body(ValidationPipe) dto: UpdatePreferenciasDto,
  ) {
    return this.notificacionesService.updatePreferencias(user.id, dto);
  }
}
