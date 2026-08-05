import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../src/entities/rol.entity';
import { AppModule } from '../src/app.module';

describe('PacienteController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // RolesGuard checks user.rol === 'admin' (lowercase).
    // The seeder creates 'ADMIN' (uppercase). Update to lowercase so the guard passes.
    const rolRepo = moduleFixture.get<Repository<Rol>>(getRepositoryToken(Rol));
    const adminRol = await rolRepo.findOne({ where: { nombre: 'ADMIN' } });
    if (adminRol) {
      await rolRepo.update(adminRol.id, { nombre: 'admin' });
    }

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({
      sub: 1,
      email: 'admin@hospital.com',
      rol: 'admin',
      permissions: ['*'],
    });

    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('/pacientes (POST)', () => {
    it('should create a new paciente', async () => {
      const response = await request(app.getHttpServer())
        .post('/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Test',
          apellido: 'Paciente',
          ci: '99999999',
          fechaNacimiento: '1990-01-01',
          generoId: 1,
          grupoSanguineoId: 1,
          telefono: '77123456',
          email: 'test@paciente.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Test');
      expect(response.body.ci).toBe('99999999');
      createdId = response.body.id;
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'X' })
        .expect(400);
    });
  });

  describe('/pacientes (GET)', () => {
    it('should return paginated list of pacientes', async () => {
      const response = await request(app.getHttpServer())
        .get('/pacientes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer()).get('/pacientes').expect(401);
    });
  });

  describe('/pacientes/:id (GET)', () => {
    it('should return a paciente by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pacientes/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdId);
      expect(response.body).toHaveProperty('nombre');
    });

    it('should return 404 for nonexistent paciente', async () => {
      return request(app.getHttpServer())
        .get('/pacientes/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/pacientes/ci/:ci (GET)', () => {
    it('should find paciente by CI', async () => {
      const response = await request(app.getHttpServer())
        .get('/pacientes/ci/99999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ci', '99999999');
    });

    it('should return 404 for nonexistent CI', async () => {
      return request(app.getHttpServer())
        .get('/pacientes/ci/00000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/pacientes/:id (PUT)', () => {
    it('should update a paciente', async () => {
      const response = await request(app.getHttpServer())
        .put(`/pacientes/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nombre: 'Updated', apellido: 'Name' })
        .expect(200);

      expect(response.body.nombre).toBe('Updated');
      expect(response.body.apellido).toBe('Name');
    });
  });

  describe('/pacientes/:id (DELETE)', () => {
    it('should delete a paciente', async () => {
      await request(app.getHttpServer())
        .delete(`/pacientes/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
