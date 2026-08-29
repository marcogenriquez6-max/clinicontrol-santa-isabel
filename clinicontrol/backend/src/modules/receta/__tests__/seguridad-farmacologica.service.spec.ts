import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeguridadFarmacologicaService } from '../domain/services/seguridad-farmacologica.service';
import { RecetaRepositoryPort } from '../domain/ports/receta-repository.port';
import { MedicamentoRepositoryPort } from '../domain/ports/medicamento-repository.port';
import { Paciente } from '../../../entities/paciente.entity';
import { MedicamentoInteraccion } from '../../../entities/medicamento-interaccion.entity';
import { Medicamento } from '../../../entities/receta-medicamento.entity';

/**
 * Pruebas del motor de seguridad farmacologica (RF-11).
 *
 * El caso central es el que motiva todo el requerimiento: un paciente
 * alergico a la PENICILINA al que se prescribe AMOXICILINA. Los nombres no
 * se parecen, pero la amoxicilina pertenece al grupo de las penicilinas, de
 * modo que el riesgo es el mismo. Una comparacion por texto no lo detecta;
 * el cruce por grupo farmacologico si.
 */

const mockRecetaRepo = { findActiveByPaciente: jest.fn() };
const mockMedicamentoRepo = { findById: jest.fn() };
const mockPacienteRepo = { findOne: jest.fn() };
const mockInteraccionRepo = { find: jest.fn() };
const mockMedicamentoOrmRepo = { find: jest.fn() };

/** Paciente con las alergias indicadas, en el formato que devuelve TypeORM. */
function pacienteCon(alergias: Array<{ nombre: string; severidad?: string }>) {
  return {
    id: 1,
    alergias: alergias.map((a, i) => ({
      id: i + 1,
      nombre: a.nombre,
      severidad: a.severidad ?? 'moderada',
      descripcion: null,
    })),
  };
}

/** Medicamentos tal como los devuelve el repositorio. */
function medicamentos(...nombres: string[]) {
  return nombres.map((nombre, i) => ({ id: i + 1, nombre }));
}

describe('SeguridadFarmacologicaService', () => {
  let service: SeguridadFarmacologicaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRecetaRepo.findActiveByPaciente.mockResolvedValue([]);
    mockInteraccionRepo.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeguridadFarmacologicaService,
        { provide: RecetaRepositoryPort, useValue: mockRecetaRepo },
        { provide: MedicamentoRepositoryPort, useValue: mockMedicamentoRepo },
        { provide: getRepositoryToken(Paciente), useValue: mockPacienteRepo },
        {
          provide: getRepositoryToken(MedicamentoInteraccion),
          useValue: mockInteraccionRepo,
        },
        {
          provide: getRepositoryToken(Medicamento),
          useValue: mockMedicamentoOrmRepo,
        },
      ],
    }).compile();

    service = module.get<SeguridadFarmacologicaService>(
      SeguridadFarmacologicaService,
    );
  });

  describe('verificarAlergias · cruce por grupo farmacologico', () => {
    it('alerta al prescribir amoxicilina a un alergico a la penicilina', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'Penicilina', severidad: 'anafilactica' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(
        medicamentos('Amoxicilina 500 mg'),
      );

      const alertas = await service.verificarAlergias(1, [1]);

      expect(alertas).toHaveLength(1);
      expect(alertas[0].tipo).toBe('ALERGIA');
      expect(alertas[0].severidad).toBe('critica');
      expect(alertas[0].mensaje).toContain('Penicilinas');
    });

    it('alerta con ibuprofeno si la alergia registrada son los AINEs', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'AINEs' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(
        medicamentos('Ibuprofeno 400 mg'),
      );

      const alertas = await service.verificarAlergias(1, [1]);

      expect(alertas).toHaveLength(1);
      expect(alertas[0].severidad).toBe('alta');
    });

    it('degrada la severidad ante reactividad cruzada penicilina-cefalosporina', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'Penicilina', severidad: 'anafilactica' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(medicamentos('Cefalexina'));

      const alertas = await service.verificarAlergias(1, [1]);

      expect(alertas).toHaveLength(1);
      // La alergia es anafilactica, pero el riesgo cruzado es menor que el directo.
      expect(alertas[0].severidad).toBe('alta');
      expect(alertas[0].mensaje).toContain('reactividad cruzada');
    });

    it('no alerta con un farmaco de otra familia', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'Penicilina' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(
        medicamentos('Paracetamol 500 mg'),
      );

      expect(await service.verificarAlergias(1, [1])).toHaveLength(0);
    });

    it('no alerta si la alergia no es a un medicamento', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'Polen' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(
        medicamentos('Amoxicilina 500 mg'),
      );

      expect(await service.verificarAlergias(1, [1])).toHaveLength(0);
    });

    it('devuelve vacio si el paciente no tiene alergias registradas', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(pacienteCon([]));

      expect(await service.verificarAlergias(1, [1])).toHaveLength(0);
    });
  });

  describe('verificarDuplicidadTerapeutica', () => {
    it('detecta dos AINEs distintos en la misma receta', () => {
      const alertas = service.verificarDuplicidadTerapeutica([
        'Ibuprofeno 400 mg',
        'Diclofenaco 50 mg',
      ]);

      expect(alertas).toHaveLength(1);
      expect(alertas[0].tipo).toBe('CONTRAINDICACION');
      expect(alertas[0].mensaje).toContain('AINE');
    });

    it('no marca duplicidad entre familias distintas', () => {
      expect(
        service.verificarDuplicidadTerapeutica([
          'Amoxicilina 500 mg',
          'Paracetamol 500 mg',
        ]),
      ).toHaveLength(0);
    });
  });

  describe('verificarSeguridadCompleta', () => {
    it('agrega las alertas de todas las comprobaciones', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(
        pacienteCon([{ nombre: 'Penicilina', severidad: 'anafilactica' }]),
      );
      mockMedicamentoOrmRepo.find.mockResolvedValue(
        medicamentos('Amoxicilina 500 mg', 'Ampicilina 500 mg'),
      );

      const alertas = await service.verificarSeguridadCompleta(1, [1, 2]);

      // Dos alergias (una por farmaco) y una duplicidad terapeutica del grupo.
      expect(alertas.filter((a) => a.tipo === 'ALERGIA')).toHaveLength(2);
      expect(
        alertas.filter((a) => a.tipo === 'CONTRAINDICACION'),
      ).toHaveLength(1);
    });
  });
});
