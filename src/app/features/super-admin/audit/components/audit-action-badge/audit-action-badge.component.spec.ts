import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuditActionBadgeComponent } from './audit-action-badge.component';

describe('AuditActionBadgeComponent', () => {
  let fixture: ComponentFixture<AuditActionBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuditActionBadgeComponent],
    });
  });

  it('devrait afficher "Création" avec variante success pour l’action create', () => {
    fixture = TestBed.createComponent(AuditActionBadgeComponent);
    fixture.componentRef.setInput('action', 'create');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-badge');
    expect(badge.textContent).toContain('Création');
    expect(badge.className).toContain('badge-success');
  });

  it('devrait afficher "Modification" avec variante warning pour l’action update', () => {
    fixture = TestBed.createComponent(AuditActionBadgeComponent);
    fixture.componentRef.setInput('action', 'update');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-badge');
    expect(badge.textContent).toContain('Modification');
    expect(badge.className).toContain('badge-warning');
  });

  it('devrait afficher "Suppression" avec variante danger pour l’action delete', () => {
    fixture = TestBed.createComponent(AuditActionBadgeComponent);
    fixture.componentRef.setInput('action', 'delete');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-badge');
    expect(badge.textContent).toContain('Suppression');
    expect(badge.className).toContain('badge-danger');
  });

  it('devrait afficher "Connexion" avec variante info pour l’action login', () => {
    fixture = TestBed.createComponent(AuditActionBadgeComponent);
    fixture.componentRef.setInput('action', 'login');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.app-badge');
    expect(badge.textContent).toContain('Connexion');
    expect(badge.className).toContain('badge-info');
  });
});
