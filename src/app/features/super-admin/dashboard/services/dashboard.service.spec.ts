import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { SuperAdminDashboardData } from '../models/dashboard.model';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'http://localhost/api/v1';

  const mockDashboardData: SuperAdminDashboardData = {
    paroisses: { total: 2, actives: 2 },
    produits_actifs: 4,
    abonnements: {
      actifs: 3,
      en_attente: 1,
      suspendus: 0,
      expires: 0,
      resilies: 0,
    },
    finances: {
      ca_total_encaisse: 150000,
      ca_mois_courant: 50000,
      echeances_en_retard: 0,
      montant_en_retard: 0,
      devise: 'XOF',
    },
    repartition_produits: [
      { produit_id: 1, produit_code: 'OPPE', produit_nom: 'OPPE', abonnements_actifs: 3 },
    ],
    paiements_recents: [
      {
        id: 'uuid-1',
        reference: 'PAI-001',
        montant: 50000,
        devise: 'XOF',
        mode_paiement: 'orange_money',
        date_paiement: '2026-09-18',
        paroisse_nom: 'Ste Monique',
        produit_code: 'OPPE',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockApiUrl },
        DashboardService,
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/v1/super-admin/dashboard and return unwrapped data', () => {
    service.getDashboardData().subscribe((data) => {
      expect(data).toEqual(mockDashboardData);
      expect(data.paroisses.total).toBe(2);
      expect(data.produits_actifs).toBe(4);
      expect(data.abonnements.actifs).toBe(3);
      expect(data.finances.ca_total_encaisse).toBe(150000);
      expect(data.repartition_produits.length).toBe(1);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      message: 'Indicateurs consolidés du tableau de bord Super Admin.',
      data: mockDashboardData,
    });
  });
});
