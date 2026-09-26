import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { CatheoPopulationPageComponent } from './catheo-population-page.component';
import { CatheoPopulationService } from '../services/catheo-population.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CatechumeneItem,
  CatheoStatusSummary,
} from '../models/catheo-population.model';

describe('CatheoPopulationPageComponent', () => {
  let component: CatheoPopulationPageComponent;
  let fixture: ComponentFixture<CatheoPopulationPageComponent>;

  let mockPopulationService: {
    getPopulation: ReturnType<typeof vi.fn>;
    getCatheoSummary: ReturnType<typeof vi.fn>;
    getPopulationType: ReturnType<typeof vi.fn>;
  };

  let mockContextService: {
    context: ReturnType<typeof signal>;
    paroisse: ReturnType<typeof signal>;
    typeOrganisation: ReturnType<typeof signal>;
  };

  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockCatechumeneItems: CatechumeneItem[] = [
    {
      inscription_id: 1,
      code_inscription: 'INS-001',
      date_inscription: '2025-09-15',
      statut_inscription: 'valide',
      catechumene: {
        id: 10,
        matricule: 'CAT-001',
        nom: 'KOUASSI',
        prenoms: 'Emmanuel',
        nom_complet: 'KOUASSI Emmanuel',
        sexe: 'M',
        date_naissance: '2014-05-12',
      },
      section: {
        id: 1,
        code: 'SEC-ENFANTS-PRI',
        nom: 'Enfants Primaire',
      },
      niveau: {
        id: 2,
        nom: '2ème Année',
      },
      classe: {
        id: 3,
        nom: 'Classe Ste Thérèse',
      },
      annee_catechese: {
        id: 1,
        libelle: '2025-2026',
      },
    },
    {
      inscription_id: 2,
      code_inscription: 'INS-002',
      date_inscription: '2025-09-18',
      statut_inscription: 'valide',
      catechumene: {
        id: 11,
        matricule: 'CAT-002',
        nom: 'BAH',
        prenoms: 'Aïcha Marie',
        nom_complet: 'BAH Aïcha Marie',
        sexe: 'F',
        date_naissance: '2012-08-24',
      },
      section: {
        id: 2,
        code: 'SEC-ENFANTS-COL',
        nom: 'Enfants Collège',
      },
      niveau: {
        id: 4,
        nom: '1ère Année Collège',
      },
      classe: {
        id: 5,
        nom: 'Classe St Augustin',
      },
      annee_catechese: {
        id: 1,
        libelle: '2025-2026',
      },
    },
  ];

  const mockSummary: CatheoStatusSummary = {
    catheo_connecte: true,
    annee_catechese: '2025-2026',
    total_population: 142,
    total_primaire: 82,
    total_college: 60,
    total_jeunes: 0,
    total_adultes: 0,
    repartition_niveaux: [
      { niveau_id: 1, niveau: '1ère Année Primaire', total: 40 },
      { niveau_id: 2, niveau: '2ème Année Primaire', total: 42 },
    ],
    repartition_classes: [
      { classe_id: 3, classe: 'Classe Ste Thérèse', total: 42 },
    ],
  };

  beforeEach(async () => {
    mockPopulationService = {
      getPopulation: vi.fn().mockReturnValue(
        of({
          data: mockCatechumeneItems,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 2,
          },
        })
      ),
      getCatheoSummary: vi.fn().mockReturnValue(of(mockSummary)),
      getPopulationType: vi.fn().mockImplementation((code) => {
        if (code === 'SEC-JEUNES') return 'OPPJ';
        if (code === 'SEC-ADULTES') return 'OPPA';
        return 'OPPE';
      }),
    };

    mockContextService = {
      context: signal({
        id: 1,
        nom: 'Commission Enfance Ste Famille',
        type_organisation: 'OPPE',
        paroisse: {
          id: 10,
          nom_paroisse: 'Sainte Famille de la Riviera',
        },
      } as any),
      paroisse: signal({
        id: 10,
        nom_paroisse: 'Sainte Famille de la Riviera',
      } as any),
      typeOrganisation: signal('OPPE'),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CatheoPopulationPageComponent],
      providers: [
        { provide: CatheoPopulationService, useValue: mockPopulationService },
        { provide: OrganisationContextService, useValue: mockContextService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatheoPopulationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load summary and population', () => {
    expect(component).toBeTruthy();
    expect(mockPopulationService.getCatheoSummary).toHaveBeenCalled();
    expect(mockPopulationService.getPopulation).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      search: undefined,
      sexe: 'tous',
      niveau_id: undefined,
      classe_id: undefined,
    });
    expect(component.items().length).toBe(2);
    expect(component.totalItems()).toBe(2);
  });

  describe('1. OPPE context', () => {
    it('should configure OPPE header, badge, and specific Primaire/College KPIs', () => {
      expect(component.typeOrganisation()).toBe('OPPE');
      expect(component.pageTitle()).toBe('Population CATHEO — Enfants');
      expect(component.organisationBadge()).toBe('OPPE — Enfants (Primaire & Collège)');
      expect(component.kpiTotalLabel()).toBe('Total Enfants');
      expect(component.kpiTotalValue()).toBe(142);
      expect(component.kpiSec1Label()).toBe('Primaire (SEC-ENFANTS-PRI)');
      expect(component.kpiSec1Value()).toBe(82);
      expect(component.kpiSec2Label()).toBe('Collège (SEC-ENFANTS-COL)');
      expect(component.kpiSec2Value()).toBe(60);
    });
  });

  describe('2. OPPJ context', () => {
    it('should configure OPPJ header, badge and Youth KPIs when context changes to OPPJ', () => {
      mockContextService.typeOrganisation.set('OPPJ');
      mockContextService.context.set({
        id: 2,
        nom: 'Pastorale des Jeunes',
        type_organisation: 'OPPJ',
        paroisse: { id: 10, nom: 'Sainte Famille' },
      } as any);

      expect(component.pageTitle()).toBe('Population CATHEO — Jeunes');
      expect(component.organisationBadge()).toBe('OPPJ — Jeunes');
      expect(component.kpiTotalLabel()).toBe('Total Jeunes');
      expect(component.kpiSec1Label()).toBe('Année Catéchétique');
      expect(component.kpiSec2Label()).toBe('Niveaux Déployés');
    });
  });

  describe('3. OPPA context', () => {
    it('should configure OPPA header, badge and Adult KPIs when context changes to OPPA', () => {
      mockContextService.typeOrganisation.set('OPPA');
      mockContextService.context.set({
        id: 3,
        nom: 'Pastorale des Adultes',
        type_organisation: 'OPPA',
        paroisse: { id: 10, nom: 'Sainte Famille' },
      } as any);

      expect(component.pageTitle()).toBe('Population CATHEO — Adultes');
      expect(component.organisationBadge()).toBe('OPPA — Adultes');
      expect(component.kpiTotalLabel()).toBe('Total Adultes');
    });
  });

  describe('4. Active catechetical year', () => {
    it('should use active year from backend summary and not hardcoded year', () => {
      expect(component.activeAnneeCatechese()).toBe('2025-2026');
      expect(component.pageSubtitle()).toContain('2025-2026');
    });
  });

  describe('5. Search and filters', () => {
    it('should update search query, reset page to 1, and reload population', () => {
      component.onSearchChange('Kouassi');
      expect(component.searchQuery()).toBe('Kouassi');
      expect(component.currentPage()).toBe(1);
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Kouassi', page: 1 })
      );
    });

    it('should filter by sexe and reload', () => {
      const event = { target: { value: 'M' } } as unknown as Event;
      component.onSexeChange(event);
      expect(component.selectedSexe()).toBe('M');
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({ sexe: 'M', page: 1 })
      );
    });

    it('should filter by niveau and reload', () => {
      const event = { target: { value: '2' } } as unknown as Event;
      component.onNiveauChange(event);
      expect(component.selectedNiveauId()).toBe('2');
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({ niveau_id: '2', page: 1 })
      );
    });

    it('should filter by classe and reload', () => {
      const event = { target: { value: '3' } } as unknown as Event;
      component.onClasseChange(event);
      expect(component.selectedClasseId()).toBe('3');
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({ classe_id: '3', page: 1 })
      );
    });

    it('should reset all filters and reload', () => {
      component.searchQuery.set('Test');
      component.selectedSexe.set('F');
      component.selectedNiveauId.set('1');
      component.selectedClasseId.set('2');

      component.onResetFilters();

      expect(component.searchQuery()).toBe('');
      expect(component.selectedSexe()).toBe('tous');
      expect(component.selectedNiveauId()).toBe('');
      expect(component.selectedClasseId()).toBe('');
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          sexe: 'tous',
          niveau_id: undefined,
          classe_id: undefined,
          page: 1,
        })
      );
    });
  });

  describe('6. Pagination', () => {
    it('should update currentPage and perPage and reload', () => {
      component.onPageChange({ page: 2, perPage: 25 });
      expect(component.currentPage()).toBe(2);
      expect(component.perPage()).toBe(25);
      expect(mockPopulationService.getPopulation).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, per_page: 25 })
      );
    });
  });

  describe('7. Detail Modal (Read-Only Consultation)', () => {
    it('should open and close detail modal with selected catechumene item', () => {
      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.selectedItem()).toBeNull();

      component.openDetailModal(mockCatechumeneItems[0]);

      expect(component.isDetailModalOpen()).toBe(true);
      expect(component.selectedItem()).toBe(mockCatechumeneItems[0]);

      component.closeDetailModal();

      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.selectedItem()).toBeNull();
    });
  });

  describe('8. Connected vs Autonomous mode', () => {
    it('should recognize connected mode when catheo_connecte is true', () => {
      expect(component.isCatheoConnected()).toBe(true);
    });

    it('should recognize autonomous mode when catheo_connecte is false', () => {
      component.catheoSummary.set({
        catheo_connecte: false,
        message: "La connexion avec CATHEO n'est pas activée pour cette organisation.",
      });

      expect(component.isCatheoConnected()).toBe(false);
    });
  });

  describe('9. Error handling', () => {
    it('should handle 403 Forbidden error with explicit authorization message', () => {
      mockPopulationService.getPopulation.mockReturnValue(
        throwError(() => ({ status: 403 }))
      );

      component.loadPopulation();

      expect(component.errorMessage()).toContain('Accès refusé');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle 401 Unauthorized error with session expired message', () => {
      mockPopulationService.getPopulation.mockReturnValue(
        throwError(() => ({ status: 401 }))
      );

      component.loadPopulation();

      expect(component.errorMessage()).toContain('Session expirée');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle 500 Server error with general failure message', () => {
      mockPopulationService.getPopulation.mockReturnValue(
        throwError(() => ({ status: 500 }))
      );

      component.loadPopulation();

      expect(component.errorMessage()).toContain('Impossible de charger la population');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('10. Table column formatters', () => {
    it('should format matricule column correctly', () => {
      const col = component.columns.find((c) => c.key === 'matricule');
      expect(col?.formatter?.(null, mockCatechumeneItems[0])).toBe('CAT-001');
    });

    it('should format nom_complet column correctly', () => {
      const col = component.columns.find((c) => c.key === 'nom_complet');
      expect(col?.formatter?.(null, mockCatechumeneItems[0])).toBe('KOUASSI Emmanuel');
    });

    it('should format genre column correctly', () => {
      const col = component.columns.find((c) => c.key === 'sexe');
      expect(col?.formatter?.(null, mockCatechumeneItems[0])).toBe('M');
      expect(col?.formatter?.(null, mockCatechumeneItems[1])).toBe('F');
    });

    it('should format section column correctly', () => {
      const col = component.columns.find((c) => c.key === 'section');
      expect(col?.formatter?.(null, mockCatechumeneItems[0])).toBe('Enfants Primaire');
    });

    it('should format classe fallback when not assigned', () => {
      const col = component.columns.find((c) => c.key === 'classe');
      const itemWithoutClasse = { ...mockCatechumeneItems[0], classe: null };
      expect(col?.formatter?.(null, itemWithoutClasse)).toBe('Non assigné');
    });
  });
});
