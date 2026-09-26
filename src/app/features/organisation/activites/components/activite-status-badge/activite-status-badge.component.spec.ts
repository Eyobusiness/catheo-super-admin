import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { ActiviteStatusBadgeComponent } from './activite-status-badge.component';
import { ActiviteStatut } from '../../models/activite.model';

@Component({
  standalone: true,
  imports: [ActiviteStatusBadgeComponent],
  template: `
    <app-activite-status-badge [statut]="statut()" [size]="size()" />
  `,
})
class TestHostComponent {
  statut = signal<ActiviteStatut | string>('planifiee');
  size = signal<'sm' | 'md'>('sm');
}

describe('ActiviteStatusBadgeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render "Planifiée" for statut "planifiee"', () => {
    host.statut.set('planifiee');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Planifiée');
  });

  it('should render "En cours" for statut "en_cours"', () => {
    host.statut.set('en_cours');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('En cours');
  });

  it('should render "Terminée" for statut "terminee"', () => {
    host.statut.set('terminee');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Terminée');
  });

  it('should render "Brouillon" for statut "brouillon"', () => {
    host.statut.set('brouillon');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Brouillon');
  });

  it('should render "Annulée" for statut "annulee"', () => {
    host.statut.set('annulee');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Annulée');
  });

  it('should render raw status text for unknown statut', () => {
    host.statut.set('special');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('special');
  });
});
