import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ReportsRepositoryPort,
  PacienteReportData,
  CitaReportData,
  EstadisticasData,
  DashboardData,
} from '../../domain/ports/reports-repository.port';
import { Paciente } from '../../../../entities/paciente.entity';
import { Cita } from '../../../../entities/cita.entity';
import { Consulta } from '../../../../entities/consulta.entity';
import { Receta } from '../../../../entities/receta-medicamento.entity';
import { Medico } from '../../../../entities/medico.entity';
import { Turno } from '../../../../entities/turno.entity';

@Injectable()
export class ReportsRepositoryAdapter implements ReportsRepositoryPort {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(Medico)
    private readonly medicoRepo: Repository<Medico>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
  ) {}

  async findPacienteConHistorial(
    pacienteId: number,
  ): Promise<PacienteReportData | null> {
    const p = await this.pacienteRepo.findOne({
      where: { id: pacienteId },
      relations: [
        'genero',
        'grupoSanguineo',
        'consultas',
        'consultas.medico',
        'consultas.diagnosticos',
        'consultas.diagnosticos.cie10',
        'consultas.recetas',
        'consultas.recetas.items',
        'consultas.recetas.items.medicamento',
      ],
    });
    if (!p) return null;
    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      ci: p.ci,
      fechaNacimiento: p.fechaNacimiento,
      telefono: p.telefono,
      email: p.email,
      genero: p.genero ? { nombre: p.genero.nombre } : undefined,
      grupoSanguineo: p.grupoSanguineo
        ? { nombre: p.grupoSanguineo.nombre }
        : undefined,
      activo: p.activo,
      createdAt: p.createdAt,
      consultas: (p.consultas || []).map((c) => ({
        fecha: c.fecha,
        medicoNombre: c.medico ? `${c.medico.nombre} ${c.medico.apellido}` : '',
        motivo: c.motivo,
        sintomas: c.sintomas,
        observaciones: c.observaciones,
        diagnosticos: (c.diagnosticos || []).map((d) => ({
          cie10: d.cie10
            ? { codigo: d.cie10.codigo, descripcion: d.cie10.descripcion }
            : undefined,
        })),
        recetas: (c.recetas || []).map((r) => ({
          items: (r.items || []).map((i) => ({
            medicamento: i.medicamento
              ? { nombre: i.medicamento.nombre }
              : undefined,
            dosis: i.dosis,
            frecuencia: i.frecuencia,
          })),
        })),
      })),
    };
  }

  async findCitas(
    fechaInicio?: string,
    fechaFin?: string,
    medicoId?: number,
    estadoId?: number,
  ): Promise<CitaReportData[]> {
    const where: Record<string, unknown> = {};
    if (medicoId) where.medico = { id: medicoId };
    if (estadoId) where.estado = { id: estadoId };
    if (fechaInicio && fechaFin) {
      where.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    }
    return this.citaRepo.find({
      where: where as any,
      relations: ['paciente', 'medico', 'medico.especialidad', 'estado'],
      order: { fecha: 'ASC' },
    });
  }

  async getEstadisticas(): Promise<EstadisticasData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPacientes,
      totalMedicos,
      totalCitas,
      totalConsultas,
      citasHoy,
      recetasActivas,
    ] = await Promise.all([
      this.pacienteRepo.count({ where: { activo: true } }),
      this.medicoRepo.count(),
      this.citaRepo.count(),
      this.consultaRepo.count(),
      this.citaRepo.count({
        where: { fecha: Between(today, tomorrow) } as any,
      }),
      this.recetaRepo.count({ where: { estado: 'activa' } }),
    ]);

    return {
      totalPacientes,
      totalMedicos,
      totalCitas,
      totalConsultas,
      citasHoy,
      recetasActivas,
    };
  }

  async getDashboard(): Promise<DashboardData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPacientes,
      totalMedicos,
      totalCitas,
      totalConsultas,
      citasHoy,
      recetasActivas,
      citasPendientes,
      turnosHoy,
      pacientesHoy,
    ] = await Promise.all([
      this.pacienteRepo.count({ where: { activo: true } }),
      this.medicoRepo.count(),
      this.citaRepo.count(),
      this.consultaRepo.count(),
      this.citaRepo.count({
        where: { fecha: Between(today, tomorrow) } as any,
      }),
      this.recetaRepo.count({ where: { estado: 'activa' } }),
      this.citaRepo.count({ where: { estadoId: 1 } }),
      this.turnoRepo
        .createQueryBuilder('t')
        .where('t.createdAt >= :today', { today })
        .andWhere('t.createdAt < :tomorrow', { tomorrow })
        .getCount(),
      this.pacienteRepo.count({
        where: { createdAt: Between(today, tomorrow) } as any,
      }),
    ]);

    return {
      totalPacientes,
      totalMedicos,
      totalCitas,
      totalConsultas,
      citasPendientes,
      turnosHoy,
      citasHoy,
      pacientesHoy,
      recetasActivas,
    };
  }

  async findAllPacientes(): Promise<PacienteReportData[]> {
    const pacientes = await this.pacienteRepo.find({
      relations: ['genero', 'grupoSanguineo'],
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
    return pacientes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      ci: p.ci,
      fechaNacimiento: p.fechaNacimiento,
      telefono: p.telefono,
      email: p.email,
      genero: p.genero ? { nombre: p.genero.nombre } : undefined,
      grupoSanguineo: p.grupoSanguineo
        ? { nombre: p.grupoSanguineo.nombre }
        : undefined,
      activo: p.activo,
      createdAt: p.createdAt,
      consultas: [],
    }));
  }
}
