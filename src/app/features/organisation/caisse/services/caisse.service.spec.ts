import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CaisseService } from './caisse.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { CaisseFilters } from '../models/caisse.model';

describe('CaisseService', () => {
  let service: CaisseService;
  let apiClientSpy: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    downloadBlob: ReturnType<typeof vi.fn>;
  };

  const mockSynthese = {
    periode_debut: '2026-09-01',
    periode_fin: '2026-09-30',
    solde_initial: 50000,
    total_entrees: 200000,
    total_sorties: 20000,
    solde_periode: 180000,
    solde_final: 230000,
    nombre_operations: 5,
  };

  const mockOperations = [
    {
      id: 1,
      uuid: 'op-uuid-1',
      organisation_id: 1,
      reference: 'OP-ORG-2026-0001',
      type_operation: 'entree' as const,
      montant: 25000,
      devise: 'XOF',
      libelle: 'Paiement pèlerinage [Koffi Jean]',
      mode_reglement: 'especes',
      date_operation: '2026-09-23T10:00:00Z',
      statut: 'valide' as const,
      operateur: { id: 2, name: 'Admin OPPE' },
    },
  ];

  beforeEach(() => {
    apiClientSpy = {
      get: vi.fn(),
      post: vi.fn(),
      downloadBlob: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CaisseService,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(CaisseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEtatCaisse', () => {
    it('should call organisation/caisse and return mapped CaisseResponse', () => {
      const mockResponse = {
        status: 'success',
        message: 'État de caisse récupéré avec succès.',
        synthese: mockSynthese,
        data: mockOperations,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      };

      apiClientSpy.get.mockReturnValue(of(mockResponse));

      service.getEtatCaisse().subscribe((res) => {
        expect(res.status).toBe('success');
        expect(res.synthese.solde_final).toBe(230000);
        expect(res.data.length).toBe(1);
        expect(res.data[0].reference).toBe('OP-ORG-2026-0001');
      });

      expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/caisse', {
        params: {},
      });
    });

    it('should forward all valid query filters to organisation/caisse', () => {
      apiClientSpy.get.mockReturnValue(
        of({
          status: 'success',
          synthese: mockSynthese,
          data: [],
          meta: { current_page: 2, last_page: 5, per_page: 10, total: 50 },
        })
      );

      const filters: CaisseFilters = {
        date_debut: '2026-09-01',
        date_fin: '2026-09-20',
        type_operation: 'entree',
        campagne_id: 3,
        search: 'Koffi',
        page: 2,
        per_page: 10,
      };

      service.getEtatCaisse(filters).subscribe();

      expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/caisse', {
        params: {
          date_debut: '2026-09-01',
          date_fin: '2026-09-20',
          type_operation: 'entree',
          campagne_id: 3,
          search: 'Koffi',
          page: 2,
          per_page: 10,
        },
      });
    });

    it('should ignore type_operation when set to tous', () => {
      apiClientSpy.get.mockReturnValue(
        of({
          status: 'success',
          synthese: mockSynthese,
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
        })
      );

      service.getEtatCaisse({ type_operation: 'tous' }).subscribe();

      expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/caisse', {
        params: {},
      });
    });
  });

  describe('getStatistiquesFinances', () => {
    it('should call organisation/statistiques/finances and return finances data', () => {
      const mockFinances = {
        total_entrees: 500000,
        total_sorties: 50000,
        solde: 450000,
        recettes_pelerinages: 400000,
        autres_recettes: 100000,
        evolution_mensuelle: [{ periode: '2026-09', total: 500000 }],
        repartition_modes: [{ mode: 'especes', total: 350000, pourcentage: 70 }],
      };

      apiClientSpy.get.mockReturnValue(of({ status: 'success', data: mockFinances }));

      service.getStatistiquesFinances({ date_debut: '2026-09-01' }).subscribe((data) => {
        expect(data.solde).toBe(450000);
        expect(data.repartition_modes.length).toBe(1);
      });

      expect(apiClientSpy.get).toHaveBeenCalledWith(
        'organisation/statistiques/finances',
        { params: { date_debut: '2026-09-01' } }
      );
    });
  });

  describe('getCampagnes', () => {
    it('should call organisation/pelerinages with per_page 100', () => {
      const mockCampagnes = [{ id: 1, nom: 'Pèlerinage Yamoussoukro 2026' }];
      apiClientSpy.get.mockReturnValue(of({ status: 'success', data: mockCampagnes }));

      service.getCampagnes().subscribe((res) => {
        expect(res.length).toBe(1);
        expect(res[0].nom).toBe('Pèlerinage Yamoussoukro 2026');
      });

      expect(apiClientSpy.get).toHaveBeenCalledWith('organisation/pelerinages', {
        params: { per_page: 100 },
      });
    });
  });

  describe('getPaiementsCampagne', () => {
    it('should call organisation/pelerinages/{campagne}/paiements with filters', () => {
      apiClientSpy.get.mockReturnValue(
        of({
          status: 'success',
          data: [{ id: 10, reference: 'PAY-001' }],
          meta: { current_page: 1, total: 1 },
        })
      );

      service
        .getPaiementsCampagne(1, { statut: 'valide', mode_paiement: 'especes' })
        .subscribe((res) => {
          expect(res.data.length).toBe(1);
          expect(res.data[0].reference).toBe('PAY-001');
        });

      expect(apiClientSpy.get).toHaveBeenCalledWith(
        'organisation/pelerinages/1/paiements',
        {
          params: { statut: 'valide', mode_paiement: 'especes' },
        }
      );
    });
  });

  describe('getPaiementsInscription', () => {
    it('should call organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements', () => {
      const mockResponse = {
        status: 'success',
        data: [{ id: 1, montant: 15000 }],
        meta: {
          montant_total: 30000,
          montant_paye: 15000,
          reste_a_payer: 15000,
          statut: 'partiellement_payee',
        },
      };

      apiClientSpy.get.mockReturnValue(of(mockResponse));

      service.getPaiementsInscription(1, 4).subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.meta.reste_a_payer).toBe(15000);
      });

      expect(apiClientSpy.get).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions/4/paiements'
      );
    });
  });

  describe('enregistrerPaiement', () => {
    it('should post to organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements', () => {
      const payload = {
        montant: 15000,
        mode_paiement: 'especes',
        date_paiement: '2026-09-23',
      };

      const mockResponse = {
        status: 'success',
        data: { id: 5, reference: 'PAY-2026-0005', montant: 15000 },
        inscription: { id: 4, reste_a_payer: 0 },
      };

      apiClientSpy.post.mockReturnValue(of(mockResponse));

      service.enregistrerPaiement(1, 4, payload as any).subscribe((res) => {
        expect(res.paiement.reference).toBe('PAY-2026-0005');
        expect(res.inscription.reste_a_payer).toBe(0);
      });

      expect(apiClientSpy.post).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions/4/paiements',
        payload
      );
    });
  });

  describe('annulerPaiement', () => {
    it('should post to organisation/pelerinages/{campagne}/paiements/{paiement}/annuler', () => {
      const mockResponse = {
        status: 'success',
        data: { id: 5, statut: 'annule' },
        inscription: { id: 4, reste_a_payer: 15000 },
      };

      apiClientSpy.post.mockReturnValue(of(mockResponse));

      service.annulerPaiement(1, 5, 'Erreur saisie').subscribe((res) => {
        expect(res.paiement.statut).toBe('annule');
      });

      expect(apiClientSpy.post).toHaveBeenCalledWith(
        'organisation/pelerinages/1/paiements/5/annuler',
        { motif: 'Erreur saisie' }
      );
    });
  });
});
