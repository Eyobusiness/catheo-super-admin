import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganisationDetailPageComponent } from './organisation-detail-page.component';
import { SuperAdminOrganisationService } from '../services/super-admin-organisation.service';
import { OrganisationUserService } from '../services/organisation-user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../models/super-admin-organisation.model';
import {
  OrganisationProfil,
  OrganisationUser,
} from '../models/organisation-user.model';

describe('OrganisationDetailPageComponent', () => {
  let fixture: ComponentFixture<OrganisationDetailPageComponent>;
  let component: OrganisationDetailPageComponent;
  let mockOrgService: {
    getOrganisation: ReturnType<typeof vi.fn>;
    updateOrganisationInfo: ReturnType<typeof vi.fn>;
    provisionResponsable: ReturnType<typeof vi.fn>;
  };
  let mockUserService: {
    getUsers: ReturnType<typeof vi.fn>;
    getProfils: ReturnType<typeof vi.fn>;
    toggleStatus: ReturnType<typeof vi.fn>;
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    show: ReturnType<typeof vi.fn>;
  };

  const mockOrg: SuperAdminOrganisation = {
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
    email: 'contact@oppe-cim.ci',
    telephone: '+22501000000',
    adresse: 'Bâtiment Pastoral',
    users_count: 2,
  };

  const mockUsers: OrganisationUser[] = [
    {
      id: 10,
      name: 'Abbé Paul',
      email: 'paul@catheo.org',
      statut: 'actif',
      organisation_id: 1,
      profil: { id: 1, code: 'RESPONSABLE_OPPE', libelle: 'Responsable OPPE' },
    },
    {
      id: 11,
      name: 'Marie Koffi',
      email: 'marie@catheo.org',
      statut: 'inactif',
      organisation_id: 1,
      profil: { id: 2, code: 'UTILISATEUR_OPPE', libelle: 'Utilisateur OPPE' },
    },
  ];

  const mockProfils: OrganisationProfil[] = [
    { id: 1, code: 'RESPONSABLE_OPPE', libelle: 'Responsable OPPE' },
    { id: 2, code: 'UTILISATEUR_OPPE', libelle: 'Utilisateur OPPE' },
  ];

  beforeEach(async () => {
    mockOrgService = {
      getOrganisation: vi.fn().mockReturnValue(of(mockOrg)),
      updateOrganisationInfo: vi.fn().mockReturnValue(of(mockOrg)),
      provisionResponsable: vi.fn(),
    };

    mockUserService = {
      getUsers: vi.fn().mockReturnValue(
        of({
          data: mockUsers,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
        })
      ),
      getProfils: vi.fn().mockReturnValue(of(mockProfils)),
      toggleStatus: vi.fn().mockReturnValue(of({ success: true })),
      createUser: vi.fn(),
      updateUser: vi.fn(),
    };

    mockToast = {
      show: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganisationDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
          },
        },
        { provide: SuperAdminOrganisationService, useValue: mockOrgService },
        { provide: OrganisationUserService, useValue: mockUserService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait charger les détails de l’organisation et la liste des utilisateurs', () => {
    expect(component).toBeTruthy();
    expect(mockOrgService.getOrganisation).toHaveBeenCalledWith('1');
    expect(mockUserService.getUsers).toHaveBeenCalledWith(1);
    expect(mockUserService.getProfils).toHaveBeenCalledWith(1);

    expect(component['organisation']()).toEqual(mockOrg);
    expect(component['users']().length).toBe(2);
  });

  it('devrait ouvrir les modales d’édition, de responsable et de création utilisateur', () => {
    component.openEditModal();
    expect(component['isEditModalOpen']()).toBe(true);

    component.openResponsableModal();
    expect(component['isResponsableModalOpen']()).toBe(true);

    component.openCreateUserModal();
    expect(component['isUserModalOpen']()).toBe(true);
    expect(component['selectedUserToEdit']()).toBeNull();

    component.openEditUserModal(mockUsers[0]);
    expect(component['isUserModalOpen']()).toBe(true);
    expect(component['selectedUserToEdit']()).toEqual(mockUsers[0]);
  });

  it('devrait déclencher le changement de statut avec confirmation', () => {
    const user = mockUsers[0];
    component.promptToggleStatus(user);

    expect(component['isConfirmToggleOpen']()).toBe(true);
    expect(component['userToToggle']()).toEqual(user);

    component.confirmToggleStatus();

    expect(mockUserService.toggleStatus).toHaveBeenCalledWith(1, user.id);
    expect(mockToast.show).toHaveBeenCalledWith(
      'success',
      'Statut modifié',
      expect.stringContaining(user.name)
    );
  });

  it('devrait gérer l’erreur 404 lors du chargement de l’organisation', () => {
    mockOrgService.getOrganisation.mockReturnValue(
      throwError(() => ({ status: 404, error: { message: 'Introuvable' } }))
    );

    component.loadData();

    expect(component['errorOrg']()).toBe(true);
    expect(component['errorOrgMessage']()).toContain('n’existe pas');
  });
});
