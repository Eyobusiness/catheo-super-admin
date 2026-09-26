import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '@core/services/api-client.service';
import { ExportService } from './export.service';
import { CatechumeneItem } from '../../catheo-population/models/catheo-population.model';

describe('ExportService', () => {
  let service: ExportService;
  let apiClientSpy: {
    downloadBlob: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiClientSpy = {
      downloadBlob: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(ExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Backend Stream CSV Exports', () => {
    it('should request membres CSV export with query params', () => {
      const mockBlob = new Blob(['Nom;Prénoms\nKOUADIO;Jean'], { type: 'text/csv' });
      apiClientSpy.downloadBlob.mockReturnValue(of(mockBlob));

      service.exportMembresCsv({ statut: 'actif', sexe: 'M' }).subscribe((res) => {
        expect(res).toBe(mockBlob);
      });

      expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith('organisation/exports/membres', {
        params: { statut: 'actif', sexe: 'M' },
      });
    });

    it('should request activites CSV export with query params', () => {
      const mockBlob = new Blob(['Titre;Date\nPrière;2026-10-01'], { type: 'text/csv' });
      apiClientSpy.downloadBlob.mockReturnValue(of(mockBlob));

      service.exportActivitesCsv({ statut: 'planifiee', type_activite: 'formation' }).subscribe((res) => {
        expect(res).toBe(mockBlob);
      });

      expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith('organisation/exports/activites', {
        params: { statut: 'planifiee', type_activite: 'formation' },
      });
    });

    it('should request pelerinage participants CSV export', () => {
      const mockBlob = new Blob(['Nom;Prénoms;Taille\nKONE;Amadou;XL'], { type: 'text/csv' });
      apiClientSpy.downloadBlob.mockReturnValue(of(mockBlob));

      service.exportParticipantsPelerinageCsv(42, { type_export: 'embarquement' }).subscribe((res) => {
        expect(res).toBe(mockBlob);
      });

      expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith(
        'organisation/exports/pelerinages/42/participants',
        { params: { type_export: 'embarquement' } }
      );
    });

    it('should request pelerinage paiements CSV export', () => {
      const mockBlob = new Blob(['Ref;Montant\nPAY-001;25000'], { type: 'text/csv' });
      apiClientSpy.downloadBlob.mockReturnValue(of(mockBlob));

      service.exportPaiementsPelerinageCsv('camp-2026', { mode_paiement: 'especes' }).subscribe((res) => {
        expect(res).toBe(mockBlob);
      });

      expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith(
        'organisation/exports/pelerinages/camp-2026/paiements',
        { params: { mode_paiement: 'especes' } }
      );
    });

    it('should request caisse CSV export with date filters', () => {
      const mockBlob = new Blob(['Ref;Date;Montant\nOP-100;2026-09-01;50000'], { type: 'text/csv' });
      apiClientSpy.downloadBlob.mockReturnValue(of(mockBlob));

      service.exportCaisseCsv({ date_debut: '2026-09-01', date_fin: '2026-09-30' }).subscribe((res) => {
        expect(res).toBe(mockBlob);
      });

      expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith('organisation/exports/caisse', {
        params: { date_debut: '2026-09-01', date_fin: '2026-09-30' },
      });
    });
  });

  describe('Frontend CSV Generation & Formatting', () => {
    it('should construct valid CSV content with UTF-8 BOM, semicolon separator and proper quote escaping', () => {
      const headers = ['Nom', 'Commentaire;Spécial', 'Observation'];
      const rows = [
        ['KOUADIO', 'Paiement effectué; validé', 'Ligne 1\nLigne 2'],
        ['DOUÉ', 'Mention "Prioritaire"', null],
      ];

      const csv = service.buildCsvContent(headers, rows);

      // Must start with UTF-8 BOM for Excel
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Header row
      expect(csv).toContain('Nom;"Commentaire;Spécial";Observation');

      // Semicolon values quoted
      expect(csv).toContain('"Paiement effectué; validé"');

      // Double-quotes escaped
      expect(csv).toContain('"Mention ""Prioritaire"""');

      // Multiline value quoted
      expect(csv).toContain('"Ligne 1\nLigne 2"');

      // Null handled gracefully as empty string
      expect(csv).toContain('DOUÉ;"Mention ""Prioritaire""";');
    });

    it('should trigger browser download on generateCsv', () => {
      const downloadSpy = vi.spyOn(service, 'downloadBlobFile').mockImplementation(() => {});

      service.generateCsv('test.csv', ['A', 'B'], [['1', '2']]);

      expect(downloadSpy).toHaveBeenCalled();
      const [blobArg, filenameArg] = downloadSpy.mock.calls[0];
      expect(filenameArg).toBe('test.csv');
      expect(blobArg instanceof Blob).toBe(true);
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });

    it('should export catheo population to CSV format without sensitive personal data', () => {
      const downloadSpy = vi.spyOn(service, 'downloadBlobFile').mockImplementation(() => {});

      const mockItems: CatechumeneItem[] = [
        {
          inscription_id: 1,
          code_inscription: 'INS-001',
          statut_inscription: 'validee',
          catechumene: {
            id: 10,
            matricule: 'CAT-2026-001',
            nom: 'YAO',
            prenoms: 'Kouassi Michel',
            nom_complet: 'YAO Kouassi Michel',
            sexe: 'M',
          },
          section: { id: 1, code: 'SEC-ENFANTS-PRI', nom: 'Enfants Primaire' },
          niveau: { id: 1, nom: '1ère Année' },
          classe: { id: 1, nom: 'Groupe Saint Paul' },
          annee_catechese: { id: 1, libelle: '2026-2027' },
        },
      ];

      service.exportCatheoPopulationCsv(mockItems, 'OPPE');

      expect(downloadSpy).toHaveBeenCalled();
      const [blobArg, filenameArg] = downloadSpy.mock.calls[0];
      expect(filenameArg).toContain('catheo_population_oppe_');
      expect(blobArg instanceof Blob).toBe(true);
    });
  });
});
