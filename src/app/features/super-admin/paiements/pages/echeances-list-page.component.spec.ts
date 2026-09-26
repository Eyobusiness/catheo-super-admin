import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EcheancesListPageComponent } from './echeances-list-page.component';
import { EcheanceService } from '../services/echeance.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EcheanceAbonnement } from '../models/echeance.model';
import { Facture } from '../../factures/models/facture.model';

describe('EcheancesListPageComponent', () => {
  let fixture: ComponentFixture<EcheancesListPageComponent>;
  let component: EcheancesListPageComponent;
  let mockEcheanceService: {
    getEcheances: ReturnType<typeof vi.fn>;
    genererFacture: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockEcheances: EcheanceAbonnement[] = [
    {
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
          nom_paroisse: 'Notre Dame',
        },
      },
    },
  ];

  beforeEach(async () => {
    mockEcheanceService = {
      getEcheances: vi.fn().mockReturnValue(
        of({
          data: mockEcheances,
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
      genererFacture: vi.fn(),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EcheancesListPageComponent],
      providers: [
        provideRouter([]),
        { provide: EcheanceService, useValue: mockEcheanceService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(EcheancesListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load echeances on init and display columns', () => {
    expect(mockEcheanceService.getEcheances).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ECH-26-0001');
    expect(el.textContent).toContain('Notre Dame');
    expect(el.textContent).toContain('XOF');
  });

  it('should navigate to paiement creation with echeance_id query param', () => {
    component.navigateToEncaisser('ech-1');
    expect(router.navigate).toHaveBeenCalledWith(['/super-admin/paiements/nouveau'], {
      queryParams: { echeance_id: 'ech-1' },
    });
  });

  it('should open invoice dialog and generate invoice on confirmation', () => {
    const mockFacture: Facture = {
      id: 'fac-1',
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
    };

    mockEcheanceService.genererFacture.mockReturnValue(of(mockFacture));

    component.openGenererFactureModal(mockEcheances[0]);
    expect(component['isInvoiceDialogOpen']()).toBe(true);

    component.confirmGenererFacture();
    expect(mockEcheanceService.genererFacture).toHaveBeenCalledWith('ech-1', expect.anything());
    expect(mockToast.success).toHaveBeenCalled();
  });
});
