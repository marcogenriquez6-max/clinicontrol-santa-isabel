import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('MFA Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@hospital.com', password: 'Admin123!' });

    accessToken =
      loginRes.body.data?.access_token || loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/mfa/status - should return MFA status', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/mfa/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('POST /auth/mfa/status - should return 401 without token', async () => {
    await request(app.getHttpServer()).post('/auth/mfa/status').expect(401);
  });

  it('POST /auth/mfa/setup - should generate MFA secret and QR', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/mfa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('POST /auth/mfa/verify - should fail with wrong code', async () => {
    await request(app.getHttpServer())
      .post('/auth/mfa/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '000000' })
      .expect(401);
  });
});
