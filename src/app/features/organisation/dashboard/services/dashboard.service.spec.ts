import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { OrganisationDashboardService } from './dashboard.service';
import { OrganisationDashboardData } from '../models/dashboard.model';

describe('OrganisationDashboardService', () => {
  let service: OrganisationDashboardService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockData: OrganisationDashboardData = {
    organisation: {
      id: 1,
      uuid: 'uuid-1',
      code: 'OPPE-01',
      nom: 'Enfance Sainte Monique',
      type_organisation: 'OPPE',
      statut: 'actif',
    },
    membres: {
      total: 35,
      actifs: 30,
      inactifs: 5,
    },
    activites: {
      total: 8,
      brouillon: 1,
      planifiees: 3,
      en_cours: 2,
      terminees: 2,
      annulees: 0,
      taux_moyen_execution: 72.5,
    },
    pelerinages: {
      campagnes_total: 1,
      campagnes_ouvertes: 1,
      campagnes_cloturees: 0,
      campagnes_annulees: 0,
      capacite_totale: 80,
      places_occupees: 60,
      places_restantes: 20,
      total_inscrits: 60,
      inscrits_payes: 45,
      inscrits_partiellement_payes: 10,
      inscrits_en_attente: 5,
      inscrits_annules: 0,
      inscrits_presents: 0,
      inscrits_absents: 0,
      montant_attendu: 600000,
      montant_encaisse: 480000,
      reste_a_encaisser: 120000,
    },
    finances: {
      total_entrees: 1200000,
      total_sorties: 650000,
      solde_caisse: 550000,
    },
    catheo: {
      catheo_connecte: true,
      annee_catechese: '2026-2027',
      total_population: 260,
      total_primaire: 160,
      total_college: 100,
      repartition_niveaux: [
        { niveau_id: 1, niveau: 'CP', total: 70 },
        { niveau_id: 2, niveau: 'CE', total: 90 },
      ],
      repartition_classes: [],
    },
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OrganisationDashboardService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(OrganisationDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET organisation/dashboard without params when fresh is false', () => {
    mockApiClient.get.mockReturnValue(of({ status: 'success', data: mockData }));

    service.getDashboard(false).subscribe((res) => {
      expect(res).toEqual(mockData);
      expect(res.catheo.total_primaire).toBe(160);
      expect(res.catheo.total_college).toBe(100);
      expect(res.catheo.total_population).toBe(260);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('organisation/dashboard', { params: undefined });
  });

  it('should call GET organisation/dashboard with fresh=true when specified', () => {
    mockApiClient.get.mockReturnValue(of({ status: 'success', data: mockData }));

    service.getDashboard(true).subscribe((res) => {
      expect(res).toEqual(mockData);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('organisation/dashboard', {
      params: { fresh: true },
    });
  });

  it('should propagate errors when API call fails', () => {
    mockApiClient.get.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    service.getDashboard().subscribe({
      next: () => expect.unreachable('Should have failed'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });
  });
});
