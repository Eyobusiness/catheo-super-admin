import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RapportsPageComponent } from './rapports-page.component';
import { RapportService } from '../services/rapport.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { RapportAnnuel } from '../models/rapport.model';

describe('RapportsPageComponent', () => {
  let component: RapportsPageComponent;
  let fixture: ComponentFixture<RapportsPageComponent>;
  let rapportServiceSpy: {
    getRapportAnnuel: ReturnType<typeof vi.fn>;
  };
  let orgContextSpy: {
    typeOrganisation: ReturnType<typeof vi.fn>;
  };

  const mockRapportConnected: RapportAnnuel = {
    annee_exercice: 2026,
    organisation: {
      id: 1,
      nom: 'OPPE Sainte Famille',
      code: 'OPPE-001',
      type_organisation: 'OPPE',
    },
    membres: {
      total: 120,
      actifs: 110,
      inactifs: 10,
      nouvelles_adhesions: 15,
    },
    activites: {
      total: 12,
      repartition_statut: { terminee: 8, planifiee: 4 },
      taux_moyen_execution: 88.0,
    },
    pelerinages: {
      campagnes: 2,
      total_participants: 95,
      presents: 90,
      absents: 5,
      taux_presence: 94.74,
    },
    finances: {
      total_entrees: 4500000,
      total_sorties: 1100000,
      solde_net: 3400000,
    },
    catheo: {
      catheo_connecte: true,
      annee_catechese: '2025-2026',
      total_population: 340,
      sections: ['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL'],
    },
  };

  const mockRapportAutonomous: RapportAnnuel = {
    ...mockRapportConnected,
    catheo: {
      catheo_connecte: false,
    },
  };

  beforeEach(async () => {
    rapportServiceSpy = {
      getRapportAnnuel: vi.fn().mockReturnValue(of(mockRapportConnected)),
    };
    orgContextSpy = {
      typeOrganisation: vi.fn().mockReturnValue('OPPE'),
    };

    await TestBed.configureTestingModule({
      imports: [RapportsPageComponent],
      providers: [
        { provide: RapportService, useValue: rapportServiceSpy },
        { provide: OrganisationContextService, useValue: orgContextSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load annual report on init', () => {
    expect(component).toBeTruthy();
    expect(rapportServiceSpy.getRapportAnnuel).toHaveBeenCalledWith(component.selectedAnnee());
    expect(component.rapport()).toEqual(mockRapportConnected);
    expect(component.typeOrganisation()).toBe('OPPE');
  });

  it('should change year and reload report', () => {
    const mockEvent = { target: { value: '2025' } } as any;
    component.onAnneeChange(mockEvent);

    expect(component.selectedAnnee()).toBe(2025);
    expect(rapportServiceSpy.getRapportAnnuel).toHaveBeenCalledWith(2025);
  });

  it('should handle error when report fails to load', () => {
    rapportServiceSpy.getRapportAnnuel.mockReturnValue(
      throwError(() => ({ error: { message: 'Exercice non clôturé' } }))
    );

    component.loadRapport();
    expect(component.errorMessage()).toBe('Exercice non clôturé');
    expect(component.isLoading()).toBe(false);
  });

  it('should display autonomous organisation CATHEO state correctly', () => {
    rapportServiceSpy.getRapportAnnuel.mockReturnValue(of(mockRapportAutonomous));
    component.loadRapport();
    fixture.detectChanges();

    expect(component.rapport()?.catheo.catheo_connecte).toBe(false);
  });
});
