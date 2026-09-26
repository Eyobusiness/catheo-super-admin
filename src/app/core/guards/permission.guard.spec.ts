import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { permissionGuard, requirePermission } from './permission.guard';
import { SessionService } from '../services/session.service';
import { User } from '../models/auth.models';

describe('permissionGuard', () => {
  let sessionService: SessionService;

  const mockUserWithPermissions: User = {
    id: '1',
    uuid: 'u-1',
    email: 'user@c.ci',
    user_type: 'organisation_user',
    statut: 'actif',
    organisation_id: 10,
    profil: {
      id: 2,
      code: 'RESPONSABLE_OPPE',
      nom: 'Resp OPPE',
      permissions: ['membres.view', 'membres.manage'],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    sessionService = TestBed.inject(SessionService);
    sessionService.clearSession();
  });

  it('should deny when unauthenticated', () => {
    const route = { data: { permission: 'membres.view' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => permissionGuard(route, state));
    expect(result).not.toBe(true);
  });

  it('should allow user with required permission', () => {
    sessionService.setSession('token', mockUserWithPermissions);

    const route = { data: { permission: 'membres.view' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => permissionGuard(route, state));
    expect(result).toBe(true);
  });

  it('should deny user without required permission', () => {
    sessionService.setSession('token', mockUserWithPermissions);

    const route = { data: { permission: 'caisse.read' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => permissionGuard(route, state));
    expect(result).toBe(false);
  });

  it('should work with requirePermission factory', () => {
    sessionService.setSession('token', mockUserWithPermissions);

    const guard = requirePermission('membres.manage');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBe(true);

    const guardDenied = requirePermission('pelerinages.delete');
    const resultDenied = TestBed.runInInjectionContext(() => guardDenied({} as any, {} as any));
    expect(resultDenied).toBe(false);
  });
});
