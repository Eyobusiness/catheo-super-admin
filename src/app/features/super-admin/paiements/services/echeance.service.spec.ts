import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EcheanceService } from './echeance.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { EcheanceAbonnement } from '../models/echeance.model';
import { Facture } from '../../factures/models/facture.model';

describe('EcheanceService', () => {
  let service: EcheanceService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  const mockEcheance: EcheanceAbonnement = {
    id: 'ech-uuid-1',
    id_interne: 5,
    uuid: 'ech-uuid-1',
    abonnement_id: 2,
    reference: 'ECH-26-0001',
    periode_debut: '2026-01-01',
    periode_fin: '2026-12-31',
    date_echeance: '2026-01-31',
    montant: 100000,
    montant_paye: 40000,
    solde_restant: 60000,
    devise: 'XOF',
    statut: 'en_attente',
    observation: null,
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EcheanceService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(EcheanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEcheances', () => {
    it('should call GET super-admin/echeances with query parameters', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockEcheance],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service
        .getEcheances({
          abonnement_id: 2,
          statut: 'en_attente',
          en_retard: true,
          page: 1,
          per_page: 15,
        })
        .subscribe((res) => {
          expect(res.data).toHaveLength(1);
          expect(res.data[0].solde_restant).toBe(60000);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/echeances', {
        params: {
          abonnement_id: 2,
          statut: 'en_attente',
          en_retard: true,
          page: 1,
          per_page: 15,
        },
      });
    });
  });

  describe('getEcheance', () => {
    it('should call GET super-admin/echeances/:id', () => {
      mockApiClient.get.mockReturnValue(of({ status: 'success', data: mockEcheance }));

      service.getEcheance('ech-uuid-1').subscribe((res) => {
        expect(res.reference).toBe('ECH-26-0001');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/echeances/ech-uuid-1');
    });
  });

  describe('genererFacture', () => {
    it('should call POST super-admin/echeances/:id/generer-facture', () => {
      const mockFacture: Facture = {
        id: 'fac-uuid-1',
        echeance_abonnement_id: 5,
        reference: 'FAC-26-0001',
        date_facture: '2026-09-19',
        date_echeance: '2026-10-19',
        montant_ht: 84745.76,
        taux_tva: 18,
        montant_tva: 15254.24,
        montant_ttc: 100000,
        statut: 'en_attente',
        created_at: '2026-09-19T10:00:00Z',
        updated_at: '2026-09-19T10:00:00Z',
      };

      mockApiClient.post.mockReturnValue(of({ status: 'success', data: mockFacture }));

      service
        .genererFacture('ech-uuid-1', {
          taux_tva: 18,
          description: 'Facture annuelle',
        })
        .subscribe((res) => {
          expect(res.reference).toBe('FAC-26-0001');
          expect(res.montant_ttc).toBe(100000);
        });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'super-admin/echeances/ech-uuid-1/generer-facture',
        { taux_tva: 18, description: 'Facture annuelle' }
      );
    });
  });
});
