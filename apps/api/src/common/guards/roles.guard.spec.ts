import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let module: TestingModule;
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterAll(async () => {
    await module.close();
  });

  function createMockContext(role: string): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', tenantId: 't1', role } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('throws ForbiddenException when user role does not match @Roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin_taller']);
    const ctx = createMockContext('cliente');

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('passes when user role matches @Roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin_taller']);
    const ctx = createMockContext('admin_taller');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('passes when no @Roles metadata is set (open for authenticated users)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext('cliente');

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
