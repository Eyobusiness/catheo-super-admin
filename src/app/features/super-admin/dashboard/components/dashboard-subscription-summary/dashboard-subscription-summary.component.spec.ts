import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardSubscriptionSummaryComponent } from './dashboard-subscription-summary.component';
import { DashboardAbonnementsMetrics, DashboardProduitRepartition } from '../../models/dashboard.model';

describe('DashboardSubscriptionSummaryComponent', () => {
  let component: DashboardSubscriptionSummaryComponent;
  let fixture: ComponentFixture<DashboardSubscriptionSummaryComponent>;

  const mockAbonnements: DashboardAbonnementsMetrics = {
    actifs: 10,
    en_attente: 3,
    suspendus: 1,
    expires: 2,
    resilies: 1,
  };

  const mockProduits: DashboardProduitRepartition[] = [
    { produit_id: 1, produit_code: 'OPPE', produit_nom: 'OPPE Enfance', abonnements_actifs: 7 },
    { produit_id: 2, produit_code: 'OPPJ', produit_nom: 'OPPJ Jeunes', abonnements_actifs: 3 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSubscriptionSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSubscriptionSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should render subscription status counters and product breakdown', () => {
    fixture.componentRef.setInput('abonnements', mockAbonnements);
    fixture.componentRef.setInput('repartitionProduits', mockProduits);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('10');
    expect(compiled.textContent).toContain('Actifs');
    expect(compiled.textContent).toContain('En attente');
    expect(compiled.textContent).toContain('OPPE Enfance');
    expect(compiled.textContent).toContain('OPPJ Jeunes');
  });
});
