import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExportsPageComponent } from './exports-page.component';
import { ExportService } from '../services/export.service';
import { PrintService } from '@core/services/print.service';
import { CaisseService } from '../../caisse/services/caisse.service';
import { CatheoPopulationService } from '../../catheo-population/services/catheo-population.service';
import { OrganisationContextService } from '@core/services/organisation-context.service';
import { ToastService } from '@core/services/toast.service';
import { CampagnePelerinage } from '../../pelerinages/models/pelerinage.model';

describe('ExportsPageComponent', () => {
  let component: ExportsPageComponent;
  let fixture: ComponentFixture<ExportsPageComponent>;

  let exportServiceSpy: {
    exportMembresCsv: ReturnType<typeof vi.fn>;
    exportActivitesCsv: ReturnType<typeof vi.fn>;
    exportCaisseCsv: ReturnType<typeof vi.fn>;
    exportParticipantsPelerinageCsv: ReturnType<typeof vi.fn>;
    exportCatheoPopulationCsv: ReturnType<typeof vi.fn>;
    downloadBlobFile: ReturnType<typeof vi.fn>;
  };

  let printServiceSpy: {
    printDocument: ReturnType<typeof vi.fn>;
  };

  let caisseServiceSpy: {
    getCampagnes: ReturnType<typeof vi.fn>;
  };

  let catheoPopulationSpy: {
    getPopulation: ReturnType<typeof vi.fn>;
  };

  let toastSpy: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  let orgContextSpy: {
    context: ReturnType<typeof vi.fn>;
    typeOrganisation: ReturnType<typeof vi.fn>;
  };

  const mockCampagne: CampagnePelerinage = {
    id: 1,
    uuid: 'uuid-1',
    organisation_id: 10,
    nom: 'Pèlerinage Lourdes 2026',
    code: 'PEL-2026-01',
    description: 'Campagne annuelle',
    destination: 'Lourdes, France',
    date_depart: '2026-08-01',
    date_fin: '2026-08-10',
    statut: 'ouverte',
    total_inscrits: 35,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    exportServiceSpy = {
      exportMembresCsv: vi.fn(),
      exportActivitesCsv: vi.fn(),
      exportCaisseCsv: vi.fn(),
      exportParticipantsPelerinageCsv: vi.fn(),
      exportCatheoPopulationCsv: vi.fn(),
      downloadBlobFile: vi.fn(),
    };

    printServiceSpy = {
      printDocument: vi.fn(),
    };

    caisseServiceSpy = {
      getCampagnes: vi.fn().mockReturnValue(of([mockCampagne])),
    };

    catheoPopulationSpy = {
      getPopulation: vi.fn().mockReturnValue(of({ data: [], meta: { total: 0 } })),
    };

    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    orgContextSpy = {
      context: vi.fn().mockReturnValue({ nom: 'Paroisse Sainte Famille', code: 'OPPE-001', type_organisation: 'OPPE' }),
      typeOrganisation: vi.fn().mockReturnValue('OPPE'),
    };

    await TestBed.configureTestingModule({
      imports: [ExportsPageComponent],
      providers: [
        { provide: ExportService, useValue: exportServiceSpy },
        { provide: PrintService, useValue: printServiceSpy },
        { provide: CaisseService, useValue: caisseServiceSpy },
        { provide: CatheoPopulationService, useValue: catheoPopulationSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: OrganisationContextService, useValue: orgContextSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load available campaigns', () => {
    expect(component).toBeTruthy();
    expect(component.campagnes().length).toBe(1);
    expect(component.selectedCampagneId()).toBe(1);
  });

  it('should export membres CSV and notify user', () => {
    const blob = new Blob(['data'], { type: 'text/csv' });
    exportServiceSpy.exportMembresCsv.mockReturnValue(of(blob));

    component.exportMembresCsv();

    expect(exportServiceSpy.exportMembresCsv).toHaveBeenCalled();
    expect(exportServiceSpy.downloadBlobFile).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalledWith(
      'Export réussi',
      expect.stringContaining('membres')
    );
  });

  it('should handle error when exporting membres CSV fails', () => {
    exportServiceSpy.exportMembresCsv.mockReturnValue(throwError(() => new Error('Server error')));

    component.exportMembresCsv();

    expect(toastSpy.error).toHaveBeenCalledWith(
      "Erreur d'export",
      expect.stringContaining('membres')
    );
  });

  it('should export activites CSV', () => {
    const blob = new Blob(['activites'], { type: 'text/csv' });
    exportServiceSpy.exportActivitesCsv.mockReturnValue(of(blob));

    component.exportActivitesCsv();

    expect(exportServiceSpy.exportActivitesCsv).toHaveBeenCalled();
    expect(exportServiceSpy.downloadBlobFile).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalled();
  });

  it('should export caisse operations CSV', () => {
    const blob = new Blob(['caisse'], { type: 'text/csv' });
    exportServiceSpy.exportCaisseCsv.mockReturnValue(of(blob));

    component.exportCaisseCsv();

    expect(exportServiceSpy.exportCaisseCsv).toHaveBeenCalled();
    expect(exportServiceSpy.downloadBlobFile).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalled();
  });

  it('should export pelerinage participants CSV for selected campaign', () => {
    const blob = new Blob(['participants'], { type: 'text/csv' });
    exportServiceSpy.exportParticipantsPelerinageCsv.mockReturnValue(of(blob));

    component.selectedCampagneId.set(1);
    component.exportParticipantsCsv('embarquement');

    expect(exportServiceSpy.exportParticipantsPelerinageCsv).toHaveBeenCalledWith(1, {
      type_export: 'embarquement',
    });
    expect(exportServiceSpy.downloadBlobFile).toHaveBeenCalled();
    expect(toastSpy.success).toHaveBeenCalled();
  });

  it('should export catheo population CSV when data exists', () => {
    const mockCatheo = [
      { id: 1, catechumene: { nom: 'KOUASSI' } },
    ] as any;
    catheoPopulationSpy.getPopulation.mockReturnValue(of({ data: mockCatheo, meta: { total: 1 } }));

    component.exportCatheoPopulationCsv();

    expect(catheoPopulationSpy.getPopulation).toHaveBeenCalled();
    expect(exportServiceSpy.exportCatheoPopulationCsv).toHaveBeenCalledWith(mockCatheo, 'OPPE-001');
    expect(toastSpy.success).toHaveBeenCalled();
  });
});
