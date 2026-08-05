import { Test, TestingModule } from '@nestjs/testing';
import { TransformInterceptor } from '../transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { Reflector } from '@nestjs/core';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformInterceptor,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) },
        },
      ],
    }).compile();
    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  const createMockContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ url: '/test', method: 'GET' }),
        getResponse: () => ({ statusCode: 200, getHeader: () => undefined }),
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as unknown as ExecutionContext;

  it('should wrap response with success, data, timestamp', (done) => {
    const mockNext: CallHandler = { handle: () => of({ id: 1, name: 'test' }) };

    interceptor.intercept(createMockContext(), mockNext).subscribe((result) => {
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result.data).toEqual({ id: 1, name: 'test' });
      done();
    });
  });

  it('should skip transform when SkipTransform is set', (done) => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const rawData = { raw: true };
    const mockNext: CallHandler = { handle: () => of(rawData) };

    interceptor.intercept(createMockContext(), mockNext).subscribe((result) => {
      expect(result).toEqual(rawData);
      done();
    });
  });

  it('should handle meta property from response', (done) => {
    const mockNext: CallHandler = {
      handle: () => of({ data: [1, 2, 3], meta: { total: 3, page: 1 } }),
    };

    interceptor.intercept(createMockContext(), mockNext).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta).toEqual({ total: 3, page: 1 });
      done();
    });
  });

  it('should pass through if data already has success property', (done) => {
    const existing = { success: false, error: 'Something went wrong' };
    const mockNext: CallHandler = { handle: () => of(existing) };

    interceptor.intercept(createMockContext(), mockNext).subscribe((result) => {
      expect(result).toEqual(existing);
      done();
    });
  });
});
