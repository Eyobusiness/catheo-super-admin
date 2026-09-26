import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the input component', () => {
    expect(component).toBeTruthy();
  });

  it('should display label when provided', () => {
    fixture.componentRef.setInput('label', 'Nom utilisateur');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Nom utilisateur');
  });

  it('should display error message when error is set', () => {
    fixture.componentRef.setInput('error', 'Champ obligatoire');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.input-error');
    expect(errorEl.textContent).toContain('Champ obligatoire');
  });

  it('should support writeValue for CVA', () => {
    component.writeValue('Valeur test');
    fixture.detectChanges();

    expect(component.val()).toBe('Valeur test');
  });
});
