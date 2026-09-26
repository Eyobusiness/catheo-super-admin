import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OrganisationContextService } from './organisation-context.service';
import { SessionService } from './session.service';
import { API_BASE_URL } from '../config/api.config';
import { OrganisationContext } from '../models/organisation.models';
import { ApiResponse } from '../models/api.models';

describe('OrganisationContextService', () => {
  let service: OrganisationContextService;
  let sessionService: SessionService;
  let httpMock: HttpTestingController;

  const mockApiUrl = 'http://127.0.0.1:8000/api/v1';

  const mockOrg: OrganisationContext = {
    id: '10',
    id_interne: 10,
    code: 'OPPE-01',
    nom: 'Petite Enfance Sainte Famille',
    type_organisation: 'OPPE',
    statut: 'actif',
    produit_code: 'OPPE',
    produit_nom: 'Petite Enfance',
    paroisse: {
      id: 2,
      nom_paroisse: 'Paroisse Sainte Famille',
      code_paroisse: 'PAR-SF',
    },
    responsable: { nom: 'Jean Dupont' },
    contact: { telephone: '0102030405' },
    stats: {
      total_membres: 50,
      membres_actifs: 45,
      total_activites: 12,
      total_users: 3,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockApiUrl },
      ],
    });

    service = TestBed.inject(OrganisationContextService);
    sessionService = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionService.clearSession();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load organisation context from /organisation/context and update session', () => {
    const mockApiResponse: ApiResponse<OrganisationContext> = {
      status: 'success',
      data: mockOrg,
    };

    service.loadContext().subscribe((org) => {
      expect(org).toEqual(mockOrg);
      expect(service.typeOrganisation()).toBe('OPPE');
      expect(service.isOppe()).toBe(true);
      expect(service.isOppj()).toBe(false);
      expect(service.isOppa()).toBe(false);
      expect(service.targetSectionCodes()).toEqual(['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL']);
      expect(service.isActive()).toBe(true);
      expect(service.hasCatheoAccess()).toBe(true);
      expect(sessionService.currentOrganisation()).toEqual(mockOrg);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('should correctly configure OPPJ context with SEC-JEUNES section', () => {
    const mockOppj: OrganisationContext = {
      ...mockOrg,
      id: '20',
      type_organisation: 'OPPJ',
      nom: 'Jeunesse Paroissiale Sainte Famille',
    };

    service.loadContext().subscribe((org) => {
      expect(org).toEqual(mockOppj);
      expect(service.typeOrganisation()).toBe('OPPJ');
      expect(service.isOppe()).toBe(false);
      expect(service.isOppj()).toBe(true);
      expect(service.isOppa()).toBe(false);
      expect(service.targetSectionCodes()).toEqual(['SEC-JEUNES']);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    req.flush({ status: 'success', data: mockOppj });
  });

  it('should correctly configure OPPA context with SEC-ADULTES section', () => {
    const mockOppa: OrganisationContext = {
      ...mockOrg,
      id: '30',
      type_organisation: 'OPPA',
      nom: 'Communauté Adultes Sainte Famille',
    };

    service.loadContext().subscribe((org) => {
      expect(org).toEqual(mockOppa);
      expect(service.typeOrganisation()).toBe('OPPA');
      expect(service.isOppe()).toBe(false);
      expect(service.isOppj()).toBe(false);
      expect(service.isOppa()).toBe(true);
      expect(service.targetSectionCodes()).toEqual(['SEC-ADULTES']);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    req.flush({ status: 'success', data: mockOppa });
  });

  it('should flag inactive organisation as not active', () => {
    const mockInactive: OrganisationContext = {
      ...mockOrg,
      statut: 'inactif',
    };

    service.loadContext().subscribe((org) => {
      expect(org).toEqual(mockInactive);
      expect(service.isActive()).toBe(false);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    req.flush({ status: 'success', data: mockInactive });
  });

  it('should gracefully handle 403 or network error when loading context', () => {
    service.loadContext().subscribe((org) => {
      expect(org).toBeNull();
      expect(service.context()).toBeNull();
      expect(service.isContextLoading()).toBe(false);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/organisation/context`);
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });
});
