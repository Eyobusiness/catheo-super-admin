import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { PelerinageService } from './pelerinage.service';
import {
  CampagnePelerinage,
  InscriptionPelerinage,
  PaiementPelerinage,
  TarifPelerinage,
} from '../models/pelerinage.model';

describe('PelerinageService', () => {
  let service: PelerinageService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockCampagne: CampagnePelerinage = {
    id: 1,
    uuid: 'campagne-uuid-1',
    organisation_id: 10,
    code: 'PEL-2026-0001',
    nom: 'Pèlerinage Marial Issia 2026',
    destination: "Sanctuaire Notre Dame d'Issia",
    lieu_depart: 'Paroisse Sainte Famille',
    date_depart: '2026-05-15',
    date_fin: '2026-05-17',
    capacite: 150,
    places_occupees: 45,
    est_complete: false,
    statut: 'ouverte',
  };

  const mockTarif: TarifPelerinage = {
    id: 1,
    uuid: 'tarif-uuid-1',
    campagne_pelerinage_id: 1,
    code: 'TAR-STD',
    libelle: 'Tarif Standard',
    montant: 25000,
    devise: 'XOF',
    statut: 'actif',
  };

  const mockInscription: InscriptionPelerinage = {
    id: 1,
    uuid: 'ins-uuid-1',
    campagne_pelerinage_id: 1,
    tarif_pelerinage_id: 1,
    type_participant: 'EXTERNE',
    reference: 'INS-PEL-2026-0001-0001',
    nom: 'KOUASSI',
    prenoms: 'Emmanuel',
    nom_complet: 'KOUASSI Emmanuel',
    montant: 25000,
    montant_paye: 10000,
    reste_a_payer: 15000,
    statut_inscription: 'partiellement_payee',
    statut_participation: 'prevue',
  };

  const mockPaiement: PaiementPelerinage = {
    id: 1,
    uuid: 'paiement-uuid-1',
    inscription_pelerinage_id: 1,
    reference: 'PAI-PEL-2026-0001-0001',
    montant: 10000,
    devise: 'XOF',
    mode_paiement: 'espece',
    date_paiement: '2026-05-01T10:00:00Z',
    statut: 'valide',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PelerinageService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(PelerinageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Campagnes CRUD & Lifecycle', () => {
    it('should fetch list of campagnes with default params', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockCampagne],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service.getCampagnes().subscribe((res) => {
        expect(res.data).toEqual([mockCampagne]);
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages', {
        params: {},
      });
    });

    it('should send filter parameters when provided', () => {
      mockApiClient.get.mockReturnValue(of({ data: [], meta: { total: 0 } }));

      service
        .getCampagnes({
          search: 'Issia',
          statut: 'ouverte',
          date_depart_min: '2026-05-01',
          page: 2,
          per_page: 20,
        })
        .subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages', {
        params: {
          search: 'Issia',
          statut: 'ouverte',
          date_depart_min: '2026-05-01',
          page: 2,
          per_page: 20,
        },
      });
    });

    it('should get detail of a campagne with stats', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: mockCampagne,
          stats: { montant_attendu: 500000, montant_collecte: 200000, solde_restant: 300000 },
        })
      );

      service.getCampagne(1).subscribe((res) => {
        expect(res.data).toEqual(mockCampagne);
        expect(res.stats?.montant_attendu).toBe(500000);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages/1');
    });

    it('should create a campagne', () => {
      mockApiClient.post.mockReturnValue(of({ data: mockCampagne }));

      service
        .createCampagne({
          nom: 'Pèlerinage Marial Issia 2026',
          destination: 'Issia',
          lieu_depart: 'Abidjan',
          date_depart: '2026-05-15',
          date_fin: '2026-05-17',
        })
        .subscribe((res) => {
          expect(res).toEqual(mockCampagne);
        });

      expect(mockApiClient.post).toHaveBeenCalledWith('organisation/pelerinages', expect.any(Object));
    });

    it('should update a campagne', () => {
      mockApiClient.put.mockReturnValue(of({ data: mockCampagne }));

      service.updateCampagne(1, { nom: 'Nouveau Nom' }).subscribe((res) => {
        expect(res).toEqual(mockCampagne);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('organisation/pelerinages/1', {
        nom: 'Nouveau Nom',
      });
    });

    it('should delete a campagne', () => {
      mockApiClient.delete.mockReturnValue(of(undefined));

      service.deleteCampagne(1).subscribe();

      expect(mockApiClient.delete).toHaveBeenCalledWith('organisation/pelerinages/1');
    });

    it('should open a campagne', () => {
      mockApiClient.patch.mockReturnValue(of({ data: { ...mockCampagne, statut: 'ouverte' } }));

      service.ouvrirCampagne(1).subscribe((res) => {
        expect(res.statut).toBe('ouverte');
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('organisation/pelerinages/1/ouvrir', {});
    });

    it('should close a campagne and return cancelled inscriptions count', () => {
      mockApiClient.patch.mockReturnValue(
        of({
          data: { ...mockCampagne, statut: 'cloturee' },
          meta: { inscriptions_annulees: 3 },
        })
      );

      service.cloturerCampagne(1).subscribe((res) => {
        expect(res.campagne.statut).toBe('cloturee');
        expect(res.inscriptions_annulees).toBe(3);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('organisation/pelerinages/1/cloturer', {});
    });

    it('should cancel a campagne with motif', () => {
      mockApiClient.patch.mockReturnValue(of({ data: { ...mockCampagne, statut: 'annulee' } }));

      service.annulerCampagne(1, 'Intempéries').subscribe((res) => {
        expect(res.statut).toBe('annulee');
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('organisation/pelerinages/1/annuler', {
        motif: 'Intempéries',
      });
    });
  });

  describe('Tarifs CRUD', () => {
    it('should fetch tarifs of a campagne', () => {
      mockApiClient.get.mockReturnValue(of({ data: [mockTarif] }));

      service.getTarifs(1).subscribe((res) => {
        expect(res).toEqual([mockTarif]);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages/1/tarifs');
    });

    it('should create a tarif for a campagne', () => {
      mockApiClient.post.mockReturnValue(of({ data: mockTarif }));

      service.createTarif(1, { libelle: 'Standard', montant: 25000 }).subscribe((res) => {
        expect(res).toEqual(mockTarif);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('organisation/pelerinages/1/tarifs', {
        libelle: 'Standard',
        montant: 25000,
      });
    });

    it('should delete a tarif', () => {
      mockApiClient.delete.mockReturnValue(of(undefined));

      service.deleteTarif(1, 10).subscribe();

      expect(mockApiClient.delete).toHaveBeenCalledWith('organisation/pelerinages/1/tarifs/10');
    });
  });

  describe('Inscriptions & Participants', () => {
    it('should fetch inscriptions of a campagne with filters', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockInscription],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service
        .getInscriptions(1, {
          search: 'Kouassi',
          statut_inscription: 'partiellement_payee',
          type_participant: 'EXTERNE',
        })
        .subscribe((res) => {
          expect(res.data).toEqual([mockInscription]);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages/1/inscriptions', {
        params: {
          search: 'Kouassi',
          statut_inscription: 'partiellement_payee',
          type_participant: 'EXTERNE',
        },
      });
    });

    it('should create an inscription', () => {
      mockApiClient.post.mockReturnValue(of({ data: mockInscription }));

      service
        .createInscription(1, {
          tarif_pelerinage_id: 1,
          type_participant: 'EXTERNE',
          nom: 'KOUASSI',
          prenoms: 'Emmanuel',
        })
        .subscribe((res) => {
          expect(res).toEqual(mockInscription);
        });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions',
        expect.any(Object)
      );
    });

    it('should update participation presence', () => {
      mockApiClient.patch.mockReturnValue(
        of({ data: { ...mockInscription, statut_participation: 'presente' } })
      );

      service.updateParticipation(1, 1, 'presente').subscribe((res) => {
        expect(res.statut_participation).toBe('presente');
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions/1/participation',
        { statut_participation: 'presente' }
      );
    });

    it('should cancel an inscription', () => {
      mockApiClient.patch.mockReturnValue(
        of({ data: { ...mockInscription, statut_inscription: 'annulee' } })
      );

      service.annulerInscription(1, 1, 'Désistement').subscribe((res) => {
        expect(res.statut_inscription).toBe('annulee');
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions/1/annuler',
        { motif: 'Désistement' }
      );
    });
  });

  describe('Paiements de Pèlerinage', () => {
    it('should fetch journal of paiements for a campagne', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockPaiement],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service.getCampagnePaiements(1, { statut: 'valide' }).subscribe((res) => {
        expect(res.data).toEqual([mockPaiement]);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/pelerinages/1/paiements', {
        params: { statut: 'valide' },
      });
    });

    it('should record a paiement for an inscription', () => {
      mockApiClient.post.mockReturnValue(
        of({
          data: mockPaiement,
          inscription: mockInscription,
        })
      );

      service
        .createPaiement(1, 1, {
          montant: 10000,
          mode_paiement: 'espece',
        })
        .subscribe((res) => {
          expect(res.paiement).toEqual(mockPaiement);
          expect(res.inscription).toEqual(mockInscription);
        });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'organisation/pelerinages/1/inscriptions/1/paiements',
        { montant: 10000, mode_paiement: 'espece' }
      );
    });

    it('should cancel a paiement', () => {
      mockApiClient.post.mockReturnValue(
        of({
          data: { ...mockPaiement, statut: 'annule' },
          inscription: mockInscription,
        })
      );

      service.annulerPaiement(1, 1, 'Erreur de saisie').subscribe((res) => {
        expect(res.paiement.statut).toBe('annule');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'organisation/pelerinages/1/paiements/1/annuler',
        { motif: 'Erreur de saisie' }
      );
    });
  });
});
