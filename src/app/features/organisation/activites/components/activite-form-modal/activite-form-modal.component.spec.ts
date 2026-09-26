import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActiviteFormModalComponent } from './activite-form-modal.component';
import { ActiviteService } from '../../services/activite.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Activite } from '../../models/activite.model';
import { Membre } from '../../../membres/models/membre.model';

describe('ActiviteFormModalComponent', () => {
  let component: ActiviteFormModalComponent;
  let fixture: ComponentFixture<ActiviteFormModalComponent>;
  let mockActiviteService: {
    createActivite: ReturnType<typeof vi.fn>;
    updateActivite: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockMembre: Membre = {
    id: 'uuid-membre-1',
    id_interne: 10,
    nom: 'KOUAME',
    prenoms: 'Jean-Marc',
    nom_complet: 'KOUAME Jean-Marc',
    sexe: 'M',
    fonction: 'Coordinateur',
    statut: 'actif',
  };

  const mockActivite: Activite = {
    id: 'uuid-activite-1',
    id_interne: 101,
    organisation_id: 1,
    code: 'ACT-2024-01',
    titre: 'Récollection paroissiale',
    description: 'Journée spirituelle',
    type_activite: 'Récollection',
    date_debut: '2024-11-15T08:30:00Z',
    date_fin: '2024-11-15T17:00:00Z',
    lieu: 'Salle polyvalente',
    responsable_id: 'uuid-membre-1',
    statut: 'planifiee',
    taux_execution: 20,
    observation: 'Prévoir livrets',
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockActiviteService = {
      createActivite: vi.fn(),
      updateActivite: vi.fn(),
    };
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ActiviteFormModalComponent],
      providers: [
        { provide: ActiviteService, useValue: mockActiviteService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiviteFormModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('activite', null);
    fixture.componentRef.setInput('membres', [mockMembre]);
    fixture.detectChanges();
  });

  it('should create in creation mode by default', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(false);
    expect(component.modalTitle()).toBe('Planifier une Nouvelle Activité');
    expect(component.responsableOptions().length).toBe(2); // 'Aucun...' + mockMembre
  });

  it('should initialize form with values in edit mode', () => {
    fixture.componentRef.setInput('activite', mockActivite);
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.modalTitle()).toBe('Modifier l’Activité Pastorale');
    expect(component.form.get('titre')?.value).toBe('Récollection paroissiale');
    expect(component.form.get('code')?.value).toBe('ACT-2024-01');
    expect(component.form.get('lieu')?.value).toBe('Salle polyvalente');
  });

  it('should not submit if required fields are missing', () => {
    component.form.patchValue({ titre: '', date_debut: '' });
    component.onSubmit();

    expect(mockActiviteService.createActivite).not.toHaveBeenCalled();
    expect(component.getFieldError('titre')).toBeTruthy();
    expect(component.getFieldError('date_debut')).toBeTruthy();
  });

  it('should create activite when form is valid', () => {
    const savedSpy = vi.spyOn(component.saved, 'emit');
    mockActiviteService.createActivite.mockReturnValue(of(mockActivite));

    component.form.patchValue({
      titre: 'Récollection paroissiale',
      date_debut: '2024-11-15T08:30',
      type_activite: 'Récollection',
      statut: 'planifiee',
    });

    component.onSubmit();

    expect(mockActiviteService.createActivite).toHaveBeenCalledWith(
      expect.objectContaining({
        titre: 'Récollection paroissiale',
        date_debut: '2024-11-15T08:30',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      'Activité créée',
      expect.stringContaining('Récollection paroissiale')
    );
    expect(savedSpy).toHaveBeenCalledWith(mockActivite);
  });

  it('should update activite in edit mode', () => {
    fixture.componentRef.setInput('activite', mockActivite);
    fixture.detectChanges();

    const savedSpy = vi.spyOn(component.saved, 'emit');
    mockActiviteService.updateActivite.mockReturnValue(of(mockActivite));

    component.form.patchValue({
      titre: 'Récollection mise à jour',
    });

    component.onSubmit();

    expect(mockActiviteService.updateActivite).toHaveBeenCalledWith(
      'uuid-activite-1',
      expect.objectContaining({
        titre: 'Récollection mise à jour',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      'Activité mise à jour',
      expect.stringContaining('Récollection paroissiale')
    );
    expect(savedSpy).toHaveBeenCalledWith(mockActivite);
  });

  it('should handle 422 validation errors from backend', () => {
    mockActiviteService.createActivite.mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          message: 'Données invalides',
          errors: {
            date_fin: ['La date de fin doit être postérieure ou égale à la date de début.'],
          },
        },
      }))
    );

    component.form.patchValue({
      titre: 'Test activité',
      date_debut: '2024-11-15T08:30',
    });

    component.onSubmit();

    expect(component.getFieldError('date_fin')).toBe(
      'La date de fin doit être postérieure ou égale à la date de début.'
    );
    expect(component.generalError()).toBe('Données invalides');
  });

  it('should handle 500 general server error', () => {
    mockActiviteService.createActivite.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: { message: 'Erreur interne du serveur' },
      }))
    );

    component.form.patchValue({
      titre: 'Test activité',
      date_debut: '2024-11-15T08:30',
    });

    component.onSubmit();

    expect(component.generalError()).toBe('Erreur interne du serveur');
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('should emit close on cancel', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onCancel();
    expect(closeSpy).toHaveBeenCalled();
  });
});
