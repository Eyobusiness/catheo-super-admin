import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SanteApiService } from './sante-api.service';
import { ApiClient } from '../../../../core/services/api-client.service';

describe('SanteApiService', () => {
  let service: SanteApiService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SanteApiService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(SanteApiService);
  });

  it('devrait être créé avec succès', () => {
    expect(service).toBeTruthy();
  });

  describe('getHealthReport', () => {
    it('devrait appeler GET health et calculer le statut healthy avec temps de latence', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          message: 'Catheo API v1 is running',
          timestamp: '2026-09-19T21:49:00+00:00',
        })
      );

      service.getHealthReport().subscribe((report) => {
        expect(report.statut_global).toBe('healthy');
        expect(report.message).toBe('Catheo API v1 is running');
        expect(report.server_timestamp).toBe('2026-09-19T21:49:00+00:00');
        expect(report.client_latency_ms).toBeGreaterThanOrEqual(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('health');
    });

    it('devrait propager les erreurs si l’API est indisponible', () => {
      mockApiClient.get.mockReturnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      service.getHealthReport().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });
    });
  });
});
