import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { PaiementStatusBadgeComponent } from './paiement-status-badge.component';

describe('PaiementStatusBadgeComponent', () => {
  let component: PaiementStatusBadgeComponent;
  let fixture: ComponentFixture<PaiementStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should display "Validé" for statut "valide"', () => {
    fixture.componentRef.setInput('statut', 'valide');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Validé');
    expect(compiled.querySelector('.badge-success')).toBeTruthy();
  });

  it('should display "En attente" for statut "en_attente"', () => {
    fixture.componentRef.setInput('statut', 'en_attente');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('En attente');
    expect(compiled.querySelector('.badge-warning')).toBeTruthy();
  });

  it('should display "Annulé" for statut "annule"', () => {
    fixture.componentRef.setInput('statut', 'annule');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Annulé');
    expect(compiled.querySelector('.badge-danger')).toBeTruthy();
  });

  it('should display "Remboursé" for statut "rembourse"', () => {
    fixture.componentRef.setInput('statut', 'rembourse');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Remboursé');
    expect(compiled.querySelector('.badge-info')).toBeTruthy();
  });
});
