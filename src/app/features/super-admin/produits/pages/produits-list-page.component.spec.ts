import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ProduitsListPageComponent } from './produits-list-page.component';
import { ProduitService } from '../services/produit.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Produit } from '../models/produit.model';

describe('ProduitsListPageComponent', () => {
  let component: ProduitsListPageComponent;
  let fixture: ComponentFixture<ProduitsListPageComponent>;
  let produitServiceMock: {
    getProduits: ReturnType<typeof vi.fn>;
    toggleStatus: ReturnType<typeof vi.fn>;
  };
  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockProduits: Produit[] = [
    {
      id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      id_interne: 1,
      code: 'CATHEO',
      nom: 'CATHEO',
      description: 'Gestion de la catéchèse paroissiale.',
      icone: 'book-open',
      statut: 'actif',
      formules_count: 2,
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
    {
      id: 'c6cc2b89-3f3e-48e1-b7a9-b29264b300a3',
      id_interne: 2,
      code: 'OPPE',
      nom: 'OPPE',
      description: 'Office Paroissial de la Pastorale des Enfants.',
      icone: 'smile',
      statut: 'inactif',
      formules_count: 0,
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
  ];

  beforeEach(async () => {
    produitServiceMock = {
      getProduits: vi.fn().mockReturnValue(
        of({
          data: mockProduits,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
        })
      ),
      toggleStatus: vi.fn().mockReturnValue(
        of({ ...mockProduits[0], statut: 'inactif' })
      ),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProduitsListPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProduitService, useValue: produitServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProduitsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial data', () => {
    expect(component).toBeTruthy();
    expect(produitServiceMock.getProduits).toHaveBeenCalled();
  });

  it('should update search term and trigger refresh', () => {
    component['onSearch']('CATHEO');
    expect(component['searchTerm']()).toBe('CATHEO');
    expect(produitServiceMock.getProduits).toHaveBeenCalled();
  });

  it('should filter by statut', () => {
    const event = {
      target: { value: 'actif' },
    } as unknown as Event;

    component['onStatutFilterChange'](event);
    expect(component['filterStatut']()).toBe('actif');
    expect(produitServiceMock.getProduits).toHaveBeenCalled();
  });

  it('should reset filters properly', () => {
    component['searchTerm'].set('test');
    component['filterStatut'].set('actif');

    component['onResetFilters']();

    expect(component['searchTerm']()).toBe('');
    expect(component['filterStatut']()).toBe('tous');
  });

  it('should handle API error gracefully', () => {
    produitServiceMock.getProduits.mockReturnValue(
      throwError(() => new Error('API down'))
    );

    component.refresh();

    expect(component['hasError']()).toBe(true);
    expect(component['loading']()).toBe(false);
  });

  it('should prompt status change and open confirmation dialog', () => {
    component['promptStatusChange'](mockProduits[0], 'inactif');

    expect(component['confirmDialogOpen']()).toBe(true);
    expect(component['confirmTitle']()).toContain('Désactiver');
  });

  it('should execute status change on confirmation and display success toast', () => {
    component['promptStatusChange'](mockProduits[0], 'inactif');
    component['executeStatusChange']();

    expect(produitServiceMock.toggleStatus).toHaveBeenCalledWith(mockProduits[0].id);
    expect(toastMock.success).toHaveBeenCalled();
    expect(component['confirmDialogOpen']()).toBe(false);
  });
});
