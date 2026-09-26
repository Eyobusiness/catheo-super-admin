import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganisationUserModalComponent } from './organisation-user-modal.component';
import { OrganisationUserService } from '../../services/organisation-user.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';
import {
  OrganisationProfil,
  OrganisationUser,
} from '../../models/organisation-user.model';

describe('OrganisationUserModalComponent', () => {
  let component: OrganisationUserModalComponent;
  let fixture: ComponentFixture<OrganisationUserModalComponent>;
  let mockUserService: {
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    show: ReturnType<typeof vi.fn>;
  };

  const mockOrgOPPE: SuperAdminOrganisation = {
    id: 1,
    code: 'OPPE-CIM',
    nom: 'Enfance Missionnaire',
    type_organisation: 'OPPE',
    statut: 'actif',
  };

  const mockProfils: OrganisationProfil[] = [
    { id: 1, code: 'RESPONSABLE_OPPE', libelle: 'Responsable OPPE' },
    { id: 2, code: 'UTILISATEUR_OPPE', libelle: 'Utilisateur OPPE' },
    { id: 3, code: 'RESPONSABLE_OPPJ', libelle: 'Responsable OPPJ' },
    { id: 4, code: 'RESPONSABLE_OPPA', libelle: 'Responsable OPPA' },
  ];

  beforeEach(() => {
    mockUserService = {
      createUser: vi.fn(),
      updateUser: vi.fn(),
    };
    mockToast = {
      show: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [OrganisationUserModalComponent],
      providers: [
        { provide: OrganisationUserService, useValue: mockUserService },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    fixture = TestBed.createComponent(OrganisationUserModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('organisation', mockOrgOPPE);
    fixture.componentRef.setInput('availableProfils', mockProfils);
    fixture.detectChanges();
  });

  it('devrait être initialisé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait filtrer strictement les profils pour n’afficher QUE ceux compatibles avec le type OPPE', () => {
    const options = component['profilOptions']();
    // Doit contenir uniquement RESPONSABLE_OPPE et UTILISATEUR_OPPE
    expect(options.length).toBe(2);
    expect(options.some((o) => o.label.includes('OPPJ'))).toBe(false);
    expect(options.some((o) => o.label.includes('OPPA'))).toBe(false);
    expect(options.some((o) => o.label.includes('OPPE'))).toBe(true);
  });

  it('devrait filtrer strictement les profils pour n’afficher QUE ceux compatibles avec le type OPPJ', () => {
    const mockOrgOPPJ: SuperAdminOrganisation = {
      id: 2,
      code: 'OPPJ-YOP',
      nom: 'Jeunesse Yopougon',
      type_organisation: 'OPPJ',
      statut: 'actif',
    };
    fixture.componentRef.setInput('organisation', mockOrgOPPJ);
    fixture.detectChanges();

    const options = component['profilOptions']();
    expect(options.length).toBe(1);
    expect(options.every((o) => o.label.includes('OPPJ'))).toBe(true);
    expect(options.some((o) => o.label.includes('OPPE'))).toBe(false);
  });

  it('devrait créer un utilisateur et émettre userSaved', () => {
    const emitSpy = vi.spyOn(component.userSaved, 'emit');
    const createdUser: OrganisationUser = {
      id: 50,
      name: 'Nouveau Membre',
      email: 'nouveau@catheo.org',
      statut: 'actif',
      organisation_id: 1,
      profil_id: 2,
    };

    mockUserService.createUser.mockReturnValue(of(createdUser));

    component['form'].setValue({
      name: 'Nouveau Membre',
      email: 'nouveau@catheo.org',
      telephone: '+22501000000',
      profil_id: 2,
      password: 'password123',
      statut: 'actif',
    });

    component['onSubmit']();

    expect(mockUserService.createUser).toHaveBeenCalledWith(1, {
      name: 'Nouveau Membre',
      email: 'nouveau@catheo.org',
      telephone: '+22501000000',
      profil_id: 2,
      password: 'password123',
      statut: 'actif',
    });
    expect(emitSpy).toHaveBeenCalledWith(createdUser);
  });

  it('devrait modifier un utilisateur en mode édition', () => {
    const existingUser: OrganisationUser = {
      id: 77,
      name: 'Paul Ancien',
      email: 'paul@catheo.org',
      telephone: '+22507000000',
      statut: 'actif',
      profil_id: 1,
    };

    fixture.componentRef.setInput('userToEdit', existingUser);
    fixture.detectChanges();

    mockUserService.updateUser.mockReturnValue(
      of({ ...existingUser, name: 'Paul Modifie' })
    );

    component['form'].patchValue({
      name: 'Paul Modifie',
    });

    component['onSubmit']();

    expect(mockUserService.updateUser).toHaveBeenCalledWith(
      1,
      77,
      expect.objectContaining({ name: 'Paul Modifie' })
    );
  });
});
