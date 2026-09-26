import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { EcheanceListComponent } from './echeance-list.component';
import { EcheanceAbonnement } from '../../models/abonnement.model';

describe('EcheanceListComponent', () => {
  let component: EcheanceListComponent;
  let fixture: ComponentFixture<EcheanceListComponent>;

  const mockEcheances: EcheanceAbonnement[] = [
    {
      id: 1,
      reference: 'ECH-26-0001',
      abonnement_id: 10,
      periode_debut: '2026-01-01',
      periode_fin: '2026-12-31',
      date_echeance: '2026-01-15',
      montant: 50000,
      montant_paye: 0,
      solde_restant: 50000,
      devise: 'XOF',
      statut: 'en_attente',
      created_at: '2026-01-01',
      facture: {
        id: 5,
        reference: 'FAC-26-0005',
        numero: 'FAC-2026-0005',
        numero_facture: 'FAC-26-0005',
        statut: 'emise',
        montant_total: 50000,
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcheanceListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EcheanceListComponent);
    component = fixture.componentInstance;
  });

  it('devrait afficher un état vide si aucune échéance n’est fournie (ex. formule gratuite)', () => {
    fixture.componentRef.setInput('echeances', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aucune échéance enregistrée');
    expect(compiled.textContent).toContain('formules gratuites ne génèrent pas d\'échéances');
  });

  it('devrait afficher la liste des échéances avec montants et statut', () => {
    fixture.componentRef.setInput('echeances', mockEcheances);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ECH-26-0001');
    expect(compiled.textContent).toContain('XOF');
    expect(compiled.textContent).toContain('FAC-26-0005');
  });
});
