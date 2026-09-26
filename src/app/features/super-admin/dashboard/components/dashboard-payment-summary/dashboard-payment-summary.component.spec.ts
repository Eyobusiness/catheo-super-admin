import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardPaymentSummaryComponent } from './dashboard-payment-summary.component';
import { DashboardFinancesMetrics } from '../../models/dashboard.model';

describe('DashboardPaymentSummaryComponent', () => {
  let component: DashboardPaymentSummaryComponent;
  let fixture: ComponentFixture<DashboardPaymentSummaryComponent>;

  const mockFinances: DashboardFinancesMetrics = {
    ca_total_encaisse: 2500000,
    ca_mois_courant: 450000,
    echeances_en_retard: 2,
    montant_en_retard: 100000,
    devise: 'XOF',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPaymentSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPaymentSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should render finances amounts and arrears indicator', () => {
    fixture.componentRef.setInput('finances', mockFinances);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('2\u202f500\u202f000 XOF');
    expect(compiled.textContent).toContain('450\u202f000 XOF');
    expect(compiled.textContent).toContain('2 échéance(s) en retard');
    expect(compiled.textContent).toContain('Impayés');
    expect(compiled.textContent).toContain('100\u202f000 XOF');
  });

  it('should render clean status when no arrears exist', () => {
    fixture.componentRef.setInput('finances', {
      ...mockFinances,
      echeances_en_retard: 0,
      montant_en_retard: 0,
    });
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Aucune échéance en retard');
    expect(compiled.textContent).toContain('À jour');
  });
});
