import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AbonnementStatusBadgeComponent } from './abonnement-status-badge.component';

describe('AbonnementStatusBadgeComponent', () => {
  let component: AbonnementStatusBadgeComponent;
  let fixture: ComponentFixture<AbonnementStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbonnementStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AbonnementStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('devrait afficher "Actif" avec la variante "success" pour le statut actif', () => {
    fixture.componentRef.setInput('statut', 'actif');
    fixture.detectChanges();

    expect(component['badgeLabel']()).toBe('Actif');
    expect(component['badgeVariant']()).toBe('success');
  });

  it('devrait afficher "En attente" avec la variante "warning" pour le statut en_attente', () => {
    fixture.componentRef.setInput('statut', 'en_attente');
    fixture.detectChanges();

    expect(component['badgeLabel']()).toBe('En attente');
    expect(component['badgeVariant']()).toBe('warning');
  });

  it('devrait afficher "Suspendu" pour le statut suspendu', () => {
    fixture.componentRef.setInput('statut', 'suspendu');
    fixture.detectChanges();

    expect(component['badgeLabel']()).toBe('Suspendu');
    expect(component['badgeVariant']()).toBe('neutral');
  });

  it('devrait afficher "Expiré" pour le statut expire', () => {
    fixture.componentRef.setInput('statut', 'expire');
    fixture.detectChanges();

    expect(component['badgeLabel']()).toBe('Expiré');
    expect(component['badgeVariant']()).toBe('neutral');
  });

  it('devrait afficher "Résilié" avec la variante "danger" pour le statut resilie', () => {
    fixture.componentRef.setInput('statut', 'resilie');
    fixture.detectChanges();

    expect(component['badgeLabel']()).toBe('Résilié');
    expect(component['badgeVariant']()).toBe('danger');
  });
});
