import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { AuditLog } from '../models/audit.model';

describe('AuditService', () => {
  let service: AuditService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockLog: AuditLog = {
    id: 'uuid-log-1',
    action: 'update',
    entite_type: 'Paroisse',
    entite_id: 10,
    anciennes_valeurs: { nom_paroisse: 'Ancien Nom' },
    nouvelles_valeurs: { nom_paroisse: 'Nouveau Nom' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    user: {
      id: 1,
      name: 'Super Admin',
      email: 'admin@catheo.org',
    },
    created_at: '2026-09-19T20:00:00Z',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuditService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(AuditService);
  });

  it('devrait être créé avec succès', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuditLogs', () => {
    it('devrait interroger GET audit-logs sans filtres', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockLog],
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        })
      );

      service.getAuditLogs().subscribe((res) => {
        expect(res.data).toEqual([mockLog]);
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('audit-logs', { params: {} });
    });

    it('devrait transmettre les filtres réels action, entite_type et pagination', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockLog],
          meta: { current_page: 2, last_page: 4, per_page: 25, total: 100 },
        })
      );

      service
        .getAuditLogs({
          action: 'update',
          entite_type: 'Paroisse',
          page: 2,
          per_page: 25,
        })
        .subscribe((res) => {
          expect(res.data.length).toBe(1);
          expect(res.meta.current_page).toBe(2);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('audit-logs', {
        params: {
          action: 'update',
          entite_type: 'Paroisse',
          page: 2,
          per_page: 25,
        },
      });
    });
  });

  describe('getAuditLogById', () => {
    it('devrait appeler GET audit-logs/{id}', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: mockLog,
        })
      );

      service.getAuditLogById('uuid-log-1').subscribe((res) => {
        expect(res).toEqual(mockLog);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('audit-logs/uuid-log-1');
    });

    it('devrait propager les erreurs en cas de log non trouvé', () => {
      mockApiClient.get.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Introuvable' }))
      );

      service.getAuditLogById('invalid').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
    });
  });
});
