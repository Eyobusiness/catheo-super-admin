import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FactureService } from './facture.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { Facture } from '../models/facture.model';

describe('FactureService', () => {
  let service: FactureService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockFacture: Facture = {
    id: 'fac-uuid-1',
    id_interne: 1,
    uuid: 'fac-uuid-1',
    echeance_abonnement_id: 1,
    reference: 'FAC-26-0001',
    date_facture: '2026-09-19',
    date_echeance: '2026-10-19',
    montant_ht: 84745.76,
    taux_tva: 18,
    montant_tva: 15254.24,
    montant_ttc: 100000,
    statut: 'en_attente',
    description: 'Facture annuelle',
    created_at: '2026-09-19T10:00:00Z',
    updated_at: '2026-09-19T10:00:00Z',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        FactureService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(FactureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFactures', () => {
    it('should call GET super-admin/factures with filters and format pagination', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockFacture],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service
        .getFactures({
          statut: 'en_attente',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          search: 'FAC-26',
          page: 1,
          per_page: 15,
        })
        .subscribe((res) => {
          expect(res.data).toHaveLength(1);
          expect(res.data[0].reference).toBe('FAC-26-0001');
          expect(res.meta.total).toBe(1);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/factures', {
        params: {
          statut: 'en_attente',
          date_debut: '2026-01-01',
          date_fin: '2026-12-31',
          search: 'FAC-26',
          page: 1,
          per_page: 15,
        },
      });
    });
  });

  describe('getFacture', () => {
    it('should call GET super-admin/factures/:id and return data', () => {
      mockApiClient.get.mockReturnValue(of({ status: 'success', data: mockFacture }));

      service.getFacture('fac-uuid-1').subscribe((res) => {
        expect(res).toEqual(mockFacture);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/factures/fac-uuid-1');
    });
  });
});
