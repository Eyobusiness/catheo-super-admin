import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrganisationTypeBadgeComponent } from './organisation-type-badge.component';

describe('OrganisationTypeBadgeComponent', () => {
  let fixture: ComponentFixture<OrganisationTypeBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrganisationTypeBadgeComponent],
    });
  });

  it('devrait afficher "OPPE · Office Paroissial de la Pastorale des Enfants" avec le variant primary', () => {
    fixture = TestBed.createComponent(OrganisationTypeBadgeComponent);
    fixture.componentRef.setInput('type', 'OPPE');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('OPPE · Office Paroissial de la Pastorale des Enfants');
    expect(badgeEl.className).toContain('badge-primary');
  });

  it('devrait afficher "OPPJ · Office Paroissial de la Pastorale des Jeunes" avec le variant info', () => {
    fixture = TestBed.createComponent(OrganisationTypeBadgeComponent);
    fixture.componentRef.setInput('type', 'OPPJ');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('OPPJ · Office Paroissial de la Pastorale des Jeunes');
    expect(badgeEl.className).toContain('badge-info');
  });

  it('devrait afficher "OPPA · Office Paroissial de la Pastorale des Adultes" avec le variant warning', () => {
    fixture = TestBed.createComponent(OrganisationTypeBadgeComponent);
    fixture.componentRef.setInput('type', 'OPPA');
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent).toContain('OPPA · Office Paroissial de la Pastorale des Adultes');
    expect(badgeEl.className).toContain('badge-warning');
  });

  it('devrait afficher uniquement le code technique si showLabel est false', () => {
    fixture = TestBed.createComponent(OrganisationTypeBadgeComponent);
    fixture.componentRef.setInput('type', 'OPPE');
    fixture.componentRef.setInput('showLabel', false);
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.app-badge');
    expect(badgeEl.textContent.trim()).toBe('OPPE');
  });
});
