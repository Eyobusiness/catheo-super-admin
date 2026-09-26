import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatechumeneDetailModalComponent } from './catechumene-detail-modal.component';
import { CatechumeneItem } from '../../models/catheo-population.model';

describe('CatechumeneDetailModalComponent', () => {
  let component: CatechumeneDetailModalComponent;
  let fixture: ComponentFixture<CatechumeneDetailModalComponent>;

  const mockItem: CatechumeneItem = {
    inscription_id: 'inscr-01',
    code_inscription: 'INSCR-2026-001',
    date_inscription: '2026-09-10',
    statut_inscription: 'validee',
    catechumene: {
      id: 'cat-01',
      matricule: 'CAT-2026-001',
      nom: 'KOUASSI',
      prenoms: 'Jean-Philippe',
      nom_complet: 'KOUASSI Jean-Philippe',
      sexe: 'M',
      date_naissance: '2015-05-20',
      telephone: '0707070707',
      email: 'jean.kouassi@catheo.ci',
      nom_pere: 'KOUASSI Marc',
      nom_mere: 'YAO Jeanne',
      contact_parent: '0102030405',
    },
    section: {
      id: 1,
      code: 'SEC-ENFANTS-PRI',
      nom: 'Enfants Primaire',
    },
    niveau: {
      id: 2,
      nom: '2ème Année',
    },
    classe: {
      id: 5,
      nom: 'Sainte Thérèse B',
    },
    annee_catechese: {
      id: 10,
      libelle: '2026-2027',
      statut: 'active',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatechumeneDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CatechumeneDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('item', mockItem);
    fixture.detectChanges();
  });

  it('should create and render catechumene information', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('KOUASSI Jean-Philippe');
    expect(el.textContent).toContain('CAT-2026-001');
    expect(el.textContent).toContain('Enfants Primaire');
    expect(el.textContent).toContain('2ème Année');
    expect(el.textContent).toContain('Sainte Thérèse B');
    expect(el.textContent).toContain('2026-2027');
    expect(el.textContent).toContain('0102030405');
  });

  it('should emit close on close button click', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should be strictly read-only and have no edit/delete buttons', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button[icon="pencil"]')).toBeFalsy();
    expect(el.querySelector('button[icon="trash"]')).toBeFalsy();
  });
});
