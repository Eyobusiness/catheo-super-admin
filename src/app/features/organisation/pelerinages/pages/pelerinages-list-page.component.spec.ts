import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { PelerinagesListPageComponent } from './pelerinages-list-page.component';
import { PelerinageService } from '../services/pelerinage.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CampagnePelerinage } from '../models/pelerinage.model';

describe('PelerinagesListPageComponent', () => {
  let component: PelerinagesListPageComponent;
  let fixture: ComponentFixture<PelerinagesListPageComponent>;

  let mockPelerinageService: {
    getCampagnes: ReturnType<typeof vi.fn>;
    ouvrirCampagne: ReturnType<typeof vi.fn>;
    cloturerCampagne: ReturnType<typeof vi.fn>;
    annulerCampagne: ReturnType<typeof vi.fn>;
    deleteCampagne: ReturnType<typeof vi.fn>;
  };

  let mockOrgContextService: {
    context: ReturnType<typeof signal>;
    typeOrganisation: ReturnType<typeof signal>;
    paroisse: ReturnType<typeof signal>;
  };

  let mockPermissionService: {
    hasPermission: ReturnType<typeof vi.fn>;
  };

  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const sampleCampagnes: CampagnePelerinage[] = [
    {
      id: 1,
      uuid: 'uuid-pel-1',
      organisation_id: 10,
      code: 'PEL-2026-001',
      nom: 'Pèlerinage Marial d’Issia',
      destination: 'Issia',
      description: 'Pèlerinage annuel',
      date_depart: '2026-04-10',
      heure_depart: '06:00:00',
      date_fin: '2026-04-12',
      heure_fin: '18:00:00',
      date_debut_inscription: '2026-01-01',
      date_fin_inscription: '2026-03-31',
      capacite: 50,
      places_occupees: 25,
      places_restantes: 25,
      total_inscrits: 25,
      statut: 'ouverte',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      uuid: 'uuid-pel-2',
      organisation_id: 10,
      code: 'PEL-2026-002',
      nom: 'Pèlerinage Notre Dame de la Paix',
      destination: 'Yamoussoukro',
      description: 'Pèlerinage diocésain',
      date_depart: '2026-05-01',
      heure_depart: '07:00:00',
      date_fin: '2026-05-03',
      heure_fin: '16:00:00',
      date_debut_inscription: '2026-02-01',
      date_fin_inscription: '2026-04-20',
      capacite: 100,
      places_occupees: 0,
      places_restantes: 100,
      total_inscrits: 0,
      statut: 'brouillon',
      created_at: '2026-01-02T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    },
    {
      id: 3,
      uuid: 'uuid-pel-3',
      organisation_id: 10,
      code: 'PEL-2026-003',
      nom: 'Pèlerinage à Rome',
      destination: 'Rome',
      description: 'Pèlerinage jubilé',
      date_depart: '2026-07-01',
      heure_depart: '10:00:00',
      date_fin: '2026-07-10',
      heure_fin: '20:00:00',
      capacite: 30,
      places_occupees: 30,
      places_restantes: 0,
      total_inscrits: 30,
      statut: 'cloturee',
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    mockPelerinageService = {
      getCampagnes: vi.fn().mockReturnValue(
        of({
          data: sampleCampagnes,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 3,
          },
        })
      ),
      ouvrirCampagne: vi.fn().mockReturnValue(of({ ...sampleCampagnes[1], statut: 'ouverte' })),
      cloturerCampagne: vi.fn().mockReturnValue(
        of({ campagne: { ...sampleCampagnes[0], statut: 'cloturee' }, inscriptions_annulees: 2 })
      ),
      annulerCampagne: vi.fn().mockReturnValue(of({ ...sampleCampagnes[0], statut: 'annulee' })),
      deleteCampagne: vi.fn().mockReturnValue(of(undefined)),
    };

    mockOrgContextService = {
      context: signal({
        id: 10,
        uuid: 'org-oppe-10',
        nom: 'Comité Paroissial OPPE',
        code: 'OPPE-01',
        type_organisation: 'OPPE',
      } as any),
      typeOrganisation: signal('OPPE'),
      paroisse: signal({
        id: 1,
        nom_paroisse: 'Saint Paul du Plateau',
        ville: 'Abidjan',
      } as any),
    };

    mockPermissionService = {
      hasPermission: vi.fn().mockImplementation((perm: string) => {
        return ['pelerinages.create', 'pelerinages.update', 'pelerinages.delete'].includes(perm);
      }),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PelerinagesListPageComponent],
      providers: [
        { provide: PelerinageService, useValue: mockPelerinageService },
        { provide: OrganisationContextService, useValue: mockOrgContextService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ToastService, useValue: mockToast },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PelerinagesListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load campagnes list', () => {
    expect(component).toBeTruthy();
    expect(mockPelerinageService.getCampagnes).toHaveBeenCalled();
    expect(component.campagnes().length).toBe(3);
    expect(component.totalItems()).toBe(3);
  });

  it('should calculate KPIs correctly', () => {
    expect(component.ouvertesCount()).toBe(1);
    expect(component.termineesCount()).toBe(1);
  });

  it('should filter by search query and reload data', () => {
    component.onSearchChange('Issia');
    expect(component.searchQuery()).toBe('Issia');
    expect(component.currentPage()).toBe(1);
    expect(mockPelerinageService.getCampagnes).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Issia', page: 1 })
    );
  });

  it('should filter by status and reload data', () => {
    component.onStatutChange({ target: { value: 'ouverte' } } as unknown as Event);
    expect(component.selectedStatut()).toBe('ouverte');
    expect(component.currentPage()).toBe(1);
    expect(mockPelerinageService.getCampagnes).toHaveBeenCalledWith(
      expect.objectContaining({ statut: 'ouverte', page: 1 })
    );
  });

  it('should navigate to detail page when navigateToDetail is called', () => {
    const campagne = sampleCampagnes[0];
    component.navigateToDetail(campagne);
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/organisation/pelerinages',
      campagne.id,
    ]);
  });

  it('should handle pagination changes', () => {
    component.onPageChange({ page: 2, perPage: 15 });
    expect(component.currentPage()).toBe(2);
    expect(mockPelerinageService.getCampagnes).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, per_page: 15 })
    );
  });

  it('should open campagne and show success toast', () => {
    const campagne = sampleCampagnes[1]; // statut 'brouillon'
    component.openCampagne(campagne);
    expect(component.isConfirmDialogOpen()).toBe(true);

    component.executeConfirmedAction();

    expect(mockPelerinageService.ouvrirCampagne).toHaveBeenCalledWith(campagne.id);
    expect(mockToast.success).toHaveBeenCalledWith('Campagne ouverte', expect.stringContaining('ouvertes'));
  });

  it('should confirm and execute cloture', () => {
    const campagne = sampleCampagnes[0]; // statut 'ouverte'
    component.confirmCloture(campagne);

    expect(component.isConfirmDialogOpen()).toBe(true);
    expect(component.confirmTitle()).toContain('Clôturer');

    // Executer l'action confirmée
    component.executeConfirmedAction();

    expect(mockPelerinageService.cloturerCampagne).toHaveBeenCalledWith(campagne.id);
    expect(mockToast.success).toHaveBeenCalledWith('Campagne clôturée', expect.stringContaining('clôturée'));
  });

  it('should confirm and execute annulation', () => {
    const campagne = sampleCampagnes[0];
    component.confirmAnnulation(campagne);

    expect(component.isConfirmDialogOpen()).toBe(true);
    expect(component.confirmTitle()).toContain('Annuler');

    component.executeConfirmedAction();

    expect(mockPelerinageService.annulerCampagne).toHaveBeenCalledWith(
      campagne.id
    );
    expect(mockToast.success).toHaveBeenCalledWith('Campagne annulée', expect.stringContaining('annulée'));
  });

  it('should confirm and execute delete for brouillon', () => {
    const campagne = sampleCampagnes[1]; // statut 'brouillon'
    component.confirmDelete(campagne);

    expect(component.isConfirmDialogOpen()).toBe(true);
    expect(component.confirmTitle()).toContain('Supprimer');

    component.executeConfirmedAction();

    expect(mockPelerinageService.deleteCampagne).toHaveBeenCalledWith(campagne.id);
    expect(mockToast.success).toHaveBeenCalledWith('Campagne supprimée', expect.stringContaining('supprimée'));
  });

  it('should display error message on 403 Forbidden', () => {
    mockPelerinageService.getCampagnes.mockReturnValueOnce(
      throwError(() => ({ status: 403, message: 'Forbidden' }))
    );

    component.loadCampagnes();

    expect(component.errorMessage()).toContain('Accès refusé');
  });

  it('should display error message on 401 Unauthorized', () => {
    mockPelerinageService.getCampagnes.mockReturnValueOnce(
      throwError(() => ({ status: 401, message: 'Unauthorized' }))
    );

    component.loadCampagnes();

    expect(component.errorMessage()).toContain('Session expirée');
  });

  it('should display generic error message on server failure', () => {
    mockPelerinageService.getCampagnes.mockReturnValueOnce(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    component.loadCampagnes();

    expect(component.errorMessage()).toContain('Impossible de charger les campagnes');
  });

  it('should reset filters properly', () => {
    component.onSearchChange('Test');
    component.onStatutChange({ target: { value: 'cloturee' } } as unknown as Event);
    expect(component.hasActiveFilters()).toBe(true);

    component.onResetFilters();
    expect(component.searchQuery()).toBe('');
    expect(component.selectedStatut()).toBe('tous');
  });
});
