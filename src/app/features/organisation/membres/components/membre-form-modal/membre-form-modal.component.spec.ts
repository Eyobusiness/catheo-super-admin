import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MembreFormModalComponent } from './membre-form-modal.component';
import { MembreService } from '../../services/membre.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Membre } from '../../models/membre.model';

describe('MembreFormModalComponent', () => {
  let component: MembreFormModalComponent;
  let fixture: ComponentFixture<MembreFormModalComponent>;
  let mockMembreService: {
    createMembre: ReturnType<typeof vi.fn>;
    updateMembre: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockMembre: Membre = {
    id: 'uuid-membre-1',
    id_interne: 1,
    nom: 'KOUASSI',
    prenoms: 'Jean',
    nom_complet: 'KOUASSI Jean',
    sexe: 'M',
    date_naissance: '1988-04-12',
    telephone: '0102030405',
    email: 'jean.kouassi@catheo.ci',
    quartier: 'Plateau',
    adresse: 'Avenue Chardy',
    fonction: 'Trésorier',
    date_entree: '2022-01-10',
    statut: 'actif',
    photo_path: null,
    observation: 'Actif et ponctuel',
    created_at: '2022-01-10T10:00:00Z',
    updated_at: '2022-01-10T10:00:00Z',
  };

  beforeEach(async () => {
    mockMembreService = {
      createMembre: vi.fn(),
      updateMembre: vi.fn(),
    };
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MembreFormModalComponent],
      providers: [
        { provide: MembreService, useValue: mockMembreService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MembreFormModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('membre', null);
    fixture.detectChanges();
  });

  it('should create in creation mode by default', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(false);
    expect(component.modalTitle()).toBe('Nouveau Membre de l’Équipe');
  });

  it('should initialize form with membre values in edit mode', () => {
    fixture.componentRef.setInput('membre', mockMembre);
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.modalTitle()).toBe('Modifier la Fiche Membre');
    expect(component.form.get('nom')?.value).toBe('KOUASSI');
    expect(component.form.get('prenoms')?.value).toBe('Jean');
    expect(component.form.get('telephone')?.value).toBe('0102030405');
    expect(component.form.get('fonction')?.value).toBe('Trésorier');
  });

  it('should not submit if required fields are missing', () => {
    component.form.patchValue({ nom: '', prenoms: '', sexe: 'M' });
    component.onSubmit();

    expect(mockMembreService.createMembre).not.toHaveBeenCalled();
    expect(component.getFieldError('nom')).toBeTruthy();
    expect(component.getFieldError('prenoms')).toBeTruthy();
  });

  it('should create membre when form is valid', () => {
    const savedSpy = vi.spyOn(component.saved, 'emit');
    mockMembreService.createMembre.mockReturnValue(of(mockMembre));

    component.form.patchValue({
      nom: 'KOUASSI',
      prenoms: 'Jean',
      sexe: 'M',
      telephone: '0102030405',
      statut: 'actif',
    });

    component.onSubmit();

    expect(mockMembreService.createMembre).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: 'KOUASSI',
        prenoms: 'Jean',
        sexe: 'M',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      'Membre ajouté',
      'KOUASSI Jean a été enregistré avec succès.'
    );
    expect(savedSpy).toHaveBeenCalledWith(mockMembre);
  });

  it('should update membre in edit mode', () => {
    fixture.componentRef.setInput('membre', mockMembre);
    fixture.detectChanges();

    const savedSpy = vi.spyOn(component.saved, 'emit');
    mockMembreService.updateMembre.mockReturnValue(of(mockMembre));

    component.form.patchValue({
      nom: 'KOUASSI MODIFIE',
    });

    component.onSubmit();

    expect(mockMembreService.updateMembre).toHaveBeenCalledWith(
      'uuid-membre-1',
      expect.objectContaining({
        nom: 'KOUASSI MODIFIE',
      })
    );
    expect(mockToast.success).toHaveBeenCalledWith(
      'Membre mis à jour',
      'KOUASSI Jean a été mis à jour avec succès.'
    );
    expect(savedSpy).toHaveBeenCalledWith(mockMembre);
  });

  it('should handle 422 validation errors from backend', () => {
    mockMembreService.createMembre.mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          message: 'Données invalides',
          errors: {
            telephone: ['Le format du numéro de téléphone est invalide.'],
          },
        },
      }))
    );

    component.form.patchValue({
      nom: 'KOUASSI',
      prenoms: 'Jean',
      sexe: 'M',
      telephone: '123',
    });

    component.onSubmit();

    expect(component.getFieldError('telephone')).toBe('Le format du numéro de téléphone est invalide.');
    expect(component.generalError()).toBe('Données invalides');
  });

  it('should handle general server error 500', () => {
    mockMembreService.createMembre.mockReturnValue(
      throwError(() => ({
        status: 500,
        error: { message: 'Erreur interne du serveur' },
      }))
    );

    component.form.patchValue({
      nom: 'KOUASSI',
      prenoms: 'Jean',
      sexe: 'M',
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
