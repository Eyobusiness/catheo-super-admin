import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ActivitesListPageComponent } from './activites-list-page.component';
import { ActiviteService } from '../services/activite.service';
import { MembreService } from '../../membres/services/membre.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Activite } from '../models/activite.model';

describe('ActivitesListPageComponent', () => {
  let component: ActivitesListPageComponent;
  let fixture: ComponentFixture<ActivitesListPageComponent>;

  let mockActiviteService: {
    getActivites: ReturnType<typeof vi.fn>;
    deleteActivite: ReturnType<typeof vi.fn>;
  };
  let mockMembreService: {
    getMembres: ReturnType<typeof vi.fn>;
  };
  let mockContextService: {
    context: ReturnType<typeof signal>;
    typeOrganisation: ReturnType<typeof signal>;
  };
  let mockPermissionService: {
    hasPermission: ReturnType<typeof vi.fn>;
    hasAnyPermission: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockActivites: Activite[] = [
    {
      id: 'uuid-1',
      id_interne: 101,
      organisation_id: 1,
      code: 'ACT-01',
      titre: 'Récollection des jeunes',
      description: 'Journée spirituelle',
      type_activite: 'Récollection',
      date_debut: '2024-11-15T08:30:00Z',
      date_fin: '2024-11-15T17:00:00Z',
      lieu: 'Paroisse',
      responsable_id: 10,
      responsable: {
        id: 'uuid-m1',
        id_interne: 10,
        nom: 'KOUAME',
        prenoms: 'Jean-Marc',
        nom_complet: 'KOUAME Jean-Marc',
        sexe: 'M',
        statut: 'actif',
      },
      statut: 'planifiee',
      taux_execution: 40,
      observation: null,
      created_at: '2024-10-01T10:00:00Z',
      updated_at: '2024-10-01T10:00:00Z',
    },
    {
      id: 'uuid-2',
      id_interne: 102,
      organisation_id: 1,
      code: 'ACT-02',
      titre: 'Camp biblique d’été',
      description: 'Formation biblique',
      type_activite: 'Camp',
      date_debut: '2024-08-01T08:00:00Z',
      date_fin: '2024-08-05T18:00:00Z',
      lieu: 'Yamoussoukro',
      responsable_id: null,
      responsable: null,
      statut: 'terminee',
      taux_execution: 100,
      observation: null,
      created_at: '2024-07-01T10:00:00Z',
      updated_at: '2024-08-06T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    mockActiviteService = {
      getActivites: vi.fn().mockReturnValue(
        of({
          data: mockActivites,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 2,
          },
        })
      ),
      deleteActivite: vi.fn().mockReturnValue(of(undefined)),
    };

    mockMembreService = {
      getMembres: vi.fn().mockReturnValue(
        of({
          data: [
            {
              id: 'uuid-m1',
              id_interne: 10,
              nom: 'KOUAME',
              prenoms: 'Jean-Marc',
              nom_complet: 'KOUAME Jean-Marc',
              sexe: 'M',
              statut: 'actif',
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
        })
      ),
    };

    mockContextService = {
      context: signal({
        id: 1,
        uuid: 'org-oppj-1',
        nom: 'Jeunesse Paroissiale Sainte Famille',
        code: 'OPPJ-01',
        type_organisation: 'OPPJ',
        paroisse: {
          id: 10,
          nom_paroisse: 'Sainte Famille de la Riviera',
          ville: 'Abidjan',
        },
      } as any),
      typeOrganisation: signal('OPPJ'),
    };

    mockPermissionService = {
      hasPermission: vi.fn().mockImplementation((perm: string) => perm === 'activites.manage'),
      hasAnyPermission: vi.fn().mockReturnValue(true),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ActivitesListPageComponent],
      providers: [
        { provide: ActiviteService, useValue: mockActiviteService },
        { provide: MembreService, useValue: mockMembreService },
        { provide: OrganisationContextService, useValue: mockContextService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitesListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load activites list with active context', () => {
    expect(component).toBeTruthy();
    expect(mockActiviteService.getActivites).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      search: undefined,
      statut: undefined,
      type_activite: undefined,
    });
    expect(mockMembreService.getMembres).toHaveBeenCalledWith({
      per_page: 100,
      statut: 'actif',
    });
    expect(component.activites().length).toBe(2);
    expect(component.totalItems()).toBe(2);
    expect(component.enCoursCount()).toBe(1);
    expect(component.termineesCount()).toBe(1);
  });

  it('should format page subtitle with active organisation and parish', () => {
    expect(component.pageSubtitle()).toBe(
      'Jeunesse Paroissiale Sainte Famille · Sainte Famille de la Riviera'
    );
    expect(component.typeOrganisation()).toBe('OPPJ');
  });

  describe('Search and Filter actions', () => {
    it('should trigger reload on search query change and reset page to 1', () => {
      component.onSearchChange('Camp');

      expect(component.searchQuery()).toBe('Camp');
      expect(component.currentPage()).toBe(1);
      expect(mockActiviteService.getActivites).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Camp',
          page: 1,
        })
      );
    });

    it('should trigger reload on statut change', () => {
      const event = { target: { value: 'planifiee' } } as unknown as Event;
      component.onStatutChange(event);

      expect(component.selectedStatut()).toBe('planifiee');
      expect(mockActiviteService.getActivites).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: 'planifiee',
          page: 1,
        })
      );
    });

    it('should trigger reload on type change', () => {
      const event = { target: { value: 'Récollection' } } as unknown as Event;
      component.onTypeChange(event);

      expect(component.selectedType()).toBe('Récollection');
      expect(mockActiviteService.getActivites).toHaveBeenCalledWith(
        expect.objectContaining({
          type_activite: 'Récollection',
          page: 1,
        })
      );
    });

    it('should reset all filters and reload', () => {
      component.searchQuery.set('Camp');
      component.selectedStatut.set('planifiee');
      component.selectedType.set('Camp');

      component.onResetFilters();

      expect(component.searchQuery()).toBe('');
      expect(component.selectedStatut()).toBe('tous');
      expect(component.selectedType()).toBe('tous');
      expect(component.hasActiveFilters()).toBe(false);
      expect(mockActiviteService.getActivites).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          statut: undefined,
          type_activite: undefined,
          page: 1,
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should change current page and reload data', () => {
      mockActiviteService.getActivites.mockReturnValue(
        of({
          data: mockActivites,
          meta: {
            current_page: 2,
            last_page: 3,
            per_page: 15,
            total: 35,
          },
        })
      );

      component.onPageChange({ page: 2, perPage: 15 });

      expect(component.currentPage()).toBe(2);
      expect(mockActiviteService.getActivites).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  describe('Modals: Detail, Create, Edit, Delete', () => {
    it('should open and close detail modal', () => {
      const a = mockActivites[0];
      component.openDetailModal(a);

      expect(component.isDetailModalOpen()).toBe(true);
      expect(component.selectedActivite()).toEqual(a);

      component.closeDetailModal();
      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.selectedActivite()).toBeNull();
    });

    it('should transition from detail modal to edit modal', () => {
      const a = mockActivites[0];
      component.openDetailModal(a);
      component.onDetailEditRequested(a);

      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.isFormModalOpen()).toBe(true);
      expect(component.selectedActiviteForEdit()).toEqual(a);
    });

    it('should open create modal with null activite', () => {
      component.openCreateModal();

      expect(component.isFormModalOpen()).toBe(true);
      expect(component.selectedActiviteForEdit()).toBeNull();
    });

    it('should reload activites and close form modal when saved', () => {
      component.openCreateModal();
      component.onActiviteSaved();

      expect(component.isFormModalOpen()).toBe(false);
      expect(mockActiviteService.getActivites).toHaveBeenCalledTimes(2);
    });

    it('should open delete confirm dialog and execute deletion upon confirmation', () => {
      const a = mockActivites[0];
      component.openDeleteConfirm(a);

      expect(component.isDeleteConfirmOpen()).toBe(true);
      expect(component.activiteToDelete()).toEqual(a);
      expect(component.deleteConfirmMessage()).toContain(a.titre);

      component.onDeleteConfirmed();

      expect(mockActiviteService.deleteActivite).toHaveBeenCalledWith('uuid-1');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Activité supprimée',
        expect.stringContaining(a.titre)
      );
      expect(component.isDeleteConfirmOpen()).toBe(false);
    });

    it('should handle deletion error cleanly', () => {
      const a = mockActivites[0];
      mockActiviteService.deleteActivite.mockReturnValue(
        throwError(() => ({ status: 500, error: { message: 'Impossible de supprimer cette activité.' } }))
      );

      component.openDeleteConfirm(a);
      component.onDeleteConfirmed();

      expect(mockToast.error).toHaveBeenCalledWith('Erreur de suppression', 'Impossible de supprimer cette activité.');
      expect(component.isDeleting()).toBe(false);
    });
  });

  describe('RBAC & Multi-tenant checks', () => {
    it('should hide management actions if user only has view permission', () => {
      mockPermissionService.hasPermission.mockReturnValue(false); // no activites.manage
      mockPermissionService.hasAnyPermission.mockImplementation((perms: string[]) =>
        perms.includes('activites.view')
      );

      fixture = TestBed.createComponent(ActivitesListPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.canViewActivites()).toBe(true);
      expect(component.canCreateActivite()).toBe(false);
      expect(component.canEditActivite()).toBe(false);
      expect(component.canDeleteActivite()).toBe(false);
    });

    it('should block loading if user lacks view permission', () => {
      mockPermissionService.hasAnyPermission.mockReturnValue(false);
      mockActiviteService.getActivites.mockClear();

      fixture = TestBed.createComponent(ActivitesListPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.canViewActivites()).toBe(false);
      expect(mockActiviteService.getActivites).not.toHaveBeenCalled();
      expect(component.errorMessage()).toContain('permissions requises');
    });

    it('should support OPPE organisation type seamlessly', () => {
      mockContextService.context.set({
        id: 2,
        uuid: 'org-oppe-2',
        nom: 'Enfance Missionnaire Saint Pierre',
        code: 'OPPE-02',
        type_organisation: 'OPPE',
        paroisse: {
          id: 20,
          nom_paroisse: 'Saint Pierre de Blockhauss',
          ville: 'Abidjan',
        },
      } as any);
      mockContextService.typeOrganisation.set('OPPE');

      expect(component.typeOrganisation()).toBe('OPPE');
      expect(component.pageSubtitle()).toBe(
        'Enfance Missionnaire Saint Pierre · Saint Pierre de Blockhauss'
      );
    });

    it('should support OPPA organisation type seamlessly', () => {
      mockContextService.context.set({
        id: 3,
        uuid: 'org-oppa-3',
        nom: 'Pastorale des Adultes Saint Paul',
        code: 'OPPA-03',
        type_organisation: 'OPPA',
        paroisse: {
          id: 30,
          nom_paroisse: 'Cathédrale Saint Paul',
          ville: 'Abidjan',
        },
      } as any);
      mockContextService.typeOrganisation.set('OPPA');

      expect(component.typeOrganisation()).toBe('OPPA');
      expect(component.pageSubtitle()).toBe(
        'Pastorale des Adultes Saint Paul · Cathédrale Saint Paul'
      );
    });
  });

  describe('Error and Loading handling', () => {
    it('should handle API load failure and display error message', () => {
      mockActiviteService.getActivites.mockReturnValue(
        throwError(() => ({ status: 500, error: { message: 'Erreur réseau' } }))
      );

      component.loadActivites();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Erreur réseau');
      expect(mockToast.error).toHaveBeenCalledWith('Erreur', 'Erreur réseau');
    });
  });
});
