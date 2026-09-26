import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '@core/services/api-client.service';
import { StatistiqueService } from './statistique.service';
import {
  OrganisationDashboardMetrics,
  StatistiquesActivites,
  StatistiquesFinances,
  StatistiquesMembres,
  StatistiquesPelerinages,
} from '../models/statistique.model';

describe('StatistiqueService', () => {
  let service: StatistiqueService;
  let apiClientSpy: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiClientSpy = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        StatistiqueService,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(StatistiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch membres statistics with query params', () => {
    const mockMembresData: StatistiquesMembres = {
      total: 50,
      actifs: 45,
      inactifs: 5,
      repartition_sexe: { M: 25, F: 25 },
      repartition_fonction: { Responsable: 2, Membre: 48 },
      evolution_adhesions: { '2026-01': 10 },
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockMembresData } as any)
    );

    service
      .getStatistiquesMembres({ statut: 'actif', sexe: 'M' })
      .subscribe((res) => {
        expect(res).toEqual(mockMembresData);
      });

    expect(apiClientSpy.get).toHaveBeenCalledWith(
      'organisation/statistiques/membres',
      { params: { statut: 'actif', sexe: 'M' } }
    );
  });

  it('should fetch activites statistics with query params', () => {
    const mockActivitesData: StatistiquesActivites = {
      total: 10,
      taux_moyen_execution: 75.5,
      repartition_statut: { terminee: 5, planifiee: 5 },
      repartition_type: { Formation: 4 },
      activites_par_periode: { '2026-01': 2 },
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockActivitesData } as any)
    );

    service.getStatistiquesActivites({ statut: 'terminee' }).subscribe((res) => {
      expect(res).toEqual(mockActivitesData);
    });

    expect(apiClientSpy.get).toHaveBeenCalledWith(
      'organisation/statistiques/activites',
      { params: { statut: 'terminee' } }
    );
  });

  it('should fetch pelerinages statistics with query params', () => {
    const mockPelerinagesData: StatistiquesPelerinages = {
      campagnes: {
        total: 2,
        repartition_statut: { ouverte: 1 },
        capacite_totale: 100,
        places_occupees: 80,
        places_restantes: 20,
        taux_occupation: 80.0,
      },
      inscriptions: {
        total: 80,
        catheo: 60,
        externes: 20,
        payes: 50,
        partiellement_payes: 20,
        en_attente: 10,
        annules: 0,
        presents: 75,
        absents: 5,
        prevus: 0,
        taux_presence: 93.75,
      },
      finances: {
        montant_attendu: 2000000,
        montant_encaisse: 1600000,
        solde_restant: 400000,
        taux_recouvrement: 80.0,
      },
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockPelerinagesData } as any)
    );

    service
      .getStatistiquesPelerinages({ campagne_id: 1, type_participant: 'CATECHUMENE' })
      .subscribe((res) => {
        expect(res).toEqual(mockPelerinagesData);
      });

    expect(apiClientSpy.get).toHaveBeenCalledWith(
      'organisation/statistiques/pelerinages',
      { params: { campagne_id: 1, type_participant: 'CATECHUMENE' } }
    );
  });

  it('should fetch finances statistics with query params', () => {
    const mockFinancesData: StatistiquesFinances = {
      total_entrees: 5000000,
      total_sorties: 1000000,
      solde: 4000000,
      recettes_pelerinages: 4500000,
      autres_recettes: 500000,
      evolution_mensuelle: [
        { periode: '2026-01', entrees: 2000000, sorties: 500000, solde: 1500000 },
      ],
      repartition_modes: [{ mode: 'ESPECES', total: 3000000, count: 10 }],
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockFinancesData } as any)
    );

    service.getStatistiquesFinances({ date_debut: '2026-01-01' }).subscribe((res) => {
      expect(res).toEqual(mockFinancesData);
    });

    expect(apiClientSpy.get).toHaveBeenCalledWith(
      'organisation/statistiques/finances',
      { params: { date_debut: '2026-01-01' } }
    );
  });

  it('should fetch dashboard metrics with fresh parameter', () => {
    const mockDashboardData: OrganisationDashboardMetrics = {
      organisation: {
        id: 1,
        uuid: 'uuid-1',
        code: 'OPPE-001',
        nom: 'OPPE Sainte Famille',
        type_organisation: 'OPPE',
        statut: 'actif',
      },
      membres: { total: 100, actifs: 90, inactifs: 10 },
      activites: {
        total: 10,
        brouillon: 1,
        planifiees: 3,
        en_cours: 2,
        terminees: 4,
        annulees: 0,
        taux_moyen_execution: 80,
      },
      pelerinages: {
        campagnes_total: 2,
        campagnes_ouvertes: 1,
        campagnes_cloturees: 1,
        campagnes_annulees: 0,
        capacite_totale: 100,
        places_occupees: 80,
        places_restantes: 20,
        total_inscrits: 80,
        inscrits_payes: 50,
        inscrits_partiellement_payes: 20,
        inscrits_en_attente: 10,
        inscrits_annules: 0,
        inscrits_presents: 70,
        inscrits_absents: 10,
        montant_attendu: 2000000,
        montant_encaisse: 1600000,
        reste_a_encaisser: 400000,
      },
      finances: {
        total_entrees: 5000000,
        total_sorties: 1000000,
        solde: 4000000,
        recettes_pelerinages: 4500000,
        autres_recettes: 500000,
      },
      catheo: {
        catheo_connecte: true,
        annee_catechese: '2025-2026',
        total_population: 200,
        sections: ['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL'],
      },
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockDashboardData } as any)
    );

    service.getDashboard(true).subscribe((res) => {
      expect(res).toEqual(mockDashboardData);
    });

    expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/dashboard', {
      params: { fresh: 'true' },
    });
  });
});
