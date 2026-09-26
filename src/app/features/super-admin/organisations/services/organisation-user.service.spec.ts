import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganisationUserService } from './organisation-user.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import {
  OrganisationUser,
  CreateOrganisationUserDto,
  UpdateOrganisationUserDto,
  OrganisationProfil,
} from '../models/organisation-user.model';

describe('OrganisationUserService', () => {
  let service: OrganisationUserService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockUser: OrganisationUser = {
    id: 10,
    name: 'Jean Kouassi',
    email: 'jean@catheo.org',
    telephone: '+22507000000',
    statut: 'actif',
    organisation_id: 1,
    profil: {
      id: 2,
      code: 'RESPONSABLE_OPPE',
      libelle: 'Responsable OPPE',
    },
    created_at: '2026-09-19T12:00:00Z',
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OrganisationUserService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(OrganisationUserService);
  });

  it('devrait être créé avec succès', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('devrait appeler GET organisation/users avec l’en-tête X-Organisation-Id', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockUser],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service.getUsers(1, { search: 'Jean', statut: 'actif' }).subscribe((res) => {
        expect(res.data).toEqual([mockUser]);
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/users', {
        headers: { 'X-Organisation-Id': '1' },
        params: { search: 'Jean', statut: 'actif' },
      });
    });
  });

  describe('getUser', () => {
    it('devrait appeler GET organisation/users/{id} avec X-Organisation-Id', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: mockUser,
        })
      );

      service.getUser(1, 10).subscribe((res) => {
        expect(res).toEqual(mockUser);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('organisation/users/10', {
        headers: { 'X-Organisation-Id': '1' },
      });
    });
  });

  describe('createUser', () => {
    it('devrait appeler POST organisation/users avec le payload et X-Organisation-Id', () => {
      const payload: CreateOrganisationUserDto = {
        name: 'Marie Claire',
        email: 'marie@catheo.org',
        password: 'password123',
        profil_id: 2,
        statut: 'actif',
      };

      mockApiClient.post.mockReturnValue(
        of({
          status: 'success',
          data: { ...mockUser, id: 11, name: 'Marie Claire' },
        })
      );

      service.createUser(1, payload).subscribe((res) => {
        expect(res.id).toBe(11);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('organisation/users', payload, {
        headers: { 'X-Organisation-Id': '1' },
      });
    });
  });

  describe('updateUser', () => {
    it('devrait appeler PUT organisation/users/{id} avec payload et X-Organisation-Id', () => {
      const payload: UpdateOrganisationUserDto = {
        name: 'Jean Modifie',
        profil_id: 3,
      };

      mockApiClient.put.mockReturnValue(
        of({
          status: 'success',
          data: { ...mockUser, name: 'Jean Modifie' },
        })
      );

      service.updateUser(1, 10, payload).subscribe((res) => {
        expect(res.name).toBe('Jean Modifie');
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('organisation/users/10', payload, {
        headers: { 'X-Organisation-Id': '1' },
      });
    });
  });

  describe('toggleStatus', () => {
    it('devrait appeler PATCH organisation/users/{id}/toggle-status avec X-Organisation-Id', () => {
      mockApiClient.patch.mockReturnValue(
        of({
          status: 'success',
          data: { ...mockUser, statut: 'inactif' },
        })
      );

      service.toggleStatus(1, 10).subscribe((res) => {
        expect(res.statut).toBe('inactif');
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        'organisation/users/10/toggle-status',
        {},
        {
          headers: { 'X-Organisation-Id': '1' },
        }
      );
    });
  });

  describe('getProfils', () => {
    it('devrait appeler GET profils avec X-Organisation-Id', () => {
      const profils: OrganisationProfil[] = [
        { id: 1, code: 'RESPONSABLE_OPPE', libelle: 'Responsable OPPE' },
        { id: 2, code: 'UTILISATEUR_OPPE', libelle: 'Utilisateur OPPE' },
      ];

      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: profils,
        })
      );

      service.getProfils(1).subscribe((res) => {
        expect(res).toEqual(profils);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('profils', {
        headers: { 'X-Organisation-Id': '1' },
      });
    });
  });
});
