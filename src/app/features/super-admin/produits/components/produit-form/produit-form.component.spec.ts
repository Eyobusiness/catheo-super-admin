import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProduitFormComponent } from './produit-form.component';
import { Produit } from '../../models/produit.model';

describe('ProduitFormComponent', () => {
  let component: ProduitFormComponent;
  let fixture: ComponentFixture<ProduitFormComponent>;

  const mockProduit: Produit = {
    id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
    id_interne: 1,
    code: 'CATHEO',
    nom: 'CATHEO',
    description: 'Gestion de la catéchèse',
    icone: 'book-open',
    statut: 'actif',
    created_at: '',
    updated_at: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProduitFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with default values', () => {
    expect(component).toBeTruthy();
    expect(component['form'].get('statut')?.value).toBe('actif');
    expect(component['form'].get('code')?.value).toBe('');
    expect(component['form'].get('nom')?.value).toBe('');
  });

  it('should invalidate empty form', () => {
    expect(component['form'].valid).toBe(false);
    component.onSubmit();
    expect(component['form'].get('code')?.touched).toBe(true);
    expect(component['form'].get('nom')?.touched).toBe(true);
  });

  it('should emit formSubmit when form is valid', () => {
    const emitSpy = vi.spyOn(component.formSubmit, 'emit');

    component['form'].patchValue({
      code: 'catheo',
      nom: 'CATHEO Module',
      description: 'Description module',
      icone: 'book',
      statut: 'actif',
    });

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      code: 'CATHEO',
      nom: 'CATHEO Module',
      description: 'Description module',
      icone: 'book',
      statut: 'actif',
    });
  });

  it('should emit formCancel when cancel is clicked', () => {
    const cancelSpy = vi.spyOn(component.formCancel, 'emit');
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
