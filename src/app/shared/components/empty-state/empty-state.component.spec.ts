import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Aucune donnée');
    fixture.detectChanges();
  });

  it('should create the empty-state component', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and description', () => {
    fixture.componentRef.setInput('title', 'Aucune donnée');
    fixture.componentRef.setInput('description', 'Commencez par ajouter un élément.');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.empty-state-title');
    const desc = fixture.nativeElement.querySelector('.empty-state-desc');

    expect(title.textContent).toContain('Aucune donnée');
    expect(desc.textContent).toContain('Commencez par ajouter un élément.');
  });
});
