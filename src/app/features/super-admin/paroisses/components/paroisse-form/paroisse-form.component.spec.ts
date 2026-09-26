import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParoisseFormComponent } from './paroisse-form.component';
import { ParoisseDetail } from '../../models/paroisse.model';

describe('ParoisseFormComponent', () => {
  let component: ParoisseFormComponent;
  let fixture: ComponentFixture<ParoisseFormComponent>;

  const sampleData: ParoisseDetail = {
    id: 'uuid-1',
    id_interne: 1,
    nom_paroisse: 'Paroisse Test',
    code_paroisse: 'PT-01',
    statut: 'actif',
    diocese: 'Diocèse Test',
    doyenne: 'Doyenné Test',
    ville: 'Abidjan',
    commune: 'Cocody',
    adresse: 'Rue des Jardins',
    telephone: '0707070707',
    email: 'test@paroisse.ci',
    site_web: 'https://test.ci',
    prefixe_matricule: 'PT',
    prefixe_recu: 'REC',
    cure_nom: 'Père Test',
    coordination_nom: 'Coordination Test',
    total_abonnements: 0,
    produits_souscrits: [],
    created_at: '2026-09-19T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParoisseFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoisseFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize form with empty values by default', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component['form'].get('nom_paroisse')?.value).toBe('');
    expect(component['form'].get('statut')?.value).toBe('actif');
  });

  it('should populate form when initialData is provided', () => {
    fixture.componentRef.setInput('initialData', sampleData);
    fixture.detectChanges();

    expect(component['form'].get('nom_paroisse')?.value).toBe('Paroisse Test');
    expect(component['form'].get('code_paroisse')?.value).toBe('PT-01');
    expect(component['form'].get('diocese')?.value).toBe('Diocèse Test');
    expect(component['form'].get('telephone')?.value).toBe('0707070707');
    expect(component['form'].get('cure_nom')?.value).toBe('Père Test');
  });

  it('should validate required fields on submit', () => {
    fixture.detectChanges();

    const submitSpy = vi.fn();
    component.formSubmit.subscribe(submitSpy);

    component.onSubmit();

    expect(component['form'].valid).toBe(false);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(component['form'].get('nom_paroisse')?.touched).toBe(true);
  });

  it('should emit formSubmit with values when form is valid', () => {
    fixture.componentRef.setInput('initialData', sampleData);
    fixture.detectChanges();

    const submitSpy = vi.fn();
    component.formSubmit.subscribe(submitSpy);

    component.onSubmit();

    expect(component['form'].valid).toBe(true);
    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        nom_paroisse: 'Paroisse Test',
        code_paroisse: 'PT-01',
      })
    );
  });

  it('should emit formCancel when cancel is clicked', () => {
    fixture.detectChanges();

    const cancelSpy = vi.fn();
    component.formCancel.subscribe(cancelSpy);

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
