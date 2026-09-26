import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { FormuleFormComponent } from './formule-form.component';
import { ProduitService } from '../../../produits/services/produit.service';
import { Produit } from '../../../produits/models/produit.model';

describe('FormuleFormComponent', () => {
  let component: FormuleFormComponent;
  let fixture: ComponentFixture<FormuleFormComponent>;
  let produitServiceMock: {
    getProduits: ReturnType<typeof vi.fn>;
  };

  const mockProduits: Produit[] = [
    {
      id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      id_interne: 1,
      code: 'CATHEO',
      nom: 'CATHEO',
      description: null,
      icone: null,
      statut: 'actif',
      created_at: '',
      updated_at: '',
    },
  ];

  beforeEach(async () => {
    produitServiceMock = {
      getProduits: vi.fn().mockReturnValue(
        of({
          data: mockProduits,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [FormuleFormComponent],
      providers: [
        { provide: ProduitService, useValue: produitServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormuleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load produits into select options', () => {
    expect(component).toBeTruthy();
    expect(produitServiceMock.getProduits).toHaveBeenCalledWith({ all: true });
    expect(component['produitOptions']().length).toBe(1);
    expect(component['produitOptions']()[0].label).toContain('CATHEO');
  });

  it('should handle est_gratuite toggle by setting montant to 0 and disabling control', () => {
    const estGratuiteCtrl = component['form'].get('est_gratuite');
    const montantCtrl = component['form'].get('montant');

    montantCtrl?.setValue(25000);
    expect(montantCtrl?.value).toBe(25000);

    estGratuiteCtrl?.setValue(true);
    component['onGratuiteChange']();

    expect(montantCtrl?.value).toBe(0);
    expect(montantCtrl?.disabled).toBe(true);
  });

  it('should invalidate when required fields are missing', () => {
    expect(component['form'].valid).toBe(false);
    component.onSubmit();
    expect(component['form'].get('code')?.touched).toBe(true);
    expect(component['form'].get('produit_id')?.touched).toBe(true);
  });

  it('should emit formSubmit with sanitized data when valid', () => {
    const emitSpy = vi.spyOn(component.formSubmit, 'emit');

    component['form'].patchValue({
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'catheo-annuel',
      nom: 'Formule Annuelle',
      description: 'Test desc',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      ordre: 1,
    });

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'CATHEO-ANNUEL',
      nom: 'Formule Annuelle',
      description: 'Test desc',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      ordre: 1,
    });
  });
});
