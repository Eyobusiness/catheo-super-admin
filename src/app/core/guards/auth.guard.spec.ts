import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { SessionService } from '../services/session.service';

describe('authGuard', () => {
  let sessionService: SessionService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/super-admin/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    sessionService.clearSession();
  });

  it('should redirect unauthenticated user to /auth/organisation', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/auth/organisation');
  });

  it('should allow authenticated user', () => {
    sessionService.setSession('valid-token', {
      id: '1',
      uuid: 'u-1',
      email: 'a@c.ci',
      user_type: 'super_admin',
      statut: 'actif',
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });
});
