import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PaiementFormComponent } from './paiement-form.component';
import { EcheanceAbonnement } from '../../models/echeance.model';

describe('PaiementFormComponent', () => {
  let fixture: ComponentFixture<PaiementFormComponent>;
  let component: PaiementFormComponent;

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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('echeance', mockEcheance);
    fixture.detectChanges();
  });

  it('should initialize form with solde_restant as default montant', () => {
    expect(component.form.get('montant')?.value).toBe(60000);
    expect(component.form.get('mode_paiement')?.value).toBe('mobile_money');
    expect(component.form.valid).toBe(true);
  });

  it('should invalidate if montant exceeds solde_restant', () => {
    component.form.get('montant')?.setValue(70000);
    component.form.get('montant')?.markAsTouched();
    expect(component.form.get('montant')?.valid).toBe(false);
    expect(component.getFieldError('montant')).toContain('dépasser');
  });

  it('should invalidate if montant is 0 or negative', () => {
    component.form.get('montant')?.setValue(0);
    component.form.get('montant')?.markAsTouched();
    expect(component.form.get('montant')?.valid).toBe(false);
    expect(component.getFieldError('montant')).toContain('minimum');
  });

  it('should emit submitted event with payload on valid submit', () => {
    const emitSpy = vi.spyOn(component.submitted, 'emit');

    component.form.patchValue({
      montant: 30000,
      mode_paiement: 'especes',
      reference_transaction: 'REC-123',
    });

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        echeance_abonnement_id: 'ech-1',
        montant: 30000,
        mode_paiement: 'especes',
        reference_transaction: 'REC-123',
      })
    );
  });

  it('should quick fill remaining balance when fillSoldeRestant() is called', () => {
    component.form.patchValue({ montant: 10000 });
    component.fillSoldeRestant();
    expect(component.form.get('montant')?.value).toBe(60000);
  });
});
