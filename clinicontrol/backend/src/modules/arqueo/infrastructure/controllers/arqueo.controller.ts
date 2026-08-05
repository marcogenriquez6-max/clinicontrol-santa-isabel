import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ArqueoService } from '../../application/arqueo.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateArqueoDto } from '../dto/create-arqueo.dto';

@ApiTags('Arqueo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('arqueo')
export class ArqueoController {
  constructor(private readonly arqueoService: ArqueoService) {}

  @Get()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Listar arqueos de caja' })
  findAll() {
    return this.arqueoService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener arqueo por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.arqueoService.findOne(id);
  }

  @Post()
  @Roles('admin', 'recepcionista', 'secretaria')
  @ApiOperation({ summary: 'Crear arqueo de caja' })
  crear(@Body(ValidationPipe) dto: CreateArqueoDto) {
    return this.arqueoService.crear(dto);
  }
}
