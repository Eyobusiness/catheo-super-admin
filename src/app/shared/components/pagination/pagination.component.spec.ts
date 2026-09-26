import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the pagination component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute total pages correctly', () => {
    fixture.componentRef.setInput('total', 100);
    fixture.componentRef.setInput('perPage', 10);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(10);
  });

  it('should emit pageChange when page button is clicked', () => {
    fixture.componentRef.setInput('total', 50);
    fixture.componentRef.setInput('perPage', 10);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    const spy = vi.fn();
    component.pageChange.subscribe(spy);

    component.goToPage(2);
    expect(spy).toHaveBeenCalledWith({ page: 2, perPage: 10 });
  });

  it('should disable prev button on first page', () => {
    fixture.componentRef.setInput('total', 50);
    fixture.componentRef.setInput('perPage', 10);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    const prevBtn = fixture.nativeElement.querySelector('.page-nav-btn');
    expect(prevBtn.disabled).toBe(true);
  });
});
