import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StatistiquesPageComponent } from './statistiques-page.component';
import { StatistiqueService } from '../services/statistique.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import {
  OrganisationDashboardMetrics,
  StatistiquesActivites,
  StatistiquesFinances,
  StatistiquesMembres,
  StatistiquesPelerinages,
} from '../models/statistique.model';

describe('StatistiquesPageComponent', () => {
  let component: StatistiquesPageComponent;
  let fixture: ComponentFixture<StatistiquesPageComponent>;
  let statServiceSpy: {
    getDashboard: ReturnType<typeof vi.fn>;
    getStatistiquesMembres: ReturnType<typeof vi.fn>;
    getStatistiquesActivites: ReturnType<typeof vi.fn>;
    getStatistiquesPelerinages: ReturnType<typeof vi.fn>;
    getStatistiquesFinances: ReturnType<typeof vi.fn>;
  };
  let orgContextSpy: {
    typeOrganisation: ReturnType<typeof vi.fn>;
  };

  const mockDashboard: OrganisationDashboardMetrics = {
    organisation: {
      id: 1,
      uuid: 'uuid-1',
      code: 'OPPE-001',
      nom: 'OPPE Ste Famille',
      type_organisation: 'OPPE',
      statut: 'actif',
    },
    membres: { total: 100, actifs: 80, inactifs: 20 },
    activites: {
      total: 10,
      brouillon: 1,
      planifiees: 2,
      en_cours: 3,
      terminees: 4,
      annulees: 0,
      taux_moyen_execution: 75.0,
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
      total_population: 240,
      sections: ['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL'],
      repartition_niveaux: { '1ere Année': 120, '2eme Année': 120 },
      repartition_classes: { 'Classe A': 60, 'Classe B': 60 },
    },
  };

  const mockMembres: StatistiquesMembres = {
    total: 100,
    actifs: 80,
    inactifs: 20,
    repartition_sexe: { M: 45, F: 55 },
    repartition_fonction: { Responsable: 4, Membre: 96 },
    evolution_adhesions: { '2026-01': 10, '2026-02': 15 },
  };

  const mockActivites: StatistiquesActivites = {
    total: 10,
    taux_moyen_execution: 75.0,
    repartition_statut: { terminee: 4, en_cours: 3, planifiee: 2, brouillon: 1 },
    repartition_type: { Formation: 5, Retraite: 5 },
    activites_par_periode: { '2026-01': 2 },
  };

  const mockPelerinages: StatistiquesPelerinages = {
    campagnes: {
      total: 2,
      repartition_statut: { ouverte: 1, cloturee: 1 },
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
      presents: 70,
      absents: 10,
      prevus: 0,
      taux_presence: 87.5,
    },
    finances: {
      montant_attendu: 2000000,
      montant_encaisse: 1600000,
      solde_restant: 400000,
      taux_recouvrement: 80.0,
    },
  };

  const mockFinances: StatistiquesFinances = {
    total_entrees: 5000000,
    total_sorties: 1000000,
    solde: 4000000,
    recettes_pelerinages: 4500000,
    autres_recettes: 500000,
    evolution_mensuelle: [
      { periode: '2026-01', entrees: 2000000, sorties: 500000, solde: 1500000 },
    ],
    repartition_modes: [{ mode: 'ESPECES', total: 3000000, count: 12 }],
  };

  beforeEach(async () => {
    statServiceSpy = {
      getDashboard: vi.fn().mockReturnValue(of(mockDashboard)),
      getStatistiquesMembres: vi.fn().mockReturnValue(of(mockMembres)),
      getStatistiquesActivites: vi.fn().mockReturnValue(of(mockActivites)),
      getStatistiquesPelerinages: vi.fn().mockReturnValue(of(mockPelerinages)),
      getStatistiquesFinances: vi.fn().mockReturnValue(of(mockFinances)),
    };
    orgContextSpy = {
      typeOrganisation: vi.fn().mockReturnValue('OPPE'),
    };

    await TestBed.configureTestingModule({
      imports: [StatistiquesPageComponent],
      providers: [
        { provide: StatistiqueService, useValue: statServiceSpy },
        { provide: OrganisationContextService, useValue: orgContextSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatistiquesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load dashboard data on init', () => {
    expect(component).toBeTruthy();
    expect(statServiceSpy.getDashboard).toHaveBeenCalled();
    expect(component.dashboardData()).toEqual(mockDashboard);
    expect(component.typeOrganisation()).toBe('OPPE');
  });

  it('should switch tabs and load corresponding statistics', () => {
    // 1. Membres Tab
    component.setActiveTab('membres');
    expect(component.activeTab()).toBe('membres');
    expect(statServiceSpy.getStatistiquesMembres).toHaveBeenCalled();
    expect(component.membresStats()).toEqual(mockMembres);

    // 2. Activités Tab
    component.setActiveTab('activites');
    expect(component.activeTab()).toBe('activites');
    expect(statServiceSpy.getStatistiquesActivites).toHaveBeenCalled();
    expect(component.activitesStats()).toEqual(mockActivites);

    // 3. Pèlerinages Tab
    component.setActiveTab('pelerinages');
    expect(component.activeTab()).toBe('pelerinages');
    expect(statServiceSpy.getStatistiquesPelerinages).toHaveBeenCalled();
    expect(component.pelerinagesStats()).toEqual(mockPelerinages);

    // 4. Finances Tab
    component.setActiveTab('finances');
    expect(component.activeTab()).toBe('finances');
    expect(statServiceSpy.getStatistiquesFinances).toHaveBeenCalled();
    expect(component.financesStats()).toEqual(mockFinances);

    // 5. CATHEO Tab
    component.setActiveTab('catheo');
    expect(component.activeTab()).toBe('catheo');
  });

  it('should filter membres and reset filters', () => {
    component.setActiveTab('membres');
    expect(component.hasMembresFilters()).toBe(false);

    const mockEvent = { target: { value: 'actif' } } as any;
    component.onFilterMembresStatutChange(mockEvent);

    expect(component.filterMembresStatut()).toBe('actif');
    expect(component.hasMembresFilters()).toBe(true);
    expect(statServiceSpy.getStatistiquesMembres).toHaveBeenCalledWith(
      expect.objectContaining({ statut: 'actif' })
    );

    component.resetMembresFilters();
    expect(component.filterMembresStatut()).toBe('');
    expect(component.hasMembresFilters()).toBe(false);
  });

  it('should filter activites and reset filters', () => {
    component.setActiveTab('activites');
    expect(component.hasActivitesFilters()).toBe(false);

    component.onFilterActivitesStatutChange({ target: { value: 'terminee' } } as any);
    expect(component.filterActivitesStatut()).toBe('terminee');
    expect(component.hasActivitesFilters()).toBe(true);

    component.resetActivitesFilters();
    expect(component.filterActivitesStatut()).toBe('');
    expect(component.hasActivitesFilters()).toBe(false);
  });

  it('should filter pelerinages and reset filters', () => {
    component.setActiveTab('pelerinages');
    expect(component.hasPelerinagesFilters()).toBe(false);

    component.onFilterPelerinagesStatutChange({ target: { value: 'payee' } } as any);
    expect(component.filterPelerinagesStatut()).toBe('payee');
    expect(component.hasPelerinagesFilters()).toBe(true);

    component.resetPelerinagesFilters();
    expect(component.filterPelerinagesStatut()).toBe('');
    expect(component.hasPelerinagesFilters()).toBe(false);
  });

  it('should filter finances and reset filters', () => {
    component.setActiveTab('finances');
    expect(component.hasFinancesFilters()).toBe(false);

    component.onFilterFinancesDateDebutChange({ target: { value: '2026-01-01' } } as any);
    expect(component.filterFinancesDateDebut()).toBe('2026-01-01');
    expect(component.hasFinancesFilters()).toBe(true);

    component.resetFinancesFilters();
    expect(component.filterFinancesDateDebut()).toBe('');
    expect(component.hasFinancesFilters()).toBe(false);
  });

  it('should handle error state when API fails', () => {
    statServiceSpy.getDashboard.mockReturnValue(
      throwError(() => ({ error: { message: 'Erreur réseau' } }))
    );

    component.loadDashboard();
    expect(component.dashboardError()).toBe('Erreur réseau');
    expect(component.isLoadingDashboard()).toBe(false);
  });

  it('should compute ratios and progress percentages correctly', () => {
    expect(component.getMembresRatio(20, 100)).toBe(20);
    expect(component.getMembresRatio(0, 0)).toBe(0);

    expect(component.getProgressPercent(50, 100)).toBe(50);
    expect(component.getProgressPercent(120, 100)).toBe(100);
    expect(component.getProgressPercent(0, 0)).toBe(0);

    expect(component.getMaxVal({ a: 10, b: 30, c: 5 })).toBe(30);
    expect(component.getChartBarHeight(15, 30)).toBe(50);
  });
});
