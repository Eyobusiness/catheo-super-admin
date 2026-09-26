import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { OrganisationsListPageComponent } from './organisations-list-page.component';
import { SuperAdminOrganisationService } from '../services/super-admin-organisation.service';
import { SuperAdminOrganisation } from '../models/super-admin-organisation.model';

describe('OrganisationsListPageComponent', () => {
  let fixture: ComponentFixture<OrganisationsListPageComponent>;
  let component: OrganisationsListPageComponent;
  let mockOrgService: {
    getOrganisations: ReturnType<typeof vi.fn>;
    provisionResponsable: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockOrganisations: SuperAdminOrganisation[] = [
    {
      id: 1,
      uuid: 'org-uuid-1',
      code: 'OPPE-CIM',
      nom: 'Enfance Missionnaire',
      type_organisation: 'OPPE',
      statut: 'actif',
      paroisse: {
        id: 10,
        nom_paroisse: 'Coeur Immaculé',
        diocese: 'Abidjan',
      },
      produit: {
        id: 2,
        code: 'OPPE',
        nom: 'Office Paroissial de la Pastorale des Enfants',
      },
      responsable_nom: 'Abbé Paul',
      users_count: 4,
    },
    {
      id: 2,
      uuid: 'org-uuid-2',
      code: 'OPPJ-SJE',
      nom: 'Jeunesse Paroissiale Saint Jean',
      type_organisation: 'OPPJ',
      statut: 'actif',
      paroisse: {
        id: 11,
        nom_paroisse: 'Saint Jean',
        diocese: 'Cocody',
      },
      produit: {
        id: 3,
        code: 'OPPJ',
        nom: 'Office Paroissial de la Pastorale des Jeunes',
      },
      users_count: 2,
    },
  ];

  beforeEach(async () => {
    mockOrgService = {
      getOrganisations: vi.fn().mockReturnValue(
        of({
          data: mockOrganisations,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
        })
      ),
      provisionResponsable: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganisationsListPageComponent],
      providers: [
        provideRouter([]),
        { provide: SuperAdminOrganisationService, useValue: mockOrgService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(OrganisationsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé et charger les organisations initiales', () => {
    expect(component).toBeTruthy();
    expect(mockOrgService.getOrganisations).toHaveBeenCalled();
    expect(component['organisations']().length).toBe(2);
  });

  it('devrait filtrer par recherche', () => {
    component.onSearchChange('Enfance');

    expect(component['filterSearch']()).toBe('Enfance');
    expect(mockOrgService.getOrganisations).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Enfance', page: 1 })
    );
  });

  it('devrait filtrer par type d’organisation (OPPE / OPPJ / OPPA)', () => {
    const event = { target: { value: 'OPPJ' } } as unknown as Event;
    component.onTypeFilterChange(event);

    expect(component['filterType']()).toBe('OPPJ');
    expect(mockOrgService.getOrganisations).toHaveBeenCalledWith(
      expect.objectContaining({ type_organisation: 'OPPJ', page: 1 })
    );
  });

  it('devrait filtrer par statut (actif / inactif / suspendu)', () => {
    const event = { target: { value: 'suspendu' } } as unknown as Event;
    component.onStatutFilterChange(event);

    expect(component['filterStatut']()).toBe('suspendu');
    expect(mockOrgService.getOrganisations).toHaveBeenCalledWith(
      expect.objectContaining({ statut: 'suspendu', page: 1 })
    );
  });

  it('devrait réinitialiser les filtres', () => {
    component['filterSearch'].set('test');
    component['filterType'].set('OPPA');
    component['filterStatut'].set('inactif');

    component.onResetFilters();

    expect(component['filterSearch']()).toBe('');
    expect(component['filterType']()).toBe('tous');
    expect(component['filterStatut']()).toBe('tous');
  });

  it('devrait gérer la pagination', () => {
    mockOrgService.getOrganisations.mockReturnValue(
      of({
        data: mockOrganisations,
        meta: { current_page: 2, last_page: 5, per_page: 10, total: 50 },
      })
    );

    component.onPageChange({ page: 2, perPage: 10 });

    expect(component['currentPage']()).toBe(2);
    expect(component['perPage']()).toBe(10);
    expect(mockOrgService.getOrganisations).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, per_page: 10 })
    );
  });

  it('devrait naviguer vers la page de détail', () => {
    component.navigateToDetail(1);

    expect(router.navigate).toHaveBeenCalledWith(['/super-admin/organisations', 1]);
  });

  it('devrait ouvrir et fermer la modale premier responsable', () => {
    component.openResponsableModal(mockOrganisations[0]);

    expect(component['isResponsableModalOpen']()).toBe(true);
    expect(component['selectedOrgForResponsable']()).toEqual(mockOrganisations[0]);

    component.closeResponsableModal();

    expect(component['isResponsableModalOpen']()).toBe(false);
    expect(component['selectedOrgForResponsable']()).toBeNull();
  });

  it('devrait afficher l’état d’erreur en cas d’échec API', () => {
    mockOrgService.getOrganisations.mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Accès interdit' } }))
    );

    component.refresh();

    expect(component['hasError']()).toBe(true);
    expect(component['errorMessage']()).toContain('Privilèges Super Admin requis');
  });
});
