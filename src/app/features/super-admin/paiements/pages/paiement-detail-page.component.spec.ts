import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PaiementDetailPageComponent } from './paiement-detail-page.component';
import { PaiementService } from '../services/paiement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PaiementAbonnement } from '../models/paiement.model';

describe('PaiementDetailPageComponent', () => {
  let fixture: ComponentFixture<PaiementDetailPageComponent>;
  let component: PaiementDetailPageComponent;
  let mockPaiementService: {
    getPaiement: ReturnType<typeof vi.fn>;
    annulerPaiement: ReturnType<typeof vi.fn>;
    rembourserPaiement: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockPaiement: PaiementAbonnement = {
    id: 'pay-1',
    id_interne: 1,
    reference: 'PAY-26-0001',
    echeance_abonnement_id: 1,
    montant: 50000,
    devise: 'XOF',
    mode_paiement: 'mobile_money',
    date_paiement: '2026-09-19',
    statut: 'valide',
    reference_transaction: 'WAVE-123',
    observation: 'Premier versement',
    created_at: '2026-09-19T10:00:00Z',
    updated_at: '2026-09-19T10:00:00Z',
    echeance: {
      id: 'ech-1',
      abonnement_id: 1,
      reference: 'ECH-26-0001',
      periode_debut: '2026-01-01',
      periode_fin: '2026-12-31',
      date_echeance: '2026-01-31',
      montant: 100000,
      montant_paye: 50000,
      solde_restant: 50000,
      devise: 'XOF',
      statut: 'en_attente',
      abonnement: {
        id: 1,
        reference: 'ABO-26-0001',
        paroisse_id: 1,
        formule_id: 1,
        date_debut: '2026-01-01',
        date_fin: null,
        statut: 'actif',
        montant: 100000,
        devise: 'XOF',
        renouvellement_automatique: true,
        created_at: '',
        updated_at: '',
        paroisse: {
          id: 1,
          nom_paroisse: 'Saint Jean',
        },
      },
    },
  };

  beforeEach(async () => {
    mockPaiementService = {
      getPaiement: vi.fn().mockReturnValue(of(mockPaiement)),
      annulerPaiement: vi.fn(),
      rembourserPaiement: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaiementDetailPageComponent],
      providers: [
        { provide: PaiementService, useValue: mockPaiementService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToast },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'pay-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load payment details on init', () => {
    expect(mockPaiementService.getPaiement).toHaveBeenCalledWith('pay-1');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('PAY-26-0001');
    expect(el.textContent).toContain('XOF');
    expect(el.textContent).toContain('Saint Jean');
  });

  it('should trigger annulation when confirmed', () => {
    mockPaiementService.annulerPaiement.mockReturnValue(of({ ...mockPaiement, statut: 'annule' }));

    component.openAnnulerModal();
    component.confirmAnnulation();

    expect(mockPaiementService.annulerPaiement).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('should trigger remboursement when confirmed', () => {
    mockPaiementService.rembourserPaiement.mockReturnValue(of({ ...mockPaiement, statut: 'rembourse' }));

    component.openRembourserModal();
    component.confirmRemboursement();

    expect(mockPaiementService.rembourserPaiement).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });
});
