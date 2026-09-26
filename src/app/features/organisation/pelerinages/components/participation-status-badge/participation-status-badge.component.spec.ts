import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ParticipationStatusBadgeComponent } from './participation-status-badge.component';

describe('ParticipationStatusBadgeComponent', () => {
  let fixture: ComponentFixture<ParticipationStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipationStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipationStatusBadgeComponent);
  });

  it('should render "Présent(e)" with success variant for statut "presente"', () => {
    fixture.componentRef.setInput('statut', 'presente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Présent(e)');
    expect(el.querySelector('.badge-success')).toBeTruthy();
  });

  it('should render "Prévue" with secondary variant for statut "prevue"', () => {
    fixture.componentRef.setInput('statut', 'prevue');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Prévue');
    expect(el.querySelector('.badge-secondary')).toBeTruthy();
  });

  it('should render "Absent(e)" with danger variant for statut "absente"', () => {
    fixture.componentRef.setInput('statut', 'absente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Absent(e)');
    expect(el.querySelector('.badge-danger')).toBeTruthy();
  });
});
