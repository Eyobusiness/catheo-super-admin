import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FacturePrintComponent } from './facture-print.component';
import { Facture } from '../../models/facture.model';

describe('FacturePrintComponent', () => {
  let fixture: ComponentFixture<FacturePrintComponent>;
  let component: FacturePrintComponent;

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
    description: 'Facture annuelle SaaS',
    observation: 'Merci pour votre confiance',
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
      montant_paye: 40000,
      solde_restant: 60000,
      devise: 'XOF',
      statut: 'en_attente',
      abonnement: {
        id: 'abo-1',
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
          nom_paroisse: 'Saint Augustin',
          code_paroisse: 'PAR-001',
          diocese: 'Abidjan',
        },
        formule: {
          id: 1,
          nom: 'Formule Complète',
          produit: {
            id: 1,
            code: 'CATHEO',
            nom: 'CATHEO Paroisse',
          },
        },
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturePrintComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturePrintComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('facture', mockFacture);
    fixture.detectChanges();
  });

  it('should render invoice reference and parish name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('FAC-26-0001');
    expect(el.textContent).toContain('Saint Augustin');
    expect(el.textContent).toContain('CATHEO Paroisse');
  });

  it('should render correct amounts and VAT', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('18%');
    expect(el.textContent).toContain('XOF');
  });

  it('should call window.print when imprimer() is called', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.imprimer();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
