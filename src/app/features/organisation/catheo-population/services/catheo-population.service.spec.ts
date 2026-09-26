import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { CatheoPopulationService } from './catheo-population.service';
import {
  CatechumeneItem,
  CatheoPopulationFilterParams,
  CatheoStatusSummary,
} from '../models/catheo-population.model';

describe('CatheoPopulationService', () => {
  let service: CatheoPopulationService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockCatechumeneItem: CatechumeneItem = {
    inscription_id: 101,
    code_inscription: 'INS-2025-001',
    date_inscription: '2025-09-10',
    statut_inscription: 'valide',
    catechumene: {
      id: 501,
      matricule: 'CAT-2025-0501',
      nom: 'KOUASSI',
      prenoms: 'Emmanuel',
      nom_complet: 'KOUASSI Emmanuel',
      sexe: 'M',
      date_naissance: '2014-04-12',
    },
    section: {
      id: 1,
      code: 'SEC-ENFANTS-PRI',
      nom: 'Enfants Primaire',
    },
    niveau: {
      id: 2,
      nom: '2ème Année Primaire',
    },
    classe: {
      id: 3,
      nom: 'Classe St Jean',
    },
    annee_catechese: {
      id: 5,
      libelle: '2025-2026',
      statut: 'active',
    },
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CatheoPopulationService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(CatheoPopulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPopulation', () => {
    it('should call organisation/catheo/population without query params when none provided', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockCatechumeneItem],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
          },
        })
      );

      service.getPopulation().subscribe((res) => {
        expect(res.data).toEqual([mockCatechumeneItem]);
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        'organisation/catheo/population',
        { params: {} }
      );
    });

    it('should send filter parameters when provided', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockCatechumeneItem],
          meta: {
            current_page: 2,
            last_page: 3,
            per_page: 10,
            total: 25,
          },
        })
      );

      const params: CatheoPopulationFilterParams = {
        page: 2,
        per_page: 10,
        search: 'Emmanuel',
        sexe: 'M',
        niveau_id: 2,
        classe_id: 3,
      };

      service.getPopulation(params).subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.meta.current_page).toBe(2);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        'organisation/catheo/population',
        {
          params: {
            page: 2,
            per_page: 10,
            search: 'Emmanuel',
            sexe: 'M',
            niveau_id: 2,
            classe_id: 3,
          },
        }
      );
    });

    it('should ignore sexe parameter if set to "tous"', () => {
      mockApiClient.get.mockReturnValue(of({ data: [], meta: { total: 0 } }));

      service.getPopulation({ sexe: 'tous' }).subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        'organisation/catheo/population',
        { params: {} }
      );
    });

    it('should fallback to default meta when not returned by backend', () => {
      mockApiClient.get.mockReturnValue(of({ data: [mockCatechumeneItem] }));

      service.getPopulation().subscribe((res) => {
        expect(res.meta.current_page).toBe(1);
        expect(res.meta.total).toBe(1);
      });
    });
  });

  describe('getCatheoSummary', () => {
    it('should extract catheo object from dashboard response', () => {
      const summaryData: CatheoStatusSummary = {
        catheo_connecte: true,
        annee_catechese: '2025-2026',
        total_population: 142,
        total_primaire: 82,
        total_college: 60,
      };

      mockApiClient.get.mockReturnValue(
        of({
          data: {
            catheo: summaryData,
          },
        })
      );

      service.getCatheoSummary().subscribe((summary) => {
        expect(summary.catheo_connecte).toBe(true);
        expect(summary.annee_catechese).toBe('2025-2026');
        expect(summary.total_population).toBe(142);
        expect(summary.total_primaire).toBe(82);
        expect(summary.total_college).toBe(60);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/dashboard');
    });

    it('should return disconnected status when catheo is missing from dashboard payload', () => {
      mockApiClient.get.mockReturnValue(of({ data: {} }));

      service.getCatheoSummary().subscribe((summary) => {
        expect(summary.catheo_connecte).toBe(false);
        expect(summary.message).toContain('Données CATHEO non disponibles');
      });
    });
  });

  describe('getPopulationType', () => {
    it('should return OPPE for primary and college sections', () => {
      expect(service.getPopulationType('SEC-ENFANTS-PRI')).toBe('OPPE');
      expect(service.getPopulationType('SEC-ENFANTS-COL')).toBe('OPPE');
    });

    it('should return OPPJ for youth section', () => {
      expect(service.getPopulationType('SEC-JEUNES')).toBe('OPPJ');
    });

    it('should return OPPA for adult section', () => {
      expect(service.getPopulationType('SEC-ADULTES')).toBe('OPPA');
    });
  });
});
