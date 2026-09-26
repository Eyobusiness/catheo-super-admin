import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { CampagneStatusBadgeComponent } from './campagne-status-badge.component';

describe('CampagneStatusBadgeComponent', () => {
  let fixture: ComponentFixture<CampagneStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampagneStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CampagneStatusBadgeComponent);
  });

  it('should render "Ouverte" with success variant for statut "ouverte"', () => {
    fixture.componentRef.setInput('statut', 'ouverte');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ouverte');
    expect(el.querySelector('.badge-success')).toBeTruthy();
  });

  it('should render "Brouillon" with secondary variant for statut "brouillon"', () => {
    fixture.componentRef.setInput('statut', 'brouillon');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Brouillon');
    expect(el.querySelector('.badge-secondary')).toBeTruthy();
  });

  it('should render "Clôturée" with info variant for statut "cloturee"', () => {
    fixture.componentRef.setInput('statut', 'cloturee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Clôturée');
    expect(el.querySelector('.badge-info')).toBeTruthy();
  });

  it('should render "Terminée" with primary variant for statut "terminee"', () => {
    fixture.componentRef.setInput('statut', 'terminee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Terminée');
    expect(el.querySelector('.badge-primary')).toBeTruthy();
  });

  it('should render "Annulée" with danger variant for statut "annulee"', () => {
    fixture.componentRef.setInput('statut', 'annulee');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Annulée');
    expect(el.querySelector('.badge-danger')).toBeTruthy();
  });
});
