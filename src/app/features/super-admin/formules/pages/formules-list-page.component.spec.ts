import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { FormulesListPageComponent } from './formules-list-page.component';
import { FormuleService } from '../services/formule.service';
import { ProduitService } from '../../produits/services/produit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Formule } from '../models/formule.model';
import { Produit } from '../../produits/models/produit.model';

describe('FormulesListPageComponent', () => {
  let component: FormulesListPageComponent;
  let fixture: ComponentFixture<FormulesListPageComponent>;
  let formuleServiceMock: {
    getFormules: ReturnType<typeof vi.fn>;
    toggleStatus: ReturnType<typeof vi.fn>;
    deleteFormule: ReturnType<typeof vi.fn>;
  };
  let produitServiceMock: {
    getProduits: ReturnType<typeof vi.fn>;
  };
  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockFormules: Formule[] = [
    {
      id: 1,
      uuid: 'uuid-1',
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'CATHEO-STANDARD',
      nom: 'Formule Annuelle Standard',
      description: 'Accès catéchèse',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      ordre: 1,
      produit: {
        id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
        code: 'CATHEO',
        nom: 'CATHEO',
      },
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
  ];

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
    formuleServiceMock = {
      getFormules: vi.fn().mockReturnValue(
        of({
          data: mockFormules,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
      toggleStatus: vi.fn().mockReturnValue(
        of({ ...mockFormules[0], statut: 'inactif' })
      ),
      deleteFormule: vi.fn().mockReturnValue(of(undefined)),
    };

    produitServiceMock = {
      getProduits: vi.fn().mockReturnValue(
        of({
          data: mockProduits,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FormulesListPageComponent],
      providers: [
        provideRouter([]),
        { provide: FormuleService, useValue: formuleServiceMock },
        { provide: ProduitService, useValue: produitServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormulesListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load formules and produits', () => {
    expect(component).toBeTruthy();
    expect(formuleServiceMock.getFormules).toHaveBeenCalled();
    expect(produitServiceMock.getProduits).toHaveBeenCalled();
    expect(component['produitsList']().length).toBe(1);
  });

  it('should filter by produit', () => {
    const event = {
      target: { value: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c' },
    } as unknown as Event;

    component['onProduitFilterChange'](event);
    expect(component['filterProduitId']()).toBe('5d4abf19-4248-4aaf-b18b-63ac2df57d9c');
    expect(formuleServiceMock.getFormules).toHaveBeenCalled();
  });

  it('should filter by gratuite', () => {
    const event = {
      target: { value: 'gratuite' },
    } as unknown as Event;

    component['onGratuiteFilterChange'](event);
    expect(component['filterGratuite']()).toBe('gratuite');
    expect(formuleServiceMock.getFormules).toHaveBeenCalled();
  });

  it('should filter by statut', () => {
    const event = {
      target: { value: 'actif' },
    } as unknown as Event;

    component['onStatutFilterChange'](event);
    expect(component['filterStatut']()).toBe('actif');
    expect(formuleServiceMock.getFormules).toHaveBeenCalled();
  });

  it('should prompt and delete formule on confirmation', () => {
    component['promptDelete'](mockFormules[0]);

    expect(component['confirmDialogOpen']()).toBe(true);
    expect(component['confirmTitle']()).toContain('Supprimer');

    component['executeConfirmedAction']();

    expect(formuleServiceMock.deleteFormule).toHaveBeenCalledWith(mockFormules[0].id);
    expect(toastMock.success).toHaveBeenCalledWith('Suppression réussie', 'Formule supprimée avec succès.');
  });

  it('should format produit column properly with produit_nom or relation', () => {
    const col = component['columns'].find((c) => c.key === 'produit');
    expect(col).toBeDefined();
    expect(col?.formatter?.(null, mockFormules[0])).toBe('CATHEO');
    const fWithNom: Formule = {
      ...mockFormules[0],
      produit: undefined,
      produit_nom: 'OPPE',
      produit_code: 'OPPE',
    };
    expect(col?.formatter?.(null, fWithNom)).toBe('OPPE');
  });
});
