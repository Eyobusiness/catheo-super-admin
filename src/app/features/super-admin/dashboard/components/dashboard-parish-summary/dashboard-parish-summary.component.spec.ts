import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardParishSummaryComponent } from './dashboard-parish-summary.component';
import { DashboardParoissesMetrics } from '../../models/dashboard.model';

describe('DashboardParishSummaryComponent', () => {
  let component: DashboardParishSummaryComponent;
  let fixture: ComponentFixture<DashboardParishSummaryComponent>;

  const mockParoisses: DashboardParoissesMetrics = {
    total: 10,
    actives: 8,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardParishSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardParishSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should render parish counts and calculate 80% activity rate', () => {
    fixture.componentRef.setInput('paroisses', mockParoisses);
    fixture.componentRef.setInput('produitsActifs', 4);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('10');
    expect(compiled.textContent).toContain('8');
    expect(compiled.textContent).toContain('2'); // inactives (10 - 8)
    expect(compiled.textContent).toContain('80%');
    expect(compiled.textContent).toContain('4 modules actifs');
  });
});
