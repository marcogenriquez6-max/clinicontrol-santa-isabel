import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrong' })
        .expect(401);
    });

    it('should return 400 for missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '' })
        .expect(400);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should return 409 for duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: 'admin@hospital.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nombre: 'Test',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nombre: 'Test',
          email: 'test@test.com',
          password: 'short',
        })
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid.token.here' })
        .expect(401);
    });
  });
});
