import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should not render dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('should render dialog and title when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Titre de la modale');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.modal-title');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent).toContain('Titre de la modale');
  });

  it('should emit closed when close button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const spy = vi.fn();
    component.closed.subscribe(spy);

    const closeBtn = fixture.nativeElement.querySelector('.modal-close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
