import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { organisationGuard } from './organisation.guard';
import { SessionService } from '../services/session.service';

describe('organisationGuard', () => {
  let sessionService: SessionService;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/organisation/dashboard' } as RouterStateSnapshot;

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

  it('should redirect unauthenticated user to /auth/organisation', () => {
    const result = TestBed.runInInjectionContext(() => organisationGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/auth/organisation');
  });

  it('should allow user belonging to an organisation', () => {
    sessionService.setSession('token-org', {
      id: '10',
      uuid: 'uuid-10',
      email: 'oppe@catheo.ci',
      user_type: 'user',
      organisation_id: 1,
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => organisationGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should allow Super Admin user to access organisation space', () => {
    sessionService.setSession('token-sa', {
      id: '1',
      uuid: 'uuid-1',
      email: 'admin@catheo.ci',
      user_type: 'super_admin',
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => organisationGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should block user without organisation and without super admin rights', () => {
    sessionService.setSession('token-none', {
      id: '99',
      uuid: 'uuid-99',
      email: 'guest@catheo.ci',
      user_type: 'user',
      organisation_id: undefined,
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => organisationGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/mon-profil');
  });

  it('should NEVER grant access based on localStorage preference alone', () => {
    // Put an OPPE preference in localStorage
    localStorage.setItem('catheo_organisation_space_pref', 'OPPE');

    // But no session is active
    const result = TestBed.runInInjectionContext(() => organisationGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/auth/organisation');
  });
});
