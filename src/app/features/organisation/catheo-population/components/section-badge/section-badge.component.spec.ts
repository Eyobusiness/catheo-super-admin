import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { SectionBadgeComponent } from './section-badge.component';
import { SectionCode } from '../../models/catheo-population.model';

@Component({
  standalone: true,
  imports: [SectionBadgeComponent],
  template: `
    <app-section-badge [code]="code()" [size]="size()" />
  `,
})
class TestHostComponent {
  code = signal<SectionCode | string>('SEC-ENFANTS-PRI');
  size = signal<'sm' | 'md'>('sm');
}

describe('SectionBadgeComponent', () => {
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

  it('should render "Primaire" for SEC-ENFANTS-PRI', () => {
    host.code.set('SEC-ENFANTS-PRI');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Primaire');
  });

  it('should render "Collège" for SEC-ENFANTS-COL', () => {
    host.code.set('SEC-ENFANTS-COL');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Collège');
  });

  it('should render "Jeunes" for SEC-JEUNES', () => {
    host.code.set('SEC-JEUNES');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Jeunes');
  });

  it('should render "Adultes" for SEC-ADULTES', () => {
    host.code.set('SEC-ADULTES');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Adultes');
  });

  it('should render code for unknown section', () => {
    host.code.set('SEC-AUTRE');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('SEC-AUTRE');
  });
});
