import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { AbonnementFormComponent } from './abonnement-form.component';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { FormuleService } from '../../../formules/services/formule.service';
import { Paroisse } from '../../../paroisses/models/paroisse.model';
import { Formule } from '../../../formules/models/formule.model';

describe('AbonnementFormComponent', () => {
  let component: AbonnementFormComponent;
  let fixture: ComponentFixture<AbonnementFormComponent>;

  const mockParoisses: Paroisse[] = [
    {
      id: 'paroisse-1',
      id_interne: 1,
      code_paroisse: 'PSM',
      nom_paroisse: 'Saint-Michel',
      diocese: 'Abidjan',
      doyenne: 'Centre',
      telephone: '0102030405',
      email: 'psm@catheo.ci',
      statut: 'actif',
      ville: 'Abidjan',
      commune: 'Cocody',
      total_abonnements: 0,
      produits_souscrits: [],
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const mockFormulePayante: Formule = {
    id: 10,
    uuid: 'uuid-10',
    produit_id: 'prod-catheo',
    code: 'CATHEO-STD',
    nom: 'CATHEO Standard Annuel',
    description: 'Gestion complète',
    periodicite: 'annuelle',
    montant: 50000,
    devise: 'XOF',
    est_gratuite: false,
    statut: 'actif',
    ordre: 1,
    produit: { id: 'prod-catheo', code: 'CATHEO', nom: 'CATHEO' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const mockFormuleGratuite: Formule = {
    id: 20,
    uuid: 'uuid-20',
    produit_id: 'prod-oppe',
    code: 'OPPE-FREE',
    nom: 'OPPE Découverte Gratuite',
    description: 'Essai gratuit',
    periodicite: 'mensuelle',
    montant: 0,
    devise: 'XOF',
    est_gratuite: true,
    statut: 'actif',
    ordre: 2,
    produit: { id: 'prod-oppe', code: 'OPPE', nom: 'OPPE' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  let paroisseServiceMock: { getParoisses: ReturnType<typeof vi.fn> };
  let formuleServiceMock: { getFormules: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    paroisseServiceMock = {
      getParoisses: vi.fn().mockReturnValue(
        of({
          data: mockParoisses,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        })
      ),
    };

    formuleServiceMock = {
      getFormules: vi.fn().mockReturnValue(
        of({
          data: [mockFormulePayante, mockFormuleGratuite],
          meta: { current_page: 1, last_page: 1, total: 2, per_page: 100 },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AbonnementFormComponent],
      providers: [
        { provide: ParoisseService, useValue: paroisseServiceMock },
        { provide: FormuleService, useValue: formuleServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AbonnementFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être initialisé et charger les paroisses et formules actives', () => {
    expect(component).toBeTruthy();
    expect(paroisseServiceMock.getParoisses).toHaveBeenCalled();
    expect(formuleServiceMock.getFormules).toHaveBeenCalled();
  });

  it('devrait afficher les détails financiers quand une formule payante est sélectionnée', () => {
    component['form'].patchValue({ formule_id: 10 });
    fixture.detectChanges();

    const selected = component['selectedFormule']();
    expect(selected).toBeTruthy();
    expect(selected?.est_gratuite).toBe(false);
    expect(selected?.montant).toBe(50000);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('XOF');
    expect(compiled.textContent).toContain('figé lors de la souscription');
  });

  it('devrait afficher l’avertissement formule gratuite quand sélectionnée', () => {
    component['form'].patchValue({ formule_id: 20 });
    fixture.detectChanges();

    const selected = component['selectedFormule']();
    expect(selected).toBeTruthy();
    expect(selected?.est_gratuite).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('FORMULE GRATUITE');
    expect(compiled.textContent).toContain("Montant de l'abonnement : 0 XOF");
  });

  it('devrait émettre formSubmit avec les données valides', () => {
    let submittedData: unknown = null;
    component.formSubmit.subscribe((d) => (submittedData = d));

    component['form'].patchValue({
      paroisse_configuration_id: 'paroisse-1',
      formule_id: 10,
      date_debut: '2026-02-01',
      date_fin: '2027-01-31',
      renouvellement_automatique: true,
      observation: 'Test souscription',
    });

    component.onSubmit();

    expect(submittedData).toEqual({
      paroisse_configuration_id: 'paroisse-1',
      formule_id: 10,
      date_debut: '2026-02-01',
      date_fin: '2027-01-31',
      renouvellement_automatique: true,
      observation: 'Test souscription',
    });
  });

  it('ne devrait pas émettre si le formulaire est invalide', () => {
    let submitted = false;
    component.formSubmit.subscribe(() => (submitted = true));

    component['form'].patchValue({
      paroisse_configuration_id: '',
      formule_id: null,
    });

    component.onSubmit();
    expect(submitted).toBe(false);
  });

  it('devrait empêcher la double soumission lorsque loading est true', () => {
    let submitted = false;
    component.formSubmit.subscribe(() => (submitted = true));

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    component['form'].patchValue({
      paroisse_configuration_id: 'paroisse-1',
      formule_id: 10,
      date_debut: '2026-02-01',
    });

    component.onSubmit();
    expect(submitted).toBe(false);
  });
});
