import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ParoissesListPageComponent } from './paroisses-list-page.component';
import { ParoisseService } from '../services/paroisse.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Paroisse } from '../models/paroisse.model';

describe('ParoissesListPageComponent', () => {
  let component: ParoissesListPageComponent;
  let fixture: ComponentFixture<ParoissesListPageComponent>;
  let paroisseServiceMock: {
    getParoisses: ReturnType<typeof vi.fn>;
    changeStatus: ReturnType<typeof vi.fn>;
  };
  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockParoisses: Paroisse[] = [
    {
      id: 'p-1',
      id_interne: 1,
      nom_paroisse: 'Paroisse Saint Joseph',
      code_paroisse: 'PSJ-01',
      diocese: 'Diocèse de Yopougon',
      doyenne: 'Doyenné Ouest',
      ville: 'Abidjan',
      commune: 'Yopougon',
      telephone: '0505050505',
      email: 'psj@catheo.ci',
      statut: 'actif',
      total_abonnements: 1,
      produits_souscrits: [
        {
          produit_code: 'CATHEO_PASTORALE',
          produit_nom: 'CATHEO PASTORALE',
          formule_nom: 'Standard',
          date_fin: '2027-01-01',
        },
      ],
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'p-2',
      id_interne: 2,
      nom_paroisse: 'Paroisse Sainte Anne',
      code_paroisse: 'PSA-01',
      diocese: 'Archidiocèse d\'Abidjan',
      doyenne: 'Doyenné Centre',
      ville: 'Abidjan',
      commune: 'Port-Bouët',
      telephone: null,
      email: null,
      statut: 'suspendu',
      total_abonnements: 0,
      produits_souscrits: [],
      created_at: '2026-09-05T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    paroisseServiceMock = {
      getParoisses: vi.fn().mockReturnValue(
        of({
          data: mockParoisses,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
        })
      ),
      changeStatus: vi.fn().mockReturnValue(of({ status: 'success' })),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ParoissesListPageComponent],
      providers: [
        provideRouter([]),
        { provide: ParoisseService, useValue: paroisseServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoissesListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create and load paroisses on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(paroisseServiceMock.getParoisses).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Paroisses');
    expect(compiled.textContent).toContain('Paroisse Saint Joseph');
    expect(compiled.textContent).toContain('Paroisse Sainte Anne');
  });

  it('should handle search term change and reset page to 1', () => {
    fixture.detectChanges();

    component['onSearch']('Joseph');
    expect(component['filterSearch']()).toBe('Joseph');
    expect(component['paginationMeta']().currentPage).toBe(1);
    expect(paroisseServiceMock.getParoisses).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Joseph', page: 1 })
    );
  });

  it('should handle status filter change', () => {
    fixture.detectChanges();

    const selectEvent = {
      target: { value: 'actif' },
    } as unknown as Event;

    component['onStatutFilterChange'](selectEvent);
    expect(component['filterStatut']()).toBe('actif');
    expect(paroisseServiceMock.getParoisses).toHaveBeenCalledWith(
      expect.objectContaining({ statut: 'actif', page: 1 })
    );
  });

  it('should reset filters correctly', () => {
    fixture.detectChanges();

    component['filterSearch'].set('Something');
    component['filterStatut'].set('actif');

    component['onResetFilters']();

    expect(component['filterSearch']()).toBe('');
    expect(component['filterStatut']()).toBe('tous');
    expect(component['hasActiveFilters']()).toBe(false);
  });

  it('should display error state on service failure and allow retry', () => {
    paroisseServiceMock.getParoisses.mockReturnValue(
      throwError(() => new Error('Réseau indisponible'))
    );

    component.refresh();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(true);
    expect(component['errorMessage']()).toContain('Réseau indisponible');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-error-state')).toBeTruthy();

    // Retry
    paroisseServiceMock.getParoisses.mockReturnValue(
      of({
        data: mockParoisses,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      })
    );
    component.refresh();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(false);
    expect(component['paroisses']().length).toBe(2);
  });

  it('should open confirm dialog for status change and execute update on confirmation', () => {
    fixture.detectChanges();

    component['promptStatusChange'](mockParoisses[0], 'suspendu');

    expect(component['confirmDialogOpen']()).toBe(true);
    expect(component['confirmTitle']()).toBe('Suspendre la paroisse');
    expect(component['confirmVariant']()).toBe('warning');

    component['executeStatusChange']();

    expect(paroisseServiceMock.changeStatus).toHaveBeenCalledWith('p-1', 'suspendu');
    expect(toastMock.success).toHaveBeenCalledWith(
      'Statut mis à jour',
      expect.stringContaining('suspendu')
    );
    expect(component['confirmDialogOpen']()).toBe(false);
  });
});
