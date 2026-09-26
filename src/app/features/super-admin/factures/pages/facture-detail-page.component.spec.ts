import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FactureDetailPageComponent } from './facture-detail-page.component';
import { FactureService } from '../services/facture.service';
import { Facture } from '../models/facture.model';

describe('FactureDetailPageComponent', () => {
  let fixture: ComponentFixture<FactureDetailPageComponent>;
  let component: FactureDetailPageComponent;
  let mockFactureService: {
    getFacture: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

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
    echeance: {
      id: 'ech-1',
      abonnement_id: 1,
      reference: 'ECH-26-0001',
      periode_debut: '2026-01-01',
      periode_fin: '2026-12-31',
      date_echeance: '2026-01-31',
      montant: 100000,
      montant_paye: 0,
      solde_restant: 100000,
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
          nom_paroisse: 'Saint Ambroise',
        },
      },
    },
  };

  beforeEach(async () => {
    mockFactureService = {
      getFacture: vi.fn().mockReturnValue(of(mockFacture)),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FactureDetailPageComponent],
      providers: [
        { provide: FactureService, useValue: mockFactureService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'fac-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FactureDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load invoice on init and render printable layout', () => {
    expect(mockFactureService.getFacture).toHaveBeenCalledWith('fac-1');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('FAC-26-0001');
    expect(el.textContent).toContain('Saint Ambroise');
    expect(el.textContent).toContain('XOF');
  });

  it('should call window.print when imprimer() is called', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.imprimer();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
