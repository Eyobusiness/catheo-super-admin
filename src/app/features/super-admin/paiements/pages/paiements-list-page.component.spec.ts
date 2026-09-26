import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PaiementsListPageComponent } from './paiements-list-page.component';
import { PaiementService } from '../services/paiement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaiementAbonnement } from '../models/paiement.model';

describe('PaiementsListPageComponent', () => {
  let fixture: ComponentFixture<PaiementsListPageComponent>;
  let component: PaiementsListPageComponent;
  let mockPaiementService: {
    getPaiements: ReturnType<typeof vi.fn>;
    annulerPaiement: ReturnType<typeof vi.fn>;
    rembourserPaiement: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockPaiements: PaiementAbonnement[] = [
    {
      id: 'pay-1',
      id_interne: 1,
      echeance_abonnement_id: 1,
      reference: 'PAY-26-0001',
      montant: 50000,
      devise: 'XOF',
      mode_paiement: 'mobile_money',
      date_paiement: '2026-09-19',
      statut: 'valide',
      reference_transaction: 'TRX123',
      observation: 'Paiement partiel',
      created_at: '',
      updated_at: '',
    },
  ];

  beforeEach(async () => {
    mockPaiementService = {
      getPaiements: vi.fn().mockReturnValue(
        of({
          data: mockPaiements,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
      annulerPaiement: vi.fn(),
      rembourserPaiement: vi.fn(),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaiementsListPageComponent],
      providers: [
        provideRouter([]),
        { provide: PaiementService, useValue: mockPaiementService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PaiementsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load paiements on init and display in table', () => {
    expect(mockPaiementService.getPaiements).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('PAY-26-0001');
    expect(el.textContent).toContain('XOF');
  });

  it('should navigate to /super-admin/paiements/nouveau when clicking Nouveau Paiement', () => {
    component.navigateToCreate();
    expect(router.navigate).toHaveBeenCalledWith(['/super-admin/paiements/nouveau']);
  });

  it('should navigate to detail on navigateToDetail()', () => {
    component.navigateToDetail('pay-1');
    expect(router.navigate).toHaveBeenCalledWith(['/super-admin/paiements', 'pay-1']);
  });

  it('should open cancellation modal and execute annulation successfully', () => {
    mockPaiementService.annulerPaiement.mockReturnValue(of({ ...mockPaiements[0], statut: 'annule' }));

    component.openAnnulerModal(mockPaiements[0]);
    expect(component['isCancelDialogOpen']()).toBe(true);

    component.confirmAnnulation();
    expect(mockPaiementService.annulerPaiement).toHaveBeenCalledWith('pay-1', expect.anything());
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('should handle API errors and show error state', () => {
    mockPaiementService.getPaiements.mockReturnValue(throwError(() => new Error('Server error')));
    component.refresh();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les paiements');
  });
});
