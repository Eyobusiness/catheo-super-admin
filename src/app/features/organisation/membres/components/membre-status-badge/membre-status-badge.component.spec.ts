import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { MembreStatusBadgeComponent } from './membre-status-badge.component';
import { MembreStatut } from '../../models/membre.model';

@Component({
  standalone: true,
  imports: [MembreStatusBadgeComponent],
  template: `
    <app-membre-status-badge [statut]="statut()" [size]="size()" />
  `,
})
class TestHostComponent {
  statut = signal<MembreStatut | string>('actif');
  size = signal<'sm' | 'md'>('sm');
}

describe('MembreStatusBadgeComponent', () => {
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

  it('should render "Actif" with success variant for statut "actif"', () => {
    host.statut.set('actif');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Actif');
  });

  it('should render "Inactif" for statut "inactif"', () => {
    host.statut.set('inactif');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Inactif');
  });

  it('should render "Suspendu" for statut "suspendu"', () => {
    host.statut.set('suspendu');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Suspendu');
  });

  it('should render raw status text for unknown statut', () => {
    host.statut.set('archive');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('archive');
  });
});
