import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActiviteDetailModalComponent } from './activite-detail-modal.component';
import { Activite } from '../../models/activite.model';

describe('ActiviteDetailModalComponent', () => {
  let component: ActiviteDetailModalComponent;
  let fixture: ComponentFixture<ActiviteDetailModalComponent>;

  const mockActivite: Activite = {
    id: 'uuid-activite-1',
    id_interne: 101,
    organisation_id: 1,
    code: 'ACT-2024-01',
    titre: 'Récollection paroissiale',
    description: 'Journée de prière et de formation',
    type_activite: 'Récollection',
    date_debut: '2024-11-15T08:30:00Z',
    date_fin: '2024-11-15T17:00:00Z',
    lieu: 'Salle polyvalente',
    responsable_id: 10,
    responsable: {
      id: 'uuid-membre-1',
      id_interne: 10,
      nom: 'KOUAME',
      prenoms: 'Jean-Marc',
      nom_complet: 'KOUAME Jean-Marc',
      sexe: 'M',
      telephone: '0701020304',
      fonction: 'Coordinateur',
      statut: 'actif',
    },
    statut: 'planifiee',
    taux_execution: 50,
    observation: 'Prévoir sonorisation',
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiviteDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiviteDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('activite', mockActivite);
    fixture.componentRef.setInput('canEdit', true);
    fixture.detectChanges();
  });

  it('should create and render activite details', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Récollection paroissiale');
    expect(el.textContent).toContain('ACT-2024-01');
    expect(el.textContent).toContain('Récollection');
    expect(el.textContent).toContain('Salle polyvalente');
    expect(el.textContent).toContain('KOUAME Jean-Marc');
    expect(el.textContent).toContain('Coordinateur');
    expect(el.textContent).toContain('50%');
    expect(el.textContent).toContain('Journée de prière et de formation');
    expect(el.textContent).toContain('Prévoir sonorisation');
  });

  it('should emit close when close button or modal is closed', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit edit when edit button is clicked', () => {
    const editSpy = vi.spyOn(component.edit, 'emit');
    component.onEdit(mockActivite);
    expect(editSpy).toHaveBeenCalledWith(mockActivite);
  });

  it('should hide edit button when canEdit is false', () => {
    fixture.componentRef.setInput('canEdit', false);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button[icon="pencil"]')).toBeFalsy();
  });
});
