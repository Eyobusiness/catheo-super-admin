import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { OrganisationSpaceModalComponent } from './organisation-space-modal.component';
import { OrganisationSpace } from '../../models/organisation-space.model';

describe('OrganisationSpaceModalComponent', () => {
  let component: OrganisationSpaceModalComponent;
  let fixture: ComponentFixture<OrganisationSpaceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationSpaceModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationSpaceModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit spaceConfirmed with selected space when confirm button is clicked', () => {
    let confirmed: OrganisationSpace | undefined;
    component.spaceConfirmed.subscribe((space) => {
      confirmed = space;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const submitBtn: HTMLElement = fixture.nativeElement.querySelector('.space-modal-actions button');
    expect(submitBtn).toBeTruthy();
    submitBtn.click();

    expect(confirmed).toBe('OPPE');
  });

  it('should allow selecting available spaces such as OPPJ', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.modal-space-item');
    // OPPJ is at index 1
    (items[1] as HTMLElement).click();
    fixture.detectChanges();

    let confirmed: OrganisationSpace | undefined;
    component.spaceConfirmed.subscribe((space) => {
      confirmed = space;
    });

    const submitBtn: HTMLElement = fixture.nativeElement.querySelector('.space-modal-actions button');
    submitBtn.click();

    expect(confirmed).toBe('OPPJ');
  });

  it('should not allow selecting spaces with isAvailable false', () => {
    component.selectSpace({
      code: 'OPPA',
      label: 'OPPA',
      fullLabel: 'Adultes',
      description: 'Adultes',
      populationCodes: ['SEC-ADULTES'],
      isAvailable: false,
      icon: 'bi-mortarboard',
    });

    expect(component.selectedCode()).toBe('OPPE');
  });
});
