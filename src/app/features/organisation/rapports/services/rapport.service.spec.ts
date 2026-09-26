import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '@core/services/api-client.service';
import { RapportService } from './rapport.service';
import { RapportAnnuel } from '../models/rapport.model';

describe('RapportService', () => {
  let service: RapportService;
  let apiClientSpy: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiClientSpy = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RapportService,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(RapportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch annual report with specific annee', () => {
    const mockRapport: RapportAnnuel = {
      annee_exercice: 2026,
      organisation: {
        id: 1,
        nom: 'OPPE Sainte Famille',
        code: 'OPPE-001',
        type_organisation: 'OPPE',
      },
      membres: {
        total: 100,
        actifs: 90,
        inactifs: 10,
        nouvelles_adhesions: 15,
      },
      activites: {
        total: 8,
        repartition_statut: { terminee: 6, planifiee: 2 },
        taux_moyen_execution: 85.0,
      },
      pelerinages: {
        campagnes: 2,
        total_participants: 70,
        presents: 68,
        absents: 2,
        taux_presence: 97.14,
      },
      finances: {
        total_entrees: 4000000,
        total_sorties: 1000000,
        solde_net: 3000000,
      },
      catheo: {
        catheo_connecte: true,
        annee_catechese: '2025-2026',
        total_population: 250,
        sections: ['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL'],
      },
    };

    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: mockRapport } as any)
    );

    service.getRapportAnnuel(2026).subscribe((res) => {
      expect(res).toEqual(mockRapport);
    });

    expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/rapports/annuel', {
      params: { annee: 2026 },
    });
  });

  it('should fetch annual report without annee parameter when not provided', () => {
    apiClientSpy.get.mockReturnValue(
      of({ status: 'success', message: 'OK', data: {} } as any)
    );

    service.getRapportAnnuel().subscribe();

    expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/rapports/annuel', {
      params: {},
    });
  });
});
