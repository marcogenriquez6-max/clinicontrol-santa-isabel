import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';

describe('CitaModule (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let pacienteId: number;
  let medicoId: number;
  let citaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({
      sub: '1',
      email: 'admin@hospital.com',
      rol: 'admin',
      permissions: ['*'],
    });

    const pRes = await request(app.getHttpServer())
      .post('/pacientes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nombre: 'TestP',
        apellido: 'Paciente',
        ci: 'CITA-TEST-01',
        fechaNacimiento: '1990-01-01',
        generoId: 1,
      })
      .expect(201);
    pacienteId = pRes.body.data?.id ?? pRes.body.id;

    const mRes = await request(app.getHttpServer())
      .post('/medicos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nombre: 'TestM', apellido: 'Medico', especialidadId: 1 })
      .expect(201);
    medicoId = mRes.body.data?.id ?? mRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /citas should create a cita', async () => {
    const res = await request(app.getHttpServer())
      .post('/citas')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        pacienteId,
        medicoId,
        fecha: '2026-06-15',
        horaInicio: '09:00',
        horaFin: '09:30',
        estadoId: 1,
      })
      .expect(201);
    citaId = res.body.data?.id ?? res.body.id;
    expect(citaId).toBeDefined();
  });

  it('POST /citas should return 400 for invalid data', async () => {
    await request(app.getHttpServer())
      .post('/citas')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  it('GET /citas should list with filters', async () => {
    const res = await request(app.getHttpServer())
      .get(`/citas?pacienteId=${pacienteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const data = res.body.data ?? res.body;
    expect(data).toBeDefined();
  });

  it('GET /citas should return 401 without auth', async () => {
    await request(app.getHttpServer()).get('/citas').expect(401);
  });

  it('GET /citas/1 should get one', async () => {
    const res = await request(app.getHttpServer())
      .get('/citas/1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const data = res.body.data ?? res.body;
    expect(data.id).toBe(1);
  });

  it('GET /citas/999 should return 404', async () => {
    await request(app.getHttpServer())
      .get('/citas/999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('PUT /citas/1 should update estado', async () => {
    const res = await request(app.getHttpServer())
      .put('/citas/1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ estadoId: 2 })
      .expect(200);
    const data = res.body.data ?? res.body;
    expect(data).toBeDefined();
  });

  it('PUT /citas/1/cancelar should cancel', async () => {
    const res = await request(app.getHttpServer())
      .put('/citas/1/cancelar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ motivo: 'Cancelado por test' })
      .expect(200);
    const data = res.body.data ?? res.body;
    expect(data).toBeDefined();
  });

  it('DELETE /citas/:id should delete', async () => {
    if (!citaId) return;
    const res = await request(app.getHttpServer())
      .delete(`/citas/${citaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });
});
