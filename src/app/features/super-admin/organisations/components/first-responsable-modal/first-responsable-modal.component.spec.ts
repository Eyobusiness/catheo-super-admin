import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirstResponsableModalComponent } from './first-responsable-modal.component';
import { SuperAdminOrganisationService } from '../../services/super-admin-organisation.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';

describe('FirstResponsableModalComponent', () => {
  let component: FirstResponsableModalComponent;
  let fixture: ComponentFixture<FirstResponsableModalComponent>;
  let mockOrgService: {
    provisionResponsable: ReturnType<typeof vi.fn>;
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
  };

  beforeEach(() => {
    mockOrgService = {
      provisionResponsable: vi.fn(),
    };
    mockToast = {
      show: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [FirstResponsableModalComponent],
      providers: [
        { provide: SuperAdminOrganisationService, useValue: mockOrgService },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    fixture = TestBed.createComponent(FirstResponsableModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('organisation', mockOrg);
    fixture.detectChanges();
  });

  it('devrait être initialisé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait valider les champs obligatoires (nom, email)', () => {
    component['form'].setValue({
      name: '',
      email: 'invalide',
      telephone: '',
      password: 'court',
    });

    expect(component['form'].valid).toBe(false);
    expect(component['form'].get('name')?.valid).toBe(false);
    expect(component['form'].get('email')?.valid).toBe(false);
    expect(component['form'].get('password')?.valid).toBe(false);
  });

  it('devrait soumettre avec succès et émettre responsableCreated', () => {
    const emitSpy = vi.spyOn(component.responsableCreated, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    mockOrgService.provisionResponsable.mockReturnValue(
      of({ id: 99, name: 'Abbé Paul', email: 'paul@catheo.org' })
    );

    component['form'].setValue({
      name: 'Abbé Paul',
      email: 'paul@catheo.org',
      telephone: '+22507000000',
      password: 'password123',
    });

    component['onSubmit']();

    expect(mockOrgService.provisionResponsable).toHaveBeenCalledWith(1, {
      name: 'Abbé Paul',
      email: 'paul@catheo.org',
      telephone: '+22507000000',
      password: 'password123',
    });
    expect(mockToast.show).toHaveBeenCalledWith(
      'success',
      'Premier responsable provisionné',
      expect.any(String)
    );
    expect(emitSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('devrait afficher les erreurs de validation 422 renvoyées par Laravel', () => {
    mockOrgService.provisionResponsable.mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          message: 'Données invalides',
          errors: { email: ['Cet email est déjà pris.'] },
        },
      }))
    );

    component['form'].setValue({
      name: 'Abbé Paul',
      email: 'existant@catheo.org',
      telephone: '',
      password: '',
    });

    component['onSubmit']();

    expect(component['validationErrors']()['email'][0]).toBe('Cet email est déjà pris.');
    expect(component['generalError']()).toBe('Données invalides');
  });
});
