import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ActiviteService } from './activite.service';
import { Activite } from '../models/activite.model';

describe('ActiviteService', () => {
  let service: ActiviteService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockActivite: Activite = {
    id: 'uuid-activite-1',
    id_interne: 101,
    organisation_id: 1,
    code: 'ACT-2024-01',
    titre: 'Récollection des catéchistes',
    description: 'Temps de ressourcement spirituel',
    type_activite: 'Récollection',
    date_debut: '2024-11-15T08:30:00Z',
    date_fin: '2024-11-15T17:00:00Z',
    lieu: 'Centre spirituel Sainte Thérèse',
    responsable_id: 10,
    responsable: {
      id: 'uuid-membre-1',
      id_interne: 10,
      nom: 'KOUAME',
      prenoms: 'Jean-Marc',
      nom_complet: 'KOUAME Jean-Marc',
      sexe: 'M',
      statut: 'actif',
    },
    statut: 'planifiee',
    taux_execution: 30,
    observation: 'Prévoir les livrets de prière',
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ActiviteService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(ActiviteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getActivites', () => {
    it('should call GET organisation/activites with empty params by default', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockActivite],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
          },
        })
      );

      service.getActivites().subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].titre).toBe('Récollection des catéchistes');
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/activites', { params: {} });
    });

    it('should forward search, statut, type_activite, date_debut, date_fin, page and per_page', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockActivite],
          meta: {
            current_page: 2,
            last_page: 5,
            per_page: 10,
            total: 45,
          },
        })
      );

      service
        .getActivites({
          search: 'Récollection',
          statut: 'planifiee',
          type_activite: 'Formation',
          date_debut: '2024-11-01',
          date_fin: '2024-11-30',
          page: 2,
          per_page: 10,
        })
        .subscribe((res) => {
          expect(res.data.length).toBe(1);
          expect(res.meta.current_page).toBe(2);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/activites', {
        params: {
          search: 'Récollection',
          statut: 'planifiee',
          type_activite: 'Formation',
          date_debut: '2024-11-01',
          date_fin: '2024-11-30',
          page: 2,
          per_page: 10,
        },
      });
    });

    it('should omit "tous" for statut and type_activite', () => {
      mockApiClient.get.mockReturnValue(of({ data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }));

      service.getActivites({ statut: 'tous', type_activite: 'tous' }).subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/activites', { params: {} });
    });
  });

  describe('getActivite', () => {
    it('should retrieve single activite by ID or UUID', () => {
      mockApiClient.get.mockReturnValue(of({ data: mockActivite }));

      service.getActivite('uuid-activite-1').subscribe((a) => {
        expect(a.id).toBe('uuid-activite-1');
        expect(a.titre).toBe('Récollection des catéchistes');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/activites/uuid-activite-1');
    });

    it('should propagate error on 404', () => {
      mockApiClient.get.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Activité introuvable' }))
      );

      service.getActivite('invalid-id').subscribe({
        next: () => expect.unreachable('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
    });
  });

  describe('createActivite', () => {
    it('should send POST request with new activite data', () => {
      const dto = {
        titre: 'Camp des jeunes',
        date_debut: '2024-12-20T08:00:00Z',
        statut: 'planifiee' as const,
      };

      mockApiClient.post.mockReturnValue(of({ data: { ...mockActivite, titre: 'Camp des jeunes' } }));

      service.createActivite(dto).subscribe((res) => {
        expect(res.titre).toBe('Camp des jeunes');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('organisation/activites', dto);
    });

    it('should propagate 422 validation errors', () => {
      mockApiClient.post.mockReturnValue(
        throwError(() => ({
          status: 422,
          error: { errors: { titre: ['Le titre est obligatoire.'] } },
        }))
      );

      service.createActivite({ titre: '', date_debut: '' }).subscribe({
        next: () => expect.unreachable('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(422);
        },
      });
    });
  });

  describe('updateActivite', () => {
    it('should send PUT request to update activite', () => {
      const dto = {
        titre: 'Récollection modifiée',
        taux_execution: 60,
      };

      mockApiClient.put.mockReturnValue(of({ data: { ...mockActivite, titre: 'Récollection modifiée', taux_execution: 60 } }));

      service.updateActivite('uuid-activite-1', dto).subscribe((res) => {
        expect(res.titre).toBe('Récollection modifiée');
        expect(res.taux_execution).toBe(60);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('organisation/activites/uuid-activite-1', dto);
    });
  });

  describe('deleteActivite', () => {
    it('should send DELETE request to soft delete activite', () => {
      mockApiClient.delete.mockReturnValue(of({ status: 'success' }));

      service.deleteActivite('uuid-activite-1').subscribe((res) => {
        expect(res).toBeUndefined();
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('organisation/activites/uuid-activite-1');
    });
  });
});
