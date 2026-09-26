import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the confirm dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message when open', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Confirmer la suppression');
    fixture.componentRef.setInput('message', 'Cette action est irréversible.');
    fixture.detectChanges();

    expect(component.title()).toBe('Confirmer la suppression');
    expect(component.message()).toBe('Cette action est irréversible.');
  });

  it('should emit confirmed event when confirm action is called', () => {
    const spy = vi.fn();
    component.confirmed.subscribe(spy);

    component.onConfirm();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancelled event when cancel action is called', () => {
    const spy = vi.fn();
    component.cancelled.subscribe(spy);

    component.onCancel();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
