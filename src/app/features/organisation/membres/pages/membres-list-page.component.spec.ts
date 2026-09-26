import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MembresListPageComponent } from './membres-list-page.component';
import { MembreService } from '../services/membre.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Membre } from '../models/membre.model';

describe('MembresListPageComponent', () => {
  let component: MembresListPageComponent;
  let fixture: ComponentFixture<MembresListPageComponent>;

  let mockMembreService: {
    getMembres: ReturnType<typeof vi.fn>;
    deleteMembre: ReturnType<typeof vi.fn>;
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

  const mockMembres: Membre[] = [
    {
      id: 'uuid-1',
      id_interne: 1,
      nom: 'KOUAME',
      prenoms: 'Jean-Marc',
      nom_complet: 'KOUAME Jean-Marc',
      sexe: 'M',
      date_naissance: '1990-05-14',
      telephone: '0701020304',
      email: 'jm.kouame@example.com',
      quartier: 'Cocody',
      adresse: 'Rue 1',
      fonction: 'Animateur principal',
      date_entree: '2024-01-15',
      statut: 'actif',
      photo_path: null,
      observation: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'uuid-2',
      id_interne: 2,
      nom: 'YAO',
      prenoms: 'Awa Solange',
      nom_complet: 'YAO Awa Solange',
      sexe: 'F',
      date_naissance: '1995-10-20',
      telephone: '0505050505',
      email: 'solange.yao@example.com',
      quartier: 'Yopougon',
      adresse: 'Rue 2',
      fonction: 'Secrétaire',
      date_entree: '2023-09-01',
      statut: 'inactif',
      photo_path: null,
      observation: null,
      created_at: '2023-09-01T08:00:00Z',
      updated_at: '2023-09-01T08:00:00Z',
    },
  ];

  beforeEach(async () => {
    mockMembreService = {
      getMembres: vi.fn().mockReturnValue(
        of({
          data: mockMembres,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 2,
          },
        })
      ),
      deleteMembre: vi.fn().mockReturnValue(of(undefined)),
    };

    mockContextService = {
      context: signal({
        id: 1,
        uuid: 'org-oppe-1',
        nom: 'Enfance Missionnaire Ste Famille',
        code: 'OPPE-01',
        type_organisation: 'OPPE',
        paroisse: {
          id: 10,
          nom_paroisse: 'Sainte Famille de la Riviera',
          ville: 'Abidjan',
        },
      } as any),
      typeOrganisation: signal('OPPE'),
    };

    mockPermissionService = {
      hasPermission: vi.fn().mockImplementation((perm: string) => perm === 'membres.manage'),
      hasAnyPermission: vi.fn().mockImplementation((perms: string[]) =>
        perms.includes('membres.view') || perms.includes('membres.manage')
      ),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MembresListPageComponent],
      providers: [
        { provide: MembreService, useValue: mockMembreService },
        { provide: OrganisationContextService, useValue: mockContextService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MembresListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load membres list with active tenant context', () => {
    expect(component).toBeTruthy();
    expect(mockMembreService.getMembres).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      search: undefined,
      statut: undefined,
      sexe: undefined,
    });
    expect(component.membres().length).toBe(2);
    expect(component.totalItems()).toBe(2);
    expect(component.actifsCount()).toBe(1);
    expect(component.inactifsCount()).toBe(1);
  });

  it('should format page subtitle with current organisation and parish name', () => {
    expect(component.pageSubtitle()).toBe(
      'Enfance Missionnaire Ste Famille · Sainte Famille de la Riviera'
    );
    expect(component.typeOrganisation()).toBe('OPPE');
  });

  describe('Search and Filter actions', () => {
    it('should trigger reload on search query change and reset page to 1', () => {
      component.onSearchChange('Jean');

      expect(component.searchQuery()).toBe('Jean');
      expect(component.currentPage()).toBe(1);
      expect(mockMembreService.getMembres).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Jean',
          page: 1,
        })
      );
    });

    it('should trigger reload on statut change', () => {
      const event = { target: { value: 'actif' } } as unknown as Event;
      component.onStatutChange(event);

      expect(component.selectedStatut()).toBe('actif');
      expect(mockMembreService.getMembres).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: 'actif',
          page: 1,
        })
      );
    });

    it('should trigger reload on sexe change', () => {
      const event = { target: { value: 'F' } } as unknown as Event;
      component.onSexeChange(event);

      expect(component.selectedSexe()).toBe('F');
      expect(mockMembreService.getMembres).toHaveBeenCalledWith(
        expect.objectContaining({
          sexe: 'F',
          page: 1,
        })
      );
    });

    it('should reset all filters and reload', () => {
      component.searchQuery.set('Jean');
      component.selectedStatut.set('actif');
      component.selectedSexe.set('M');

      component.onResetFilters();

      expect(component.searchQuery()).toBe('');
      expect(component.selectedStatut()).toBe('tous');
      expect(component.selectedSexe()).toBe('tous');
      expect(component.hasActiveFilters()).toBe(false);
      expect(mockMembreService.getMembres).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          statut: undefined,
          sexe: undefined,
          page: 1,
        })
      );
    });
  });

  describe('Pagination', () => {
    it('should change current page and reload data', () => {
      mockMembreService.getMembres.mockReturnValue(
        of({
          data: mockMembres,
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
      expect(mockMembreService.getMembres).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  describe('Modals: Detail, Create, Edit, Delete', () => {
    it('should open and close detail modal', () => {
      const m = mockMembres[0];
      component.openDetailModal(m);

      expect(component.isDetailModalOpen()).toBe(true);
      expect(component.selectedMembre()).toEqual(m);

      component.closeDetailModal();
      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.selectedMembre()).toBeNull();
    });

    it('should transition from detail modal to edit modal', () => {
      const m = mockMembres[0];
      component.openDetailModal(m);
      component.onDetailEditRequested(m);

      expect(component.isDetailModalOpen()).toBe(false);
      expect(component.isFormModalOpen()).toBe(true);
      expect(component.selectedMembreForEdit()).toEqual(m);
    });

    it('should open create modal with null membre', () => {
      component.openCreateModal();

      expect(component.isFormModalOpen()).toBe(true);
      expect(component.selectedMembreForEdit()).toBeNull();
    });

    it('should reload membres and close form modal when saved', () => {
      component.openCreateModal();
      component.onMembreSaved();

      expect(component.isFormModalOpen()).toBe(false);
      expect(mockMembreService.getMembres).toHaveBeenCalledTimes(2); // once on init, once on save
    });

    it('should open delete confirm dialog and execute deletion upon confirmation', () => {
      const m = mockMembres[0];
      component.openDeleteConfirm(m);

      expect(component.isDeleteConfirmOpen()).toBe(true);
      expect(component.membreToDelete()).toEqual(m);
      expect(component.deleteConfirmMessage()).toContain(m.nom_complet);

      component.onDeleteConfirmed();

      expect(mockMembreService.deleteMembre).toHaveBeenCalledWith('uuid-1');
      expect(mockToast.success).toHaveBeenCalledWith(
        'Membre supprimé',
        expect.stringContaining(m.nom_complet)
      );
      expect(component.isDeleteConfirmOpen()).toBe(false);
    });

    it('should handle deletion error cleanly', () => {
      const m = mockMembres[0];
      mockMembreService.deleteMembre.mockReturnValue(
        throwError(() => ({ status: 500, error: { message: 'Impossible de supprimer le membre' } }))
      );

      component.openDeleteConfirm(m);
      component.onDeleteConfirmed();

      expect(mockToast.error).toHaveBeenCalledWith('Erreur de suppression', 'Impossible de supprimer le membre');
      expect(component.isDeleting()).toBe(false);
    });
  });

  describe('RBAC & Multi-tenant checks', () => {
    it('should hide management actions if user only has view permission', () => {
      mockPermissionService.hasPermission.mockReturnValue(false); // does not have membres.manage
      fixture = TestBed.createComponent(MembresListPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.canManageMembres()).toBe(false);
      expect(component.canViewMembres()).toBe(true);
    });

    it('should block loading if user lacks view permission', () => {
      mockPermissionService.hasAnyPermission.mockReturnValue(false); // lacks membres.view and membres.manage
      mockMembreService.getMembres.mockClear();

      fixture = TestBed.createComponent(MembresListPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.canViewMembres()).toBe(false);
      expect(mockMembreService.getMembres).not.toHaveBeenCalled();
      expect(component.errorMessage()).toContain('permissions requises');
    });

    it('should support OPPJ organisation type seamlessly', () => {
      mockContextService.context.set({
        id: 2,
        uuid: 'org-oppj-2',
        nom: 'Jeunesse Paroissiale Saint Jean',
        code: 'OPPJ-02',
        type_organisation: 'OPPJ',
        paroisse: {
          id: 20,
          nom_paroisse: 'Saint Jean de Cocody',
          ville: 'Abidjan',
        },
      } as any);
      mockContextService.typeOrganisation.set('OPPJ');

      expect(component.typeOrganisation()).toBe('OPPJ');
      expect(component.pageSubtitle()).toBe('Jeunesse Paroissiale Saint Jean · Saint Jean de Cocody');
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
      expect(component.pageSubtitle()).toBe('Pastorale des Adultes Saint Paul · Cathédrale Saint Paul');
    });
  });

  describe('Error and Loading handling', () => {
    it('should handle API load failure and display error message', () => {
      mockMembreService.getMembres.mockReturnValue(
        throwError(() => ({ status: 500, error: { message: 'Erreur réseau' } }))
      );

      component.loadMembres();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Erreur réseau');
      expect(mockToast.error).toHaveBeenCalledWith('Erreur', 'Erreur réseau');
    });
  });
});
