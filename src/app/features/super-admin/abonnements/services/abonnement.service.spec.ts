import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AbonnementService } from './abonnement.service';
import {
  Abonnement,
  AbonnementFormData,
  AbonnementPaginatedResponse,
  EcheanceAbonnement,
  EcheancePaginatedResponse,
} from '../models/abonnement.model';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('AbonnementService', () => {
  let service: AbonnementService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'http://localhost/api/v1';

  const mockAbonnement: Abonnement = {
    id: 1,
    uuid: 'uuid-abo-1',
    reference: 'ABO-26-0001',
    paroisse_id: 'paroisse-uuid-1',
    formule_id: 10,
    statut: 'actif',
    date_debut: '2026-01-01',
    date_fin: '2026-12-31',
    montant: 50000,
    montant_total: 50000,
    devise: 'XOF',
    renouvellement_automatique: true,
    observation: 'Abonnement initial',
    date_resiliation: null,
    motif_resiliation: null,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
    paroisse: {
      id: 'paroisse-uuid-1',
      nom_paroisse: 'Paroisse Saint-Michel',
      code_paroisse: 'PSM',
      diocese: 'Abidjan',
    },
    formule: {
      id: 10,
      uuid: 'formule-uuid-10',
      produit_id: 'prod-uuid-1',
      code: 'CATHEO-STD',
      nom: 'CATHEO Standard',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      produit: {
        id: 'prod-uuid-1',
        code: 'CATHEO',
        nom: 'CATHEO Gestion Paroissiale',
      },
    },
    echeances: [],
  };

  const mockEcheance: EcheanceAbonnement = {
    id: 101,
    reference: 'ECH-26-0001',
    abonnement_id: 1,
    periode_debut: '2026-01-01',
    periode_fin: '2026-12-31',
    date_echeance: '2026-01-15',
    montant: 50000,
    montant_paye: 0,
    solde_restant: 50000,
    devise: 'XOF',
    statut: 'en_attente',
    created_at: '2026-01-01T08:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockApiUrl },
        AbonnementService,
      ],
    });

    service = TestBed.inject(AbonnementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être instancié avec succès', () => {
    expect(service).toBeTruthy();
  });

  it('devrait récupérer la liste paginée des abonnements avec filtres', () => {
    const mockResponse: AbonnementPaginatedResponse = {
      data: [mockAbonnement],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 15,
        to: 1,
        total: 1,
      },
      links: {
        first: '/first',
        last: '/last',
        prev: null,
        next: null,
      },
    };

    service
      .getAbonnements({
        statut: 'actif',
        paroisse_id: 'paroisse-uuid-1',
        page: 1,
        per_page: 15,
      })
      .subscribe((res: AbonnementPaginatedResponse) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].reference).toBe('ABO-26-0001');
        expect(res.meta.total).toBe(1);
      });

    const req = httpMock.expectOne((r) =>
      r.url === `${mockApiUrl}/super-admin/abonnements` &&
      r.params.get('statut') === 'actif' &&
      r.params.get('paroisse_id') === 'paroisse-uuid-1' &&
      r.params.get('page') === '1' &&
      r.params.get('per_page') === '15'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('devrait récupérer le détail d’un abonnement avec ses échéances', () => {
    const detailWithEcheances: Abonnement = {
      ...mockAbonnement,
      echeances: [mockEcheance],
    };

    service.getAbonnement(1).subscribe((res: Abonnement) => {
      expect(res.id).toBe(1);
      expect(res.reference).toBe('ABO-26-0001');
      expect(res.echeances?.length).toBe(1);
      expect(res.echeances![0].reference).toBe('ECH-26-0001');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/abonnements/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detailWithEcheances });
  });

  it('devrait créer un nouvel abonnement', () => {
    const payload: AbonnementFormData = {
      paroisse_configuration_id: 'paroisse-uuid-1',
      formule_id: 10,
      date_debut: '2026-01-01',
      date_fin: '2026-12-31',
      renouvellement_automatique: true,
      observation: 'Nouvelle souscription',
    };

    service.createAbonnement(payload).subscribe((res: Abonnement) => {
      expect(res.reference).toBe('ABO-26-0001');
      expect(res.montant).toBe(50000);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/abonnements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: mockAbonnement });
  });

  it('devrait changer le statut d’un abonnement via PATCH /statut', () => {
    const updatedAbo: Abonnement = { ...mockAbonnement, statut: 'suspendu' };

    service.changeStatut(1, 'suspendu', 'Suspension temporaire').subscribe((res: Abonnement) => {
      expect(res.statut).toBe('suspendu');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/abonnements/1/statut`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      statut: 'suspendu',
      observation: 'Suspension temporaire',
    });
    req.flush({ data: updatedAbo });
  });

  it('devrait résilier un abonnement via POST /resilier avec motif obligatoire', () => {
    const resilieAbo: Abonnement = {
      ...mockAbonnement,
      statut: 'resilie',
      date_resiliation: '2026-06-01T10:00:00Z',
      motif_resiliation: 'Non renouvellement par la paroisse',
    };

    service
      .resilierAbonnement(1, {
        motif_resiliation: 'Non renouvellement par la paroisse',
      })
      .subscribe((res: Abonnement) => {
        expect(res.statut).toBe('resilie');
        expect(res.motif_resiliation).toBe('Non renouvellement par la paroisse');
      });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/abonnements/1/resilier`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.motif_resiliation).toBe('Non renouvellement par la paroisse');
    req.flush({ data: resilieAbo });
  });

  it('devrait récupérer la liste des échéances globales filtrées', () => {
    const mockEchResponse: EcheancePaginatedResponse = {
      data: [mockEcheance],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 15,
        to: 1,
        total: 1,
      },
      links: {
        first: '/first',
        last: '/last',
        prev: null,
        next: null,
      },
    };

    service.getEcheances({ abonnement_id: 1, statut: 'en_attente' }).subscribe((res: EcheancePaginatedResponse) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].statut).toBe('en_attente');
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${mockApiUrl}/super-admin/echeances` &&
      r.params.get('abonnement_id') === '1' &&
      r.params.get('statut') === 'en_attente'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockEchResponse);
  });
});
