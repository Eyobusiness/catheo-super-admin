import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { OrganisationSpaceSelectorComponent } from './organisation-space-selector.component';
import { OrganisationSpace } from '../../models/organisation-space.model';

describe('OrganisationSpaceSelectorComponent', () => {
  let component: OrganisationSpaceSelectorComponent;
  let fixture: ComponentFixture<OrganisationSpaceSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationSpaceSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationSpaceSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the 3 organisation space options (OPPE, OPPJ, OPPA)', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    expect(buttons.length).toBe(3);
  });

  it('should mark all 3 spaces (OPPE, OPPJ, OPPA) as available and enabled', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    expect(buttons[0].classList.contains('disabled')).toBe(false);
    expect(buttons[1].classList.contains('disabled')).toBe(false);
    expect(buttons[2].classList.contains('disabled')).toBe(false);
  });

  it('should emit spaceChange when OPPE is clicked', () => {
    let emitted: OrganisationSpace | undefined;
    component.spaceChange.subscribe((space) => {
      emitted = space;
    });

    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    buttons[0].click();

    expect(emitted).toBe('OPPE');
  });

  it('should emit spaceChange when OPPJ is clicked', () => {
    let emitted: OrganisationSpace | undefined;
    component.spaceChange.subscribe((space) => {
      emitted = space;
    });

    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    buttons[1].click();

    expect(emitted).toBe('OPPJ');
  });

  it('should emit spaceChange when OPPA is clicked', () => {
    let emitted: OrganisationSpace | undefined;
    component.spaceChange.subscribe((space) => {
      emitted = space;
    });

    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    buttons[2].click();

    expect(emitted).toBe('OPPA');
  });

  it('should mark the selected space button with selected and active classes', () => {
    fixture.componentRef.setInput('selectedSpace', 'OPPJ');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.space-btn');
    expect(buttons[0].classList.contains('selected')).toBe(false);
    expect(buttons[1].classList.contains('selected')).toBe(true);
    expect(buttons[2].classList.contains('selected')).toBe(false);
  });
});
