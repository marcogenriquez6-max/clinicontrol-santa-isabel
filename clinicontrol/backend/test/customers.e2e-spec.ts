import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { CustomerController } from '../src/modules/customer/customer.controller';
import { CustomerService } from '../src/modules/customer/customer.service';

describe('CustomerController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let customerService: CustomerService;
  let authToken: string;

  const testCustomer = {
    name: 'Test Customer',
    company: 'Test Company',
    accountStatusId: 1,
    notes: 'Test notes',
    tags: ['vip'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    customerService = moduleFixture.get<CustomerService>(CustomerService);

    authToken = jwtService.sign({
      sub: '1',
      email: 'test@test.com',
      rol: 'ADMIN',
      permissions: ['*'],
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/customers (GET)', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer()).get('/customers').expect(401);
    });

    it('should return paginated customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should filter by search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?accountStatusId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('/customers (POST)', () => {
    it('should create a new customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCustomer)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testCustomer.name);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('/customers/:id (GET)', () => {
    let createdCustomerId: string;

    beforeAll(async () => {
      const created = await customerService.create(testCustomer);
      createdCustomerId = created.id;
    });

    it('should return a customer by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testCustomer.name);
    });

    it('should return 404 for nonexistent customer', () => {
      return request(app.getHttpServer())
        .get('/customers/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/customers/:id (PUT)', () => {
    let createdCustomerId: string;

    beforeAll(async () => {
      const created = await customerService.create(testCustomer);
      createdCustomerId = created.id;
    });

    it('should update a customer', async () => {
      const response = await request(app.getHttpServer())
        .put(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });
  });

  describe('/customers/:id (DELETE)', () => {
    let createdCustomerId: string;

    beforeAll(async () => {
      const created = await customerService.create(testCustomer);
      createdCustomerId = created.id;
    });

    it('should delete a customer', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  describe('/customers/:id/interactions (POST)', () => {
    let createdCustomerId: string;

    beforeAll(async () => {
      const created = await customerService.create(testCustomer);
      createdCustomerId = created.id;
    });

    it('should add interaction to customer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/customers/${createdCustomerId}/interactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interactionType: 'call',
          subject: 'Test Call',
          content: 'Test content',
          priority: 'normal',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('/customers/:id/timeline (GET)', () => {
    let createdCustomerId: string;

    beforeAll(async () => {
      const created = await customerService.create(testCustomer);
      createdCustomerId = created.id;
    });

    it('should return timeline', async () => {
      const response = await request(app.getHttpServer())
        .get(`/customers/${createdCustomerId}/timeline`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
