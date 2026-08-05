import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';

describe('NotificacionesModule (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let notifId: number;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /notificaciones should create', async () => {
    const res = await request(app.getHttpServer())
      .post('/notificaciones')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        usuarioId: 1,
        titulo: 'Nueva cita',
        mensaje: 'Tiene una cita asignada',
      })
      .expect(201);
    notifId = res.body.data?.id ?? res.body.id;
    expect(notifId).toBeDefined();
  });

  it('POST /notificaciones should return 400 for invalid data', async () => {
    await request(app.getHttpServer())
      .post('/notificaciones')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);
  });

  it('GET /notificaciones/mis-notificaciones should list', async () => {
    const res = await request(app.getHttpServer())
      .get('/notificaciones/mis-notificaciones')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('PUT /notificaciones/:id/leer should mark as read', async () => {
    if (!notifId) return;
    const res = await request(app.getHttpServer())
      .put(`/notificaciones/${notifId}/leer`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('GET /notificaciones/preferencias should get preferences', async () => {
    const res = await request(app.getHttpServer())
      .get('/notificaciones/preferencias')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('PUT /notificaciones/preferencias should update preferences', async () => {
    const res = await request(app.getHttpServer())
      .put('/notificaciones/preferencias')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ inAppEnabled: true, emailEnabled: true })
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('GET /notificaciones should return 401 without auth', async () => {
    await request(app.getHttpServer()).get('/notificaciones').expect(401);
  });
});
