import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { superAdminGuard } from './super-admin.guard';
import { SessionService } from '../services/session.service';

describe('superAdminGuard', () => {
  let sessionService: SessionService;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/super-admin/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    sessionService = TestBed.inject(SessionService);
    sessionService.clearSession();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect unauthenticated user to /auth/admin', () => {
    const result = TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/auth/admin');
  });

  it('should allow certified Super Admin user', () => {
    sessionService.setSession('token-sa', {
      id: '1',
      uuid: 'uuid-1',
      email: 'admin@catheo.ci',
      user_type: 'super_admin',
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should block non-super-admin authenticated user and redirect to organisation dashboard', () => {
    sessionService.setSession('token-org', {
      id: '2',
      uuid: 'uuid-2',
      email: 'user@catheo.ci',
      user_type: 'user',
      organisation_id: 5,
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => superAdminGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/organisation/dashboard');
  });
});
