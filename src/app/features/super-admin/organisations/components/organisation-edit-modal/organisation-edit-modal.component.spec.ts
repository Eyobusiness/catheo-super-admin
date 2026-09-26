import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganisationEditModalComponent } from './organisation-edit-modal.component';
import { SuperAdminOrganisationService } from '../../services/super-admin-organisation.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';

describe('OrganisationEditModalComponent', () => {
  let component: OrganisationEditModalComponent;
  let fixture: ComponentFixture<OrganisationEditModalComponent>;
  let mockOrgService: {
    updateOrganisationInfo: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    show: ReturnType<typeof vi.fn>;
  };

  const mockOrg: SuperAdminOrganisation = {
    id: 1,
    code: 'OPPE-CIM',
    nom: 'Enfance Missionnaire',
    type_organisation: 'OPPE',
    statut: 'actif',
    email: 'contact@oppe.ci',
    telephone: '+22501000000',
    adresse: 'Bâtiment Pastoral',
    description: 'Activités pastorales enfance',
    responsable_nom: 'Abbé Paul',
  };

  beforeEach(() => {
    mockOrgService = {
      updateOrganisationInfo: vi.fn(),
    };
    mockToast = {
      show: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [OrganisationEditModalComponent],
      providers: [
        { provide: SuperAdminOrganisationService, useValue: mockOrgService },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    fixture = TestBed.createComponent(OrganisationEditModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('organisation', mockOrg);
    fixture.detectChanges();
  });

  it('devrait pré-remplir le formulaire avec les informations actuelles', () => {
    expect(component).toBeTruthy();
    expect(component['form'].get('nom')?.value).toBe('Enfance Missionnaire');
    expect(component['form'].get('email')?.value).toBe('contact@oppe.ci');
    expect(component['form'].get('responsable_nom')?.value).toBe('Abbé Paul');
  });

  it('devrait appeler updateOrganisationInfo lors de la soumission valide', () => {
    const emitSpy = vi.spyOn(component.organisationUpdated, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    mockOrgService.updateOrganisationInfo.mockReturnValue(
      of({ ...mockOrg, nom: 'Nouveau Nom Modifié' })
    );

    component['form'].patchValue({
      nom: 'Nouveau Nom Modifié',
      email: 'nouveau@oppe.ci',
    });

    component['onSubmit']();

    expect(mockOrgService.updateOrganisationInfo).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        nom: 'Nouveau Nom Modifié',
        email: 'nouveau@oppe.ci',
      })
    );
    expect(mockToast.show).toHaveBeenCalledWith(
      'success',
      'Organisation mise à jour',
      expect.any(String)
    );
    expect(emitSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
