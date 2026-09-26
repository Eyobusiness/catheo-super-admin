import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { OrganisationDashboardPageComponent } from './organisation-dashboard-page.component';
import { OrganisationDashboardService } from '../services/dashboard.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganisationDashboardData } from '../models/dashboard.model';
import { CATHEO_SECTIONS, ORGANISATION_SECTION_MAPPING } from '../../../../core/constants/organisation.constants';

describe('OrganisationDashboardPageComponent', () => {
  let component: OrganisationDashboardPageComponent;
  let fixture: ComponentFixture<OrganisationDashboardPageComponent>;
  let mockDashboardService: {
    getDashboard: ReturnType<typeof vi.fn>;
  };
  let mockContextService: {
    context: ReturnType<typeof vi.fn>;
    typeOrganisation: ReturnType<typeof vi.fn>;
    isOppe: ReturnType<typeof vi.fn>;
    isOppj: ReturnType<typeof vi.fn>;
    isOppa: ReturnType<typeof vi.fn>;
    targetSectionCodes: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockOppeDashboardData: OrganisationDashboardData = {
    organisation: {
      id: 1,
      uuid: 'uuid-oppe-1',
      code: 'OPPE-01',
      nom: 'Enfance Missionnaire Sainte Famille',
      type_organisation: 'OPPE',
      statut: 'actif',
    },
    membres: {
      total: 42,
      actifs: 38,
      inactifs: 4,
    },
    activites: {
      total: 10,
      brouillon: 1,
      planifiees: 4,
      en_cours: 3,
      terminees: 2,
      annulees: 0,
      taux_moyen_execution: 78.4,
    },
    pelerinages: {
      campagnes_total: 2,
      campagnes_ouvertes: 1,
      campagnes_cloturees: 1,
      campagnes_annulees: 0,
      capacite_totale: 100,
      places_occupees: 75,
      places_restantes: 25,
      total_inscrits: 75,
      inscrits_payes: 60,
      inscrits_partiellement_payes: 10,
      inscrits_en_attente: 5,
      inscrits_annules: 0,
      inscrits_presents: 0,
      inscrits_absents: 0,
      montant_attendu: 750000,
      montant_encaisse: 650000,
      reste_a_encaisser: 100000,
    },
    finances: {
      total_entrees: 1800000,
      total_sorties: 950000,
      solde_caisse: 850000,
    },
    catheo: {
      catheo_connecte: true,
      annee_catechese: '2026-2027',
      total_population: 350,
      total_primaire: 210,
      total_college: 140,
      repartition_niveaux: [
        { niveau_id: 1, niveau: 'Éveil', total: 60 },
        { niveau_id: 2, niveau: 'CP', total: 75 },
      ],
      repartition_classes: [],
    },
  };

  const mockOppjDashboardData: OrganisationDashboardData = {
    organisation: {
      id: 2,
      uuid: 'uuid-oppj-1',
      code: 'OPPJ-01',
      nom: 'Jeunesse Pastorale Sainte Famille',
      type_organisation: 'OPPJ',
      statut: 'actif',
    },
    membres: {
      total: 28,
      actifs: 25,
      inactifs: 3,
    },
    activites: {
      total: 8,
      brouillon: 1,
      planifiees: 3,
      en_cours: 2,
      terminees: 2,
      annulees: 0,
      taux_moyen_execution: 82.5,
    },
    pelerinages: {
      campagnes_total: 1,
      campagnes_ouvertes: 1,
      campagnes_cloturees: 0,
      campagnes_annulees: 0,
      capacite_totale: 50,
      places_occupees: 40,
      places_restantes: 10,
      total_inscrits: 40,
      inscrits_payes: 35,
      inscrits_partiellement_payes: 5,
      inscrits_en_attente: 0,
      inscrits_annules: 0,
      inscrits_presents: 0,
      inscrits_absents: 0,
      montant_attendu: 400000,
      montant_encaisse: 360000,
      reste_a_encaisser: 40000,
    },
    finances: {
      total_entrees: 1200000,
      total_sorties: 700000,
      solde_caisse: 500000,
    },
    catheo: {
      catheo_connecte: true,
      annee_catechese: '2026-2027',
      total_population: 180,
      total_jeunes: 180,
      repartition_niveaux: [
        { niveau_id: 11, niveau: '1ère Année Jeunes', total: 45 },
        { niveau_id: 12, niveau: '2ème Année Jeunes', total: 40 },
        { niveau_id: 13, niveau: '3ème Année Jeunes', total: 35 },
        { niveau_id: 14, niveau: '4ème Année Jeunes', total: 32 },
        { niveau_id: 15, niveau: '5ème Année Jeunes', total: 28 },
      ],
      repartition_classes: [],
    },
  };

  beforeEach(async () => {
    mockDashboardService = {
      getDashboard: vi.fn().mockReturnValue(of(mockOppeDashboardData)),
    };

    mockContextService = {
      context: vi.fn().mockReturnValue({
        nom: 'Enfance Missionnaire Sainte Famille',
        type_organisation: 'OPPE',
        paroisse: { nom_paroisse: 'Paroisse Sainte Famille' },
      }),
      typeOrganisation: vi.fn().mockReturnValue('OPPE'),
      isOppe: vi.fn().mockReturnValue(true),
      isOppj: vi.fn().mockReturnValue(false),
      isOppa: vi.fn().mockReturnValue(false),
      targetSectionCodes: vi.fn().mockReturnValue(['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL']),
    };

    mockToastService = {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganisationDashboardPageComponent],
      providers: [
        provideRouter([
          { path: 'organisation/oppj', component: class {} },
          { path: 'organisation/oppa', component: class {} },
        ]),
        { provide: OrganisationDashboardService, useValue: mockDashboardService },
        { provide: OrganisationContextService, useValue: mockContextService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(OrganisationDashboardPageComponent);
    component = fixture.componentInstance;
  });

  // ==========================================
  // TESTS CONTEXTE OPPE (CONSERVÉS F13)
  // ==========================================

  it('should create and load dashboard data on init for OPPE', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith(false);
    expect(component.dashboardData()).toEqual(mockOppeDashboardData);
    expect(component.activeYear()).toBe('2026-2027');
    expect(component.dashboardTitle()).toBe('Dashboard OPPE');
  });

  it('should display OPPE CATHEO population with strict section codes (SEC-ENFANTS-PRI & SEC-ENFANTS-COL)', () => {
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Total Enfants OPPE');
    expect(compiled.textContent).toContain('350');
    expect(compiled.textContent).toContain('Enfants Primaire');
    expect(compiled.textContent).toContain('210');
    expect(compiled.textContent).toContain('Enfants Collège');
    expect(compiled.textContent).toContain('140');

    // Vérifier les codes immuables de section
    expect(component.sectionPrimaireCode).toBe(CATHEO_SECTIONS.ENFANTS_PRIMAIRE);
    expect(component.sectionCollegeCode).toBe(CATHEO_SECTIONS.ENFANTS_COLLEGE);
    expect(compiled.textContent).toContain(CATHEO_SECTIONS.ENFANTS_PRIMAIRE);
    expect(compiled.textContent).toContain(CATHEO_SECTIONS.ENFANTS_COLLEGE);
  });

  it('should clearly distinguish between organisation membres (42) and CATHEO children (350)', () => {
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    // Les membres de l'organisation
    expect(compiled.textContent).toContain("Membres de l'Équipe");
    expect(compiled.textContent).toContain('42');

    // Les enfants de la catéchèse
    expect(compiled.textContent).toContain('Total Enfants OPPE');
    expect(compiled.textContent).toContain('350');
  });

  it('should refresh dashboard with fresh=true and display toast', () => {
    fixture.detectChanges();

    component.refreshDashboard();
    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith(true);
    expect(mockToastService.info).toHaveBeenCalledWith('Actualisation', expect.any(String));
  });

  it('should handle error state and allow retry', () => {
    mockDashboardService.getDashboard.mockReturnValue(
      throwError(() => ({ message: 'Erreur réseau serveur' }))
    );

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Erreur réseau serveur');
    expect(mockToastService.error).toHaveBeenCalledWith('Erreur', 'Erreur réseau serveur');

    // Retry
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppeDashboardData));
    component.loadDashboard(true);

    expect(component.errorMessage()).toBeNull();
    expect(component.dashboardData()).toEqual(mockOppeDashboardData);
  });

  it('should redirect OPPA user to /organisation/oppa', () => {
    mockContextService.typeOrganisation.mockReturnValue('OPPA');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['/organisation/oppa']);
  });

  // ==========================================
  // TESTS SPÉCIFIQUES ÉTAPE F14 (DASHBOARD OPPJ)
  // ==========================================

  it('should recognize OPPJ context and load dashboard without redirection', () => {
    mockContextService.context.mockReturnValue({
      nom: 'Jeunesse Pastorale Sainte Famille',
      type_organisation: 'OPPJ',
      paroisse: { nom_paroisse: 'Paroisse Sainte Famille' },
    });
    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockContextService.targetSectionCodes.mockReturnValue(['SEC-JEUNES']);
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppjDashboardData));

    const navigateSpy = vi.spyOn(router, 'navigate');

    component.ngOnInit();
    fixture.detectChanges();

    // Pas de redirection pour OPPJ !
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.isOppj()).toBe(true);
    expect(component.dashboardTitle()).toBe('Dashboard OPPJ');
    expect(component.badgeText()).toBe('OPPJ');
    expect(component.populationCardTitle()).toBe('Population de Catéchèse Paroissiale OPPJ');
  });

  it('should strictly use SEC-JEUNES section code for OPPJ population and active year', () => {
    mockContextService.context.mockReturnValue({
      nom: 'Jeunesse Pastorale Sainte Famille',
      type_organisation: 'OPPJ',
      paroisse: { nom_paroisse: 'Paroisse Sainte Famille' },
    });
    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppjDashboardData));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;

    // Code de section strict SEC-JEUNES
    expect(component.sectionJeunesCode).toBe(CATHEO_SECTIONS.JEUNES);
    expect(component.sectionJeunesCode).toBe('SEC-JEUNES');
    expect(compiled.textContent).toContain('SEC-JEUNES');

    // Année active
    expect(component.activeYear()).toBe('2026-2027');
    expect(compiled.textContent).toContain('2026-2027');

    // Les codes OPPE ne doivent PAS figurer dans la légende OPPJ
    expect(compiled.querySelector('.sections-legend')?.textContent).toContain('SEC-JEUNES');
    expect(compiled.querySelector('.sections-legend')?.textContent).not.toContain('SEC-ENFANTS-PRI');
    expect(compiled.querySelector('.sections-legend')?.textContent).not.toContain('SEC-ENFANTS-COL');
  });

  it('should display total jeunes (180) and all 5 niveaus when provided by backend', () => {
    mockContextService.context.mockReturnValue({
      nom: 'Jeunesse Pastorale Sainte Famille',
      type_organisation: 'OPPJ',
      paroisse: { nom_paroisse: 'Paroisse Sainte Famille' },
    });
    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppjDashboardData));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;

    expect(compiled.textContent).toContain('Total Jeunes OPPJ');
    expect(compiled.textContent).toContain('180');

    // Niveaux réellement retournés par Laravel (1ère à 5ème Année Jeunes)
    expect(compiled.textContent).toContain('1ère Année Jeunes');
    expect(compiled.textContent).toContain('45');
    expect(compiled.textContent).toContain('2ème Année Jeunes');
    expect(compiled.textContent).toContain('40');
    expect(compiled.textContent).toContain('3ème Année Jeunes');
    expect(compiled.textContent).toContain('35');
    expect(compiled.textContent).toContain('4ème Année Jeunes');
    expect(compiled.textContent).toContain('32');
    expect(compiled.textContent).toContain('5ème Année Jeunes');
    expect(compiled.textContent).toContain('28');
  });

  it('should gracefully display total jeunes when no niveaus are returned (no fake data)', () => {
    const oppjWithoutNiveaux: OrganisationDashboardData = {
      ...mockOppjDashboardData,
      catheo: {
        ...mockOppjDashboardData.catheo,
        total_jeunes: 95,
        total_population: 95,
        repartition_niveaux: [],
      },
    };

    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(oppjWithoutNiveaux));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Total Jeunes OPPJ');
    expect(compiled.textContent).toContain('95');
    expect(compiled.textContent).not.toContain('Répartition par Niveaux de Catéchèse');
  });

  it('should clearly distinguish between OPPJ organisation membres (28) and CATHEO young people (180)', () => {
    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppjDashboardData));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;

    // Membres de l'organisation
    expect(compiled.textContent).toContain("Membres de l'Équipe");
    expect(compiled.textContent).toContain('28');
    expect(compiled.textContent).toContain('25 actifs sur 28');

    // Population catéchèse jeunes
    expect(compiled.textContent).toContain('Total Jeunes OPPJ');
    expect(compiled.textContent).toContain('180');
  });

  it('should adapt pèlerinages synthesis text to young people (jeunes) in OPPJ context', () => {
    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(mockOppjDashboardData));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('40 jeune(s)');
    expect(compiled.textContent).toContain("Vue d'ensemble des voyages et sorties de jeunes");
  });

  it('should assert strict negative constraints between OPPJ and OPPE sections', () => {
    // Règle formelle CATHEO
    expect(CATHEO_SECTIONS.JEUNES).toBe('SEC-JEUNES');
    expect(CATHEO_SECTIONS.JEUNES).not.toBe(CATHEO_SECTIONS.ENFANTS_PRIMAIRE);
    expect(CATHEO_SECTIONS.JEUNES).not.toBe(CATHEO_SECTIONS.ENFANTS_COLLEGE);
    expect(CATHEO_SECTIONS.JEUNES).not.toBe(CATHEO_SECTIONS.ADULTES);

    // Mapping officiel
    expect(ORGANISATION_SECTION_MAPPING.OPPJ).toEqual(['SEC-JEUNES']);
    expect(ORGANISATION_SECTION_MAPPING.OPPJ).not.toContain(CATHEO_SECTIONS.ENFANTS_PRIMAIRE);
    expect(ORGANISATION_SECTION_MAPPING.OPPJ).not.toContain(CATHEO_SECTIONS.ENFANTS_COLLEGE);
  });

  it('should display disconnected state message when catheo gateway is inactive', () => {
    const oppjDisconnected: OrganisationDashboardData = {
      ...mockOppjDashboardData,
      catheo: {
        catheo_connecte: false,
        message: 'Aucune année catéchétique active sur la paroisse.',
      },
    };

    mockContextService.typeOrganisation.mockReturnValue('OPPJ');
    mockContextService.isOppe.mockReturnValue(false);
    mockContextService.isOppj.mockReturnValue(true);
    mockDashboardService.getDashboard.mockReturnValue(of(oppjDisconnected));

    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Déconnecté');
    expect(compiled.textContent).toContain('Aucune année catéchétique active sur la paroisse.');
  });
});
