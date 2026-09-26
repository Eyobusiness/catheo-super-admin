import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FacturesListPageComponent } from './factures-list-page.component';
import { FactureService } from '../services/facture.service';
import { Facture } from '../models/facture.model';

describe('FacturesListPageComponent', () => {
  let fixture: ComponentFixture<FacturesListPageComponent>;
  let component: FacturesListPageComponent;
  let mockFactureService: {
    getFactures: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockFactures: Facture[] = [
    {
      id: 'fac-1',
      id_interne: 1,
      echeance_abonnement_id: 1,
      reference: 'FAC-26-0001',
      date_facture: '2026-09-19',
      date_echeance: '2026-10-19',
      montant_ht: 84745.76,
      taux_tva: 18,
      montant_tva: 15254.24,
      montant_ttc: 100000,
      statut: 'en_attente',
      created_at: '',
      updated_at: '',
    },
  ];

  beforeEach(async () => {
    mockFactureService = {
      getFactures: vi.fn().mockReturnValue(
        of({
          data: mockFactures,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [FacturesListPageComponent],
      providers: [
        provideRouter([]),
        { provide: FactureService, useValue: mockFactureService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(FacturesListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load factures on init and display columns', () => {
    expect(mockFactureService.getFactures).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('FAC-26-0001');
    expect(el.textContent).toContain('XOF');
    expect(el.textContent).toContain('18%');
  });

  it('should navigate to detail when clicking view action', () => {
    component.navigateToDetail('fac-1');
    expect(router.navigate).toHaveBeenCalledWith(['/super-admin/factures', 'fac-1']);
  });

  it('should handle search change', () => {
    component.onSearchChange('FAC-26');
    expect(mockFactureService.getFactures).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'FAC-26' })
    );
  });
});
