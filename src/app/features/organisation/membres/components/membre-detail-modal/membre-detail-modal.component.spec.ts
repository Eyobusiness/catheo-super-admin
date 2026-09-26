import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MembreDetailModalComponent } from './membre-detail-modal.component';
import { Membre } from '../../models/membre.model';

describe('MembreDetailModalComponent', () => {
  let component: MembreDetailModalComponent;
  let fixture: ComponentFixture<MembreDetailModalComponent>;

  const mockMembre: Membre = {
    id: 'uuid-1',
    id_interne: 10,
    nom: 'YAO',
    prenoms: 'Awa Solange',
    nom_complet: 'YAO Awa Solange',
    sexe: 'F',
    date_naissance: '1995-10-20',
    telephone: '0505050505',
    email: 'solange.yao@catheo.ci',
    quartier: 'Yopougon Maroc',
    adresse: 'Rue 12, Lot 4',
    fonction: 'Secrétaire générale',
    date_entree: '2023-09-01',
    statut: 'actif',
    photo_path: null,
    observation: 'Responsable logistique des pèlerinages',
    created_at: '2023-09-01T08:00:00Z',
    updated_at: '2023-09-01T08:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MembreDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('membre', mockMembre);
    fixture.componentRef.setInput('canManage', true);
    fixture.detectChanges();
  });

  it('should create and render membre details', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('YAO Awa Solange');
    expect(el.textContent).toContain('Secrétaire générale');
    expect(el.textContent).toContain('0505050505');
    expect(el.textContent).toContain('solange.yao@catheo.ci');
    expect(el.textContent).toContain('Yopougon Maroc');
    expect(el.textContent).toContain('Responsable logistique des pèlerinages');
  });

  it('should emit close when close button or modal is closed', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit edit with the membre when edit button is clicked', () => {
    const editSpy = vi.spyOn(component.edit, 'emit');
    component.onEdit(mockMembre);
    expect(editSpy).toHaveBeenCalledWith(mockMembre);
  });

  it('should not display edit button if canManage is false', () => {
    fixture.componentRef.setInput('canManage', false);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button[icon="pencil"]')).toBeFalsy();
  });
});
