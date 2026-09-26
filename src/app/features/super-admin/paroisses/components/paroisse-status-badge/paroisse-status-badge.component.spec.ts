import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ParoisseStatusBadgeComponent } from './paroisse-status-badge.component';

describe('ParoisseStatusBadgeComponent', () => {
  let component: ParoisseStatusBadgeComponent;
  let fixture: ComponentFixture<ParoisseStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParoisseStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoisseStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render success variant for actif', () => {
    fixture.componentRef.setInput('statut', 'actif');
    fixture.detectChanges();

    expect(component['badgeVariant']()).toBe('success');
    expect(component['badgeLabel']()).toBe('Actif');
  });

  it('should render warning variant for suspendu', () => {
    fixture.componentRef.setInput('statut', 'suspendu');
    fixture.detectChanges();

    expect(component['badgeVariant']()).toBe('warning');
    expect(component['badgeLabel']()).toBe('Suspendu');
  });

  it('should render danger variant for inactif', () => {
    fixture.componentRef.setInput('statut', 'inactif');
    fixture.detectChanges();

    expect(component['badgeVariant']()).toBe('danger');
    expect(component['badgeLabel']()).toBe('Inactif');
  });
});
