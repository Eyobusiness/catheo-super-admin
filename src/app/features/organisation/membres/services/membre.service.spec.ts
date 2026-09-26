import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { MembreService } from './membre.service';
import { Membre } from '../models/membre.model';

describe('MembreService', () => {
  let service: MembreService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockMembre: Membre = {
    id: 'uuid-membre-1',
    id_interne: 1,
    nom: 'KOUAME',
    prenoms: 'Jean-Marc',
    nom_complet: 'KOUAME Jean-Marc',
    sexe: 'M',
    date_naissance: '1990-05-14',
    telephone: '0701020304',
    email: 'jm.kouame@example.com',
    quartier: 'Cocody Riviera',
    adresse: 'Rue des Jardins',
    fonction: 'Animateur principal',
    date_entree: '2024-01-15',
    statut: 'actif',
    photo_path: null,
    observation: 'Membre dévoué',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
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
        MembreService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(MembreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMembres', () => {
    it('should call GET organisation/membres with empty params by default', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockMembre],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1,
          },
        })
      );

      service.getMembres().subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].nom).toBe('KOUAME');
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/membres', { params: {} });
    });

    it('should pass search, statut, sexe, page, per_page when filtering', () => {
      mockApiClient.get.mockReturnValue(
        of({
          data: [mockMembre],
          meta: {
            current_page: 2,
            last_page: 3,
            per_page: 10,
            total: 25,
          },
        })
      );

      service
        .getMembres({
          search: 'Kouame',
          statut: 'actif',
          sexe: 'M',
          fonction: 'Animateur',
          page: 2,
          per_page: 10,
        })
        .subscribe((res) => {
          expect(res.data.length).toBe(1);
          expect(res.meta.current_page).toBe(2);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/membres', {
        params: {
          search: 'Kouame',
          statut: 'actif',
          sexe: 'M',
          fonction: 'Animateur',
          page: 2,
          per_page: 10,
        },
      });
    });

    it('should ignore "tous" for statut and sexe', () => {
      mockApiClient.get.mockReturnValue(of({ data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }));

      service.getMembres({ statut: 'tous', sexe: 'tous' }).subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/membres', { params: {} });
    });

    it('should handle response with missing meta gracefully', () => {
      mockApiClient.get.mockReturnValue(of({ data: [mockMembre] }));

      service.getMembres().subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.meta.current_page).toBe(1);
        expect(res.meta.total).toBe(1);
      });
    });
  });

  describe('getMembre', () => {
    it('should fetch single membre by id', () => {
      mockApiClient.get.mockReturnValue(of({ data: mockMembre }));

      service.getMembre('uuid-membre-1').subscribe((membre) => {
        expect(membre.id).toBe('uuid-membre-1');
        expect(membre.nom_complet).toBe('KOUAME Jean-Marc');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/membres/uuid-membre-1');
    });

    it('should propagate 404 error if membre not found or belongs to another tenant', () => {
      mockApiClient.get.mockReturnValue(
        throwError(() => ({ status: 404, message: 'Non trouvé' }))
      );

      service.getMembre('invalid-id').subscribe({
        next: () => expect.unreachable('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
    });
  });

  describe('createMembre', () => {
    it('should send POST request to create a new membre', () => {
      const dto = {
        nom: 'KOUAME',
        prenoms: 'Jean-Marc',
        sexe: 'M' as const,
        statut: 'actif' as const,
        telephone: '0701020304',
      };

      mockApiClient.post.mockReturnValue(of({ data: mockMembre }));

      service.createMembre(dto).subscribe((res) => {
        expect(res.nom).toBe('KOUAME');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('organisation/membres', dto);
    });

    it('should propagate 422 validation error', () => {
      mockApiClient.post.mockReturnValue(
        throwError(() => ({ status: 422, error: { errors: { nom: ['Le champ nom est obligatoire.'] } } }))
      );

      service.createMembre({ nom: '', prenoms: 'Test', sexe: 'M', statut: 'actif' }).subscribe({
        next: () => expect.unreachable('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(422);
        },
      });
    });
  });

  describe('updateMembre', () => {
    it('should send PUT request to update existing membre', () => {
      const dto = {
        nom: 'KOUAME',
        prenoms: 'Jean-Marc',
        sexe: 'M' as const,
        statut: 'actif' as const,
        fonction: 'Coordinateur',
      };

      const updatedMembre = { ...mockMembre, fonction: 'Coordinateur' };
      mockApiClient.put.mockReturnValue(of({ data: updatedMembre }));

      service.updateMembre('uuid-membre-1', dto).subscribe((res) => {
        expect(res.fonction).toBe('Coordinateur');
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('organisation/membres/uuid-membre-1', dto);
    });
  });

  describe('deleteMembre', () => {
    it('should send DELETE request to soft delete membre', () => {
      mockApiClient.delete.mockReturnValue(of({ status: 'success' }));

      service.deleteMembre('uuid-membre-1').subscribe((res) => {
        expect(res).toBeUndefined();
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('organisation/membres/uuid-membre-1');
    });

    it('should handle 403 or 404 on delete', () => {
      mockApiClient.delete.mockReturnValue(
        throwError(() => ({ status: 403, message: 'Action non autorisée' }))
      );

      service.deleteMembre('uuid-membre-1').subscribe({
        next: () => expect.unreachable('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(403);
        },
      });
    });
  });
});
