import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { InscriptionStatusBadgeComponent } from './inscription-status-badge.component';

describe('InscriptionStatusBadgeComponent', () => {
  let fixture: ComponentFixture<InscriptionStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscriptionStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InscriptionStatusBadgeComponent);
  });

  it('should render "Payée" with success variant for statut "payee"', () => {
    fixture.componentRef.setInput('statut', 'payee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Payée');
    expect(el.querySelector('.badge-success')).toBeTruthy();
  });

  it('should render "Partiellement payée" with info variant for statut "partiellement_payee"', () => {
    fixture.componentRef.setInput('statut', 'partiellement_payee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Partiellement payée');
    expect(el.querySelector('.badge-info')).toBeTruthy();
  });

  it('should render "En attente" with warning variant for statut "en_attente"', () => {
    fixture.componentRef.setInput('statut', 'en_attente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('En attente');
    expect(el.querySelector('.badge-warning')).toBeTruthy();
  });

  it('should render "Annulée" with danger variant for statut "annulee"', () => {
    fixture.componentRef.setInput('statut', 'annulee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Annulée');
    expect(el.querySelector('.badge-danger')).toBeTruthy();
  });
});
