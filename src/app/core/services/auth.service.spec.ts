import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { API_BASE_URL } from '../config/api.config';
import { LoginDto, LoginResponse } from '../models/auth.models';

describe('AuthService', () => {
  let authService: AuthService;
  let sessionService: SessionService;
  let httpMock: HttpTestingController;

  const mockApiUrl = 'http://127.0.0.1:8000/api/v1';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'super-admin/dashboard', component: class {} },
          { path: 'organisation/dashboard', component: class {} },
          { path: 'organisation/oppj', component: class {} },
          { path: 'organisation/oppa', component: class {} },
          { path: 'auth/login', component: class {} },
          { path: 'auth/organisation', component: class {} },
        ]),
        { provide: API_BASE_URL, useValue: mockApiUrl },
      ],
    });

    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionService.clearSession();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should successfully authenticate via login endpoint', () => {
    const dto: LoginDto = { login: 'admin@catheo.ci', password: 'SecretPassword123' };
    const mockResponse: LoginResponse = {
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token: 'mock-sanctum-token-777',
        token_type: 'Bearer',
        user_type: 'super_admin',
        user: {
          id: '1',
          uuid: 'uuid-1',
          email: 'admin@catheo.ci',
          user_type: 'super_admin',
          statut: 'actif',
          profil: {
            id: 1,
            code: 'SUPER_ADMIN',
            nom: 'Super Admin',
            permissions: ['*'],
          },
        },
        menus: [],
      },
    };

    authService.login(dto).subscribe((res) => {
      expect(res.data.token).toBe('mock-sanctum-token-777');
      expect(sessionService.isAuthenticated()).toBe(true);
      expect(sessionService.token()).toBe('mock-sanctum-token-777');
      expect(sessionService.isSuperAdmin()).toBe(true);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('should call /auth/logout and clear session', () => {
    sessionService.setSession('mock-token', {
      id: '1',
      uuid: 'uuid-1',
      email: 'a@c.ci',
      user_type: 'super_admin',
      statut: 'actif',
    });

    authService.logout().subscribe(() => {
      expect(sessionService.isAuthenticated()).toBe(false);
      expect(sessionService.token()).toBeNull();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should authenticate super admin via loginAdmin', () => {
    const dto: LoginDto = { login: 'super@catheo.ci', password: 'Password123' };
    const mockResponse: LoginResponse = {
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token: 'token-super',
        token_type: 'Bearer',
        user_type: 'super_admin',
        user: {
          id: '1',
          uuid: 'uuid-1',
          email: 'super@catheo.ci',
          user_type: 'super_admin',
          statut: 'actif',
          profil: {
            id: 1,
            code: 'SUPER_ADMIN',
            nom: 'Super Admin',
            permissions: ['*'],
          },
        },
        menus: [],
      },
    };

    authService.loginAdmin(dto).subscribe((res) => {
      expect(res.data.token).toBe('token-super');
      expect(sessionService.isSuperAdmin()).toBe(true);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should block non-super admin via loginAdmin with 403', () => {
    const dto: LoginDto = { login: 'user@catheo.ci', password: 'Password123' };
    const mockResponse: LoginResponse = {
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token: 'token-user',
        token_type: 'Bearer',
        user_type: 'user',
        user: {
          id: '2',
          uuid: 'uuid-2',
          email: 'user@catheo.ci',
          user_type: 'user',
          statut: 'actif',
          organisation_id: 10,
          profil: {
            id: 2,
            code: 'RESPONSABLE_PAROISSE',
            nom: 'Responsable',
            permissions: ['view_members'],
          },
        },
        menus: [],
      },
    };

    authService.loginAdmin(dto).subscribe({
      next: () => expect.unreachable('Should have failed'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(sessionService.token()).toBeNull();
      },
    });

    const req = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    req.flush(mockResponse);
  });

  it('should block user without organisation via loginOrganisation with 403', () => {
    const dto: LoginDto = { login: 'orphan@catheo.ci', password: 'Password123' };
    const mockResponse: LoginResponse = {
      status: 'success',
      message: 'Connexion réussie',
      data: {
        token: 'token-orphan',
        token_type: 'Bearer',
        user_type: 'user',
        user: {
          id: '3',
          uuid: 'uuid-3',
          email: 'orphan@catheo.ci',
          user_type: 'user',
          statut: 'actif',
          organisation_id: undefined,
          profil: {
            id: 3,
            code: 'INVITE',
            nom: 'Invite',
            permissions: [],
          },
        },
        menus: [],
      },
    };

    authService.loginOrganisation(dto).subscribe({
      next: () => expect.unreachable('Should have failed'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(sessionService.token()).toBeNull();
      },
    });

    const req = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    req.flush(mockResponse);
  });

  const createMockOrgResponse = (orgType: 'OPPE' | 'OPPJ' | 'OPPA'): LoginResponse => ({
    status: 'success',
    message: 'Connexion réussie',
    data: {
      token: `token-${orgType}`,
      token_type: 'Bearer',
      user_type: 'user',
      user: {
        id: '10',
        uuid: 'uuid-10',
        email: `${orgType.toLowerCase()}@catheo.ci`,
        user_type: 'user',
        statut: 'actif',
        organisation_id: 10,
        profil: {
          id: 10,
          code: 'RESPONSABLE_PAROISSE',
          nom: 'Responsable',
          permissions: ['view_members'],
        },
      },
      menus: [],
    },
  });

  const createMockContext = (type_organisation: 'OPPE' | 'OPPJ' | 'OPPA', statut: 'actif' | 'inactif' = 'actif') => ({
    id: 'org-10',
    id_interne: 10,
    type_organisation,
    code: `ORG-${type_organisation}`,
    nom: `Paroisse ${type_organisation}`,
    statut,
    produit_code: 'CATHEO_COMPLETE',
    produit_nom: 'Catheo Complète',
    responsable: { nom: 'Kouassi' },
    contact: { telephone: '0102030405' },
    stats: {
      total_membres: 100,
      membres_actifs: 90,
      total_activites: 5,
      total_users: 2,
    },
  });

  it('should authorize when selected space matches backend certified space (OPPE + OPPE)', () => {
    const dto: LoginDto = { login: 'oppe@catheo.ci', password: 'Password123', organisation_type: 'OPPE' };
    const mockLoginRes = createMockOrgResponse('OPPE');
    const mockContextRes = { status: 'success', data: createMockContext('OPPE') };

    authService.loginOrganisation(dto).subscribe({
      next: (res) => {
        expect(res.data.token).toBe('token-OPPE');
        expect(sessionService.token()).toBe('token-OPPE');
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should reject when user selects OPPJ but backend account is OPPE (SPACE_MISMATCH 403)', () => {
    const dto: LoginDto = { login: 'user@catheo.ci', password: 'Password123', organisation_type: 'OPPJ' };
    const mockLoginRes = createMockOrgResponse('OPPE');
    const mockContextRes = { status: 'success', data: createMockContext('OPPE') };

    authService.loginOrganisation(dto).subscribe({
      next: () => expect.unreachable('Should have been rejected'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.code).toBe('SPACE_MISMATCH');
        expect(err.realSpace).toBe('OPPE');
        expect(err.chosenSpace).toBe('OPPJ');
        expect(err.message).toBe("Votre compte est rattaché à l'espace OPPE. Vous ne pouvez pas vous connecter à l'espace OPPJ.");
        // Session must be revoked immediately
        expect(sessionService.token()).toBeNull();
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should reject when user selects OPPA but backend account is OPPE (SPACE_MISMATCH 403)', () => {
    const dto: LoginDto = { login: 'user@catheo.ci', password: 'Password123', organisation_type: 'OPPA' };
    const mockLoginRes = createMockOrgResponse('OPPE');
    const mockContextRes = { status: 'success', data: createMockContext('OPPE') };

    authService.loginOrganisation(dto).subscribe({
      next: () => expect.unreachable('Should have been rejected'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.code).toBe('SPACE_MISMATCH');
        expect(sessionService.token()).toBeNull();
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should authorize when selected space matches backend certified space (OPPJ + OPPJ)', () => {
    const dto: LoginDto = { login: 'oppj@catheo.ci', password: 'Password123', organisation_type: 'OPPJ' };
    const mockLoginRes = createMockOrgResponse('OPPJ');
    const mockContextRes = { status: 'success', data: createMockContext('OPPJ') };

    authService.loginOrganisation(dto).subscribe({
      next: (res) => {
        expect(res.data.token).toBe('token-OPPJ');
        expect(sessionService.token()).toBe('token-OPPJ');
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should reject when user selects OPPE but backend account is OPPJ (SPACE_MISMATCH 403)', () => {
    const dto: LoginDto = { login: 'oppj@catheo.ci', password: 'Password123', organisation_type: 'OPPE' };
    const mockLoginRes = createMockOrgResponse('OPPJ');
    const mockContextRes = { status: 'success', data: createMockContext('OPPJ') };

    authService.loginOrganisation(dto).subscribe({
      next: () => expect.unreachable('Should have been rejected'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.code).toBe('SPACE_MISMATCH');
        expect(err.realSpace).toBe('OPPJ');
        expect(err.chosenSpace).toBe('OPPE');
        expect(sessionService.token()).toBeNull();
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should authorize when selected space matches backend certified space (OPPA + OPPA)', () => {
    const dto: LoginDto = { login: 'oppa@catheo.ci', password: 'Password123', organisation_type: 'OPPA' };
    const mockLoginRes = createMockOrgResponse('OPPA');
    const mockContextRes = { status: 'success', data: createMockContext('OPPA') };

    authService.loginOrganisation(dto).subscribe({
      next: (res) => {
        expect(res.data.token).toBe('token-OPPA');
        expect(sessionService.token()).toBe('token-OPPA');
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });

  it('should reject when organisation is inactive (403)', () => {
    const dto: LoginDto = { login: 'inactive@catheo.ci', password: 'Password123', organisation_type: 'OPPE' };
    const mockLoginRes = createMockOrgResponse('OPPE');
    const mockContextRes = { status: 'success', data: createMockContext('OPPE', 'inactif') };

    authService.loginOrganisation(dto).subscribe({
      next: () => expect.unreachable('Should have been rejected'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(sessionService.token()).toBeNull();
      },
    });

    const loginReq = httpMock.expectOne(`${mockApiUrl}/auth/login`);
    loginReq.flush(mockLoginRes);

    const contextReq = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    contextReq.flush(mockContextRes);
  });
});
