import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ConsultaRepositoryPort,
  ConsultaQuery,
} from '../domain/ports/consulta-repository.port';
import {
  ConsultaDomain,
  SignosVitales,
  DiagnosticoEntry,
} from '../domain/consulta.domain';
import { ConsultaDomainService } from '../domain/services/consulta-domain.service';

export interface CreateConsultaCompletaInput {
  pacienteId: number;
  medicoId: number;
  citaId?: number;
  motivoConsulta?: string;
  sintomas?: string;
  enfermedadActual?: string;
  examenFisico?: string;
  peso?: number;
  talla?: number;
  temperatura?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  presionArterialSistolica?: number;
  presionArterialDiastolica?: number;
  saturacionOxigeno?: number;
  glucosaCapilar?: number;
  evaluacion?: string;
  planTratamiento?: string;
  indicaciones?: string;
  diagnosticos: DiagnosticoEntry[];
  recetas?: RecetaInput[];
  esContinuacion?: boolean;
  consultaOriginalId?: number;
  motivoContinuacion?: string;
}

export interface RecetaInput {
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracion?: string;
  cantidad: number;
  observaciones?: string;
}

@Injectable()
export class ConsultaService {
  private readonly logger = new Logger(ConsultaService.name);

  constructor(
    private readonly consultaRepository: ConsultaRepositoryPort,
    private readonly domainService: ConsultaDomainService,
  ) {}

  async findAll(query: ConsultaQuery) {
    return this.consultaRepository.findAll(query);
  }

  async findOne(id: number): Promise<ConsultaDomain> {
    const consulta = await this.consultaRepository.findByIdWithRelations(id, [
      'paciente',
      'medico',
      'medico.especialidad',
      'diagnosticos',
      'diagnosticos.cie10',
      'recetas',
      'recetas.items',
      'recetas.items.medicamento',
      'examenes',
    ]);
    if (!consulta)
      throw new NotFoundException(`Consulta con ID ${id} no encontrada`);
    return consulta;
  }

  async create(
    dto: {
      pacienteId: number;
      medicoId: number;
      motivo: string;
      sintomas: string;
    },
    medicoId: number,
  ): Promise<ConsultaDomain> {
    const errores = this.domainService.validarConsulta(
      dto.motivo,
      dto.sintomas,
      dto.pacienteId,
      dto.medicoId,
    );
    if (errores.length > 0) throw new BadRequestException(errores.join('; '));

    const consulta = new ConsultaDomain({
      pacienteId: dto.pacienteId,
      medicoId: dto.medicoId,
      motivo: dto.motivo,
      sintomas: dto.sintomas,
    });

    return this.consultaRepository.save(consulta);
  }

  async createConsultaCompleta(
    dto: CreateConsultaCompletaInput,
  ): Promise<ConsultaDomain> {
    const errores: string[] = [];

    errores.push(
      ...this.domainService.validarConsulta(
        dto.motivoConsulta || '',
        dto.sintomas || '',
        dto.pacienteId,
        dto.medicoId,
      ),
    );

    const signos: SignosVitales = {
      presionArterialSistolica: dto.presionArterialSistolica,
      presionArterialDiastolica: dto.presionArterialDiastolica,
      frecuenciaCardiaca: dto.frecuenciaCardiaca,
      frecuenciaRespiratoria: dto.frecuenciaRespiratoria,
      temperatura: dto.temperatura,
      saturacionOxigeno: dto.saturacionOxigeno,
      glucosaCapilar: dto.glucosaCapilar,
      peso: dto.peso,
      talla: dto.talla,
    };
    errores.push(...this.domainService.validarSignosVitales(signos));

    if (dto.diagnosticos?.length) {
      for (const diag of dto.diagnosticos) {
        errores.push(
          ...this.domainService.validarDiagnostico(diag.descripcion, diag.tipo),
        );
      }
    }

    if (dto.esContinuacion) {
      errores.push(
        ...this.domainService.validarContinuacion(
          dto.consultaOriginalId,
          dto.motivoContinuacion,
        ),
      );
    }

    if (errores.length > 0) throw new BadRequestException(errores.join('; '));

    const consulta = new ConsultaDomain({
      pacienteId: dto.pacienteId,
      medicoId: dto.medicoId,
      citaId: dto.citaId,
      motivo: dto.motivoConsulta || '',
      sintomas: dto.sintomas || '',
    });

    consulta.enfermedadActual = dto.enfermedadActual;
    consulta.examenFisico = dto.examenFisico;
    consulta.agregarSignosVitales(signos);
    consulta.agregarEvaluacion(
      dto.evaluacion || '',
      dto.planTratamiento || '',
      dto.indicaciones || '',
    );

    if (dto.diagnosticos) {
      for (const diag of dto.diagnosticos) {
        consulta.agregarDiagnostico(diag);
      }
    }

    if (dto.esContinuacion && dto.consultaOriginalId) {
      consulta.marcarComoContinuacion(
        dto.consultaOriginalId,
        dto.motivoContinuacion || '',
      );
    }

    const alertas = this.domainService.detectarSignosAlarma(signos);
    if (alertas.length > 0) {
      this.logger.warn(
        `[ALERTAS CLÍNICAS] Consulta paciente ${dto.pacienteId}: ${alertas.join(' | ')}`,
      );
    }

    const saved = await this.consultaRepository.save(consulta);

    return saved;
  }

  async continuarConsulta(
    consultaOriginalId: number,
    medicoId: number,
    dto: Partial<CreateConsultaCompletaInput>,
  ): Promise<ConsultaDomain> {
    const original = await this.consultaRepository.findById(consultaOriginalId);
    if (!original)
      throw new NotFoundException(
        `Consulta original ${consultaOriginalId} no encontrada`,
      );

    const errores = this.domainService.validarContinuacion(
      consultaOriginalId,
      dto.motivoContinuacion,
    );
    if (errores.length > 0) throw new BadRequestException(errores.join('; '));

    const consulta = new ConsultaDomain({
      pacienteId: original.pacienteId,
      medicoId,
      motivo: dto.motivoConsulta || original.motivo,
      sintomas: dto.sintomas || original.sintomas,
    });

    consulta.enfermedadActual = dto.enfermedadActual;
    consulta.examenFisico = dto.examenFisico || original.examenFisico;
    consulta.agregarEvaluacion(
      dto.evaluacion || '',
      dto.planTratamiento || '',
      dto.indicaciones || '',
    );
    consulta.marcarComoContinuacion(
      consultaOriginalId,
      dto.motivoContinuacion || '',
    );

    if (dto.peso || dto.talla || dto.temperatura || dto.frecuenciaCardiaca) {
      consulta.agregarSignosVitales({
        presionArterialSistolica: dto.presionArterialSistolica,
        presionArterialDiastolica: dto.presionArterialDiastolica,
        frecuenciaCardiaca: dto.frecuenciaCardiaca,
        frecuenciaRespiratoria: dto.frecuenciaRespiratoria,
        temperatura: dto.temperatura,
        saturacionOxigeno: dto.saturacionOxigeno,
        glucosaCapilar: dto.glucosaCapilar,
        peso: dto.peso,
        talla: dto.talla,
      });
    }

    return this.consultaRepository.save(consulta);
  }

  async getPacienteTimeline(pacienteId: number): Promise<{
    pacienteId: number;
    totalConsultas: number;
    consultas: ConsultaDomain[];
    diagnosticosCronicos: DiagnosticoEntry[];
    ultimasRecetas: any[];
  }> {
    const consultas =
      await this.consultaRepository.findByPacienteId(pacienteId);
    return {
      pacienteId,
      totalConsultas: consultas.length,
      consultas,
      diagnosticosCronicos: consultas
        .flatMap((c) => c.diagnosticos)
        .filter((d) => d?.esCronico),
      ultimasRecetas: [],
    };
  }

  async getHistorialCompleto(pacienteId: number) {
    return this.consultaRepository.getHistorialCompleto(pacienteId);
  }

  async update(id: number, dto: Partial<import('../infrastructure/dto/create-consulta.dto').UpdateConsultaDto>): Promise<ConsultaDomain> {
    const consulta = await this.consultaRepository.findById(id);
    if (!consulta)
      throw new NotFoundException(`Consulta con ID ${id} no encontrada`);

    if (dto.motivo || dto.sintomas) {
      const errores = this.domainService.validarConsulta(
        dto.motivo || consulta.motivo,
        dto.sintomas || consulta.sintomas,
        consulta.pacienteId,
        consulta.medicoId,
      );
      if (errores.length > 0) throw new BadRequestException(errores.join('; '));
    }

    const data: Partial<ConsultaDomain> = {
      motivo: dto.motivo,
      sintomas: dto.sintomas,
      enfermedadActual: dto.enfermedadActual,
      examenFisico: dto.examenFisico,
      evaluacion: dto.evaluacion,
      planTratamiento: dto.planTratamiento,
      indicaciones: dto.indicaciones,
    };

    const signosFields = [
      'peso',
      'talla',
      'temperatura',
      'frecuenciaCardiaca',
      'frecuenciaRespiratoria',
      'presionArterialSistolica',
      'presionArterialDiastolica',
      'saturacionOxigeno',
      'glucosaCapilar',
    ];
    const dtoRecord = dto as Record<string, unknown>;
    const hasSignos = signosFields.some((f) => dtoRecord[f] !== undefined);
    if (hasSignos) {
      data.signosVitales = {
        peso: dto.peso ?? consulta.signosVitales.peso,
        talla: dto.talla ?? consulta.signosVitales.talla,
        temperatura: dto.temperatura ?? consulta.signosVitales.temperatura,
        frecuenciaCardiaca:
          dto.frecuenciaCardiaca ?? consulta.signosVitales.frecuenciaCardiaca,
        frecuenciaRespiratoria:
          dto.frecuenciaRespiratoria ??
          consulta.signosVitales.frecuenciaRespiratoria,
        presionArterialSistolica:
          dto.presionArterialSistolica ??
          consulta.signosVitales.presionArterialSistolica,
        presionArterialDiastolica:
          dto.presionArterialDiastolica ??
          consulta.signosVitales.presionArterialDiastolica,
        saturacionOxigeno:
          dto.saturacionOxigeno ?? consulta.signosVitales.saturacionOxigeno,
        glucosaCapilar:
          dto.glucosaCapilar ?? consulta.signosVitales.glucosaCapilar,
      };
    }

    return this.consultaRepository.update(id, data);
  }
}
