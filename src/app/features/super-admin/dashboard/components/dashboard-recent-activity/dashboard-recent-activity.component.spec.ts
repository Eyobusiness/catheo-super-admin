import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardRecentActivityComponent } from './dashboard-recent-activity.component';
import { DashboardPaiementRecent } from '../../models/dashboard.model';

describe('DashboardRecentActivityComponent', () => {
  let component: DashboardRecentActivityComponent;
  let fixture: ComponentFixture<DashboardRecentActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRecentActivityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRecentActivityComponent);
    component = fixture.componentInstance;
  });

  it('should render empty state when paiements array is empty', () => {
    fixture.componentRef.setInput('paiements', []);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const emptyState = compiled.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
    expect(compiled.textContent).toContain('Aucun encaissement récent');
  });

  it('should render table rows when paiements are provided', () => {
    const mockPaiements: DashboardPaiementRecent[] = [
      {
        id: 'p-1',
        reference: 'PAI-12345',
        montant: 50000,
        devise: 'XOF',
        mode_paiement: 'orange_money',
        date_paiement: '2026-09-19',
        paroisse_nom: 'Cathédrale Saint Paul',
        produit_code: 'OPPE',
      },
    ];

    fixture.componentRef.setInput('paiements', mockPaiements);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(compiled.textContent).toContain('PAI-12345');
    expect(compiled.textContent).toContain('Cathédrale Saint Paul');
    expect(compiled.textContent).toContain('OPPE');
  });
});
