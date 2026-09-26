import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the badge component', () => {
    expect(component).toBeTruthy();
  });

  it('should render label text when provided', () => {
    fixture.componentRef.setInput('label', 'Actif');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge-text');
    expect(span.textContent).toContain('Actif');
  });

  it('should apply success variant class', () => {
    fixture.componentRef.setInput('variant', 'success');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.app-badge');
    expect(span.classList.contains('badge-success')).toBe(true);
  });

  it('should render dot indicator when dot input is true', () => {
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.badge-dot');
    expect(dot).toBeTruthy();
  });
});
