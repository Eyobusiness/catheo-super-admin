import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EcheanceDetailPageComponent } from './echeance-detail-page.component';
import { EcheanceService } from '../services/echeance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EcheanceAbonnement } from '../models/echeance.model';

describe('EcheanceDetailPageComponent', () => {
  let fixture: ComponentFixture<EcheanceDetailPageComponent>;
  let component: EcheanceDetailPageComponent;
  let mockEcheanceService: {
    getEcheance: ReturnType<typeof vi.fn>;
    genererFacture: ReturnType<typeof vi.fn>;
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
    id_interne: 1,
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
    paiements: [
      {
        id: 'pay-1',
        reference: 'PAY-26-0001',
        echeance_abonnement_id: 1,
        montant: 40000,
        devise: 'XOF',
        mode_paiement: 'mobile_money',
        date_paiement: '2026-01-15',
        statut: 'valide',
        created_at: '',
        updated_at: '',
      },
    ],
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
        nom_paroisse: 'Saint Paul',
      },
    },
  };

  beforeEach(async () => {
    mockEcheanceService = {
      getEcheance: vi.fn().mockReturnValue(of(mockEcheance)),
      genererFacture: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EcheanceDetailPageComponent],
      providers: [
        { provide: EcheanceService, useValue: mockEcheanceService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToast },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'ech-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EcheanceDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display installment details and financial balance', () => {
    expect(mockEcheanceService.getEcheance).toHaveBeenCalledWith('ech-1');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ECH-26-0001');
    expect(el.textContent).toContain('Saint Paul');
    expect(el.textContent).toContain('XOF');
  });

  it('should display existing payments in history table', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('PAY-26-0001');
    expect(el.textContent).toContain('mobile_money');
  });
});
