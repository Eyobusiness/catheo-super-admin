import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PaiementCreatePageComponent } from './paiement-create-page.component';
import { PaiementService } from '../services/paiement.service';
import { EcheanceService } from '../services/echeance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EcheanceAbonnement } from '../models/echeance.model';
import { PaiementAbonnement } from '../models/paiement.model';

describe('PaiementCreatePageComponent', () => {
  let fixture: ComponentFixture<PaiementCreatePageComponent>;
  let component: PaiementCreatePageComponent;
  let mockPaiementService: {
    createPaiement: ReturnType<typeof vi.fn>;
  };
  let mockEcheanceService: {
    getEcheance: ReturnType<typeof vi.fn>;
    getEcheances: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockEcheance: EcheanceAbonnement = {
    id: 'ech-1',
    abonnement_id: 1,
    reference: 'ECH-26-0001',
    periode_debut: '2026-01-01',
    periode_fin: '2026-12-31',
    date_echeance: '2026-01-31',
    montant: 100000,
    montant_paye: 40000,
    solde_restant: 60000,
    devise: 'XOF',
    statut: 'en_attente',
  };

  const mockCreatedPaiement: PaiementAbonnement = {
    id: 'pay-new',
    reference: 'PAY-26-0099',
    echeance_abonnement_id: 'ech-1',
    montant: 60000,
    devise: 'XOF',
    mode_paiement: 'mobile_money',
    date_paiement: '2026-09-19',
    statut: 'valide',
    created_at: '',
    updated_at: '',
  };

  beforeEach(async () => {
    mockPaiementService = {
      createPaiement: vi.fn().mockReturnValue(of(mockCreatedPaiement)),
    };

    mockEcheanceService = {
      getEcheance: vi.fn().mockReturnValue(of(mockEcheance)),
      getEcheances: vi.fn().mockReturnValue(
        of({
          data: [mockEcheance],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaiementCreatePageComponent],
      providers: [
        { provide: PaiementService, useValue: mockPaiementService },
        { provide: EcheanceService, useValue: mockEcheanceService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToast },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'echeance_id' ? 'ech-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load single echeance if query param echeance_id is present', () => {
    expect(mockEcheanceService.getEcheance).toHaveBeenCalledWith('ech-1');
    expect(component['selectedEcheance']()).toEqual(mockEcheance);
  });

  it('should submit payment and redirect to detail page on success', () => {
    component.onSubmitPaiement({
      echeance_abonnement_id: 'ech-1',
      montant: 60000,
      mode_paiement: 'mobile_money',
      date_paiement: '2026-09-19',
    });

    expect(mockPaiementService.createPaiement).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/super-admin/paiements', 'pay-new']);
  });

  it('should handle submission error and show toast error', () => {
    mockPaiementService.createPaiement.mockReturnValue(throwError(() => new Error('Validation failed')));

    component.onSubmitPaiement({
      echeance_abonnement_id: 'ech-1',
      montant: 60000,
      mode_paiement: 'mobile_money',
      date_paiement: '2026-09-19',
    });

    expect(mockToast.error).toHaveBeenCalledWith('Erreur d’enregistrement', 'Validation failed');
    expect(component['isSubmitting']()).toBe(false);
  });
});
