import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrganisationStatusBadgeComponent } from './organisation-status-badge.component';

describe('OrganisationStatusBadgeComponent', () => {
  let fixture: ComponentFixture<OrganisationStatusBadgeComponent>;

  it('devrait afficher le badge vert "Actif" pour le statut actif', () => {
    TestBed.configureTestingModule({
      imports: [OrganisationStatusBadgeComponent],
    });
    fixture = TestBed.createComponent(OrganisationStatusBadgeComponent);
    fixture.componentRef.setInput('statut', 'actif');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('Actif');
    expect(badgeEl.className).toContain('badge-success');
  });

  it('devrait afficher le badge neutre "Inactif" pour le statut inactif', () => {
    fixture = TestBed.createComponent(OrganisationStatusBadgeComponent);
    fixture.componentRef.setInput('statut', 'inactif');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('Inactif');
    expect(badgeEl.className).toContain('badge-neutral');
  });

  it('devrait afficher le badge rouge "Suspendu" pour le statut suspendu', () => {
    fixture = TestBed.createComponent(OrganisationStatusBadgeComponent);
    fixture.componentRef.setInput('statut', 'suspendu');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('Suspendu');
    expect(badgeEl.className).toContain('badge-danger');
  });
});
