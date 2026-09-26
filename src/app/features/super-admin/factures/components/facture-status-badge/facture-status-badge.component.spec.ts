import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { FactureStatusBadgeComponent } from './facture-status-badge.component';

describe('FactureStatusBadgeComponent', () => {
  let fixture: ComponentFixture<FactureStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactureStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FactureStatusBadgeComponent);
  });

  it('should display "Payée" with success badge for statut "payee"', () => {
    fixture.componentRef.setInput('statut', 'payee');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Payée');
    expect(compiled.querySelector('.badge-success')).toBeTruthy();
  });

  it('should display "En attente" with warning badge for statut "en_attente"', () => {
    fixture.componentRef.setInput('statut', 'en_attente');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('En attente');
    expect(compiled.querySelector('.badge-warning')).toBeTruthy();
  });

  it('should display "Annulée" with danger badge for statut "annulee"', () => {
    fixture.componentRef.setInput('statut', 'annulee');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Annulée');
    expect(compiled.querySelector('.badge-danger')).toBeTruthy();
  });
});
