import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Total Paroisses');
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();
  });

  it('should create the stat-card component', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and value', () => {
    fixture.componentRef.setInput('title', 'Total Paroisses');
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.stat-title');
    const valueEl = fixture.nativeElement.querySelector('.stat-value');

    expect(titleEl.textContent).toContain('Total Paroisses');
    expect(valueEl.textContent).toContain('42');
  });

  it('should display trend badge when provided', () => {
    fixture.componentRef.setInput('trend', '+12%');
    fixture.componentRef.setInput('trendDirection', 'up');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.stat-trend');
    expect(badgeEl.textContent).toContain('+12%');
    expect(badgeEl.classList.contains('trend-up')).toBe(true);
  });
});
