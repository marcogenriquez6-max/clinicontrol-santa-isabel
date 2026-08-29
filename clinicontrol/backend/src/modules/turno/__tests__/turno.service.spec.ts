import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TurnoService } from '../application/turno.service';
import { TurnoRepositoryPort } from '../domain/ports/turno-repository.port';
import { TurnoDomain } from '../domain/turno.domain';
import { TriageService } from '../../../modules/triage/application/triage.service';
import { ESILevel } from '../../../modules/triage/domain/triage.domain';

const mockTurnoRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findTV: jest.fn(),
  getUltimoNumero: jest.fn(),
  save: jest.fn(),
  updateEstado: jest.fn(),
  marcarPagado: jest.fn(),
  remove: jest.fn(),
};

const mockTriageService = {
  findByPaciente: jest.fn(),
};

const mockEntityManager = {
  getRepository: jest.fn().mockReturnValue({ findOne: jest.fn() }),
};

const buildTurno = (id: number, pagado: boolean, estado = 'espera') =>
  new TurnoDomain(
    100 + id,
    id,
    1,
    estado as any,
    0,
    pagado,
    undefined,
    id,
  );

describe('TurnoService — Regla de cobro previo', () => {
  let service: TurnoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoService,
        { provide: TurnoRepositoryPort, useValue: mockTurnoRepo },
        { provide: TriageService, useValue: mockTriageService },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();
    service = module.get<TurnoService>(TurnoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('permite atender un turno pagado', async () => {
    const turno = buildTurno(1, true);
    mockTurnoRepo.findById.mockResolvedValue(turno);
    mockTurnoRepo.updateEstado.mockResolvedValue({ ...turno, estado: 'atencion' });

    await expect(service.updateEstado(1, 'atencion')).resolves.toBeDefined();
    expect(mockTriageService.findByPaciente).not.toHaveBeenCalled();
  });

  it('rechaza atender un turno impago con triaje E3', async () => {
    const turno = buildTurno(2, false);
    mockTurnoRepo.findById.mockResolvedValue(turno);
    mockTriageService.findByPaciente.mockResolvedValue([
      { esiNivel: ESILevel.TRES },
    ]);

    await expect(service.updateEstado(2, 'atencion')).rejects.toThrow(
      ConflictException,
    );
    expect(mockTurnoRepo.updateEstado).not.toHaveBeenCalled();
  });

  it('permite atender sin pago un turno con triaje E1 (emergencia vital)', async () => {
    const turno = buildTurno(3, false);
    mockTurnoRepo.findById.mockResolvedValue(turno);
    mockTriageService.findByPaciente.mockResolvedValue([
      { esiNivel: ESILevel.UNO },
    ]);
    mockTurnoRepo.updateEstado.mockResolvedValue({ ...turno, estado: 'atencion' });

    await expect(service.updateEstado(3, 'atencion')).resolves.toBeDefined();
    expect(mockTriageService.findByPaciente).toHaveBeenCalledWith(3);
  });

  it('permite atender sin pago un turno con triaje E2 (emergencia)', async () => {
    const turno = buildTurno(4, false);
    mockTurnoRepo.findById.mockResolvedValue(turno);
    mockTriageService.findByPaciente.mockResolvedValue([
      { esiNivel: ESILevel.DOS },
    ]);
    mockTurnoRepo.updateEstado.mockResolvedValue({ ...turno, estado: 'atencion' });

    await expect(service.updateEstado(4, 'atencion')).resolves.toBeDefined();
  });

  it('lanza NotFoundException si el turno no existe', async () => {
    mockTurnoRepo.findById.mockResolvedValue(null);
    await expect(service.updateEstado(999, 'atencion')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('TurnoService — Guard de propiedad GET /turnos', () => {
  let service: TurnoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoService,
        { provide: TurnoRepositoryPort, useValue: mockTurnoRepo },
        { provide: TriageService, useValue: mockTriageService },
        { provide: EntityManager, useValue: mockEntityManager },
      ],
    }).compile();
    service = module.get<TurnoService>(TurnoService);
  });

  it('filtra la lista por médico cuando el rol es medico', async () => {
    mockEntityManager.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({ id: 42 }),
    });
    mockTurnoRepo.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } });

    await service.findAllScoped({ id: 7, rol: 'medico' }, {});

    expect(mockEntityManager.getRepository).toHaveBeenCalled();
    expect(mockTurnoRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ medicoId: 42 }),
    );
  });

  it('no restringe la lista para roles no-médicos', async () => {
    mockTurnoRepo.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } });

    await service.findAllScoped(
      { id: 7, rol: 'recepcionista' },
      { medicoId: 99 },
    );

    expect(mockEntityManager.getRepository).not.toHaveBeenCalled();
    expect(mockTurnoRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ medicoId: 99 }),
    );
  });
});
