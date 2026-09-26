import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { OrganisationSummaryCardComponent } from './organisation-summary-card.component';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';

describe('OrganisationSummaryCardComponent', () => {
  let fixture: ComponentFixture<OrganisationSummaryCardComponent>;

  const mockOrg: SuperAdminOrganisation = {
    id: 1,
    code: 'OPPE-CIM',
    nom: 'Enfance Missionnaire',
    type_organisation: 'OPPE',
    statut: 'actif',
    paroisse: {
      nom_paroisse: 'Coeur Immaculé de Marie',
      diocese: 'Abidjan',
    },
    produit: {
      id: 2,
      code: 'OPPE',
      nom: 'Office Paroissial de la Pastorale des Enfants (OPPE)',
    },
    responsable_nom: 'Abbé Paul',
    responsable_email: 'paul@catheo.org',
    users_count: 5,
    membres_count: 140,
    activites_count: 15,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrganisationSummaryCardComponent],
    });

    fixture = TestBed.createComponent(OrganisationSummaryCardComponent);
    fixture.componentRef.setInput('organisation', mockOrg);
    fixture.detectChanges();
  });

  it('devrait afficher le nom de l’organisation et les données associées', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Enfance Missionnaire');
    expect(text).toContain('OPPE-CIM');
    expect(text).toContain('Coeur Immaculé de Marie');
    expect(text).toContain('Abidjan');
    expect(text).toContain('Abbé Paul');
    expect(text).toContain('paul@catheo.org');
    expect(text).toContain('5');
    expect(text).toContain('140');
    expect(text).toContain('15');
  });
});
