import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaiementService } from './paiement.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import {
  CreatePaiementData,
  PaiementAbonnement,
} from '../models/paiement.model';

describe('PaiementService', () => {
  let service: PaiementService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  const mockPaiement: PaiementAbonnement = {
    id: 'pay-uuid-1',
    id_interne: 10,
    uuid: 'pay-uuid-1',
    reference: 'PAY-26-0001',
    echeance_abonnement_id: 1,
    montant: 50000,
    devise: 'XOF',
    mode_paiement: 'mobile_money',
    date_paiement: '2026-09-19',
    statut: 'valide',
    reference_transaction: 'TX-999',
    observation: 'Acompte',
    created_at: '2026-09-19T10:00:00Z',
    updated_at: '2026-09-19T10:00:00Z',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PaiementService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(PaiementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPaiements', () => {
    it('should call GET super-admin/paiements-abonnement with query params and format response', () => {
      const mockPaginatedResponse = {
        status: 'success',
        data: [mockPaiement],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 15,
          total: 1,
        },
      };

      mockApiClient.get.mockReturnValue(of(mockPaginatedResponse));

      service
        .getPaiements({
          statut: 'valide',
          mode_paiement: 'mobile_money',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          page: 2,
          per_page: 20,
        })
        .subscribe((res) => {
          expect(res.data).toHaveLength(1);
          expect(res.data[0].reference).toBe('PAY-26-0001');
          expect(res.meta.total).toBe(1);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/paiements-abonnement', {
        params: {
          statut: 'valide',
          mode_paiement: 'mobile_money',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          page: 2,
          per_page: 20,
        },
      });
    });

    it('should ignore "tous" filters in query params', () => {
      mockApiClient.get.mockReturnValue(of({ data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }));

      service.getPaiements({ statut: 'tous', mode_paiement: 'tous' }).subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/paiements-abonnement', {
        params: {},
      });
    });
  });

  describe('getPaiement', () => {
    it('should call GET super-admin/paiements-abonnement/:id and return data', () => {
      mockApiClient.get.mockReturnValue(of({ status: 'success', data: mockPaiement }));

      service.getPaiement('pay-uuid-1').subscribe((result) => {
        expect(result).toEqual(mockPaiement);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/paiements-abonnement/pay-uuid-1');
    });
  });

  describe('createPaiement', () => {
    it('should call POST super-admin/paiements-abonnement with payload', () => {
      const payload: CreatePaiementData = {
        echeance_abonnement_id: 1,
        montant: 25000,
        mode_paiement: 'especes',
        date_paiement: '2026-09-19',
        reference_transaction: 'REC-001',
        observation: 'Paiement partiel',
      };

      mockApiClient.post.mockReturnValue(of({ status: 'success', data: mockPaiement }));

      service.createPaiement(payload).subscribe((result) => {
        expect(result).toEqual(mockPaiement);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('super-admin/paiements-abonnement', payload);
    });
  });

  describe('annulerPaiement', () => {
    it('should call POST super-admin/paiements-abonnement/:id/annuler with observation', () => {
      const updatedPaiement = { ...mockPaiement, statut: 'annule' as const };
      mockApiClient.post.mockReturnValue(of({ status: 'success', data: updatedPaiement }));

      service.annulerPaiement('pay-uuid-1', { observation: 'Erreur de caisse' }).subscribe((res) => {
        expect(res.statut).toBe('annule');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'super-admin/paiements-abonnement/pay-uuid-1/annuler',
        { observation: 'Erreur de caisse' }
      );
    });
  });

  describe('rembourserPaiement', () => {
    it('should call POST super-admin/paiements-abonnement/:id/rembourser', () => {
      const updatedPaiement = { ...mockPaiement, statut: 'rembourse' as const };
      mockApiClient.post.mockReturnValue(of({ status: 'success', data: updatedPaiement }));

      service.rembourserPaiement('pay-uuid-1', { observation: 'Trop-perçu' }).subscribe((res) => {
        expect(res.statut).toBe('rembourse');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'super-admin/paiements-abonnement/pay-uuid-1/rembourser',
        { observation: 'Trop-perçu' }
      );
    });
  });
});
