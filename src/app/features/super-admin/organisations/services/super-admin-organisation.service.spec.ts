import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuperAdminOrganisationService } from './super-admin-organisation.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import {
  SuperAdminOrganisation,
  StoreResponsableDto,
  UpdateOrganisationInfoDto,
} from '../models/super-admin-organisation.model';

describe('SuperAdminOrganisationService', () => {
  let service: SuperAdminOrganisationService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

  const mockOrg: SuperAdminOrganisation = {
    id: 1,
    uuid: 'org-uuid-1',
    code: 'OPPE-CIM',
    nom: 'Enfance Missionnaire - Coeur Immaculé',
    type_organisation: 'OPPE',
    statut: 'actif',
    paroisse_configuration_id: 10,
    paroisse: {
      id: 10,
      nom_paroisse: 'Coeur Immaculé de Marie',
      code_paroisse: 'PAR-CIM',
      diocese: 'Abidjan',
      ville: 'Treichville',
    },
    produit: {
      id: 2,
      code: 'OPPE',
      nom: 'Office Paroissial de la Pastorale des Enfants (OPPE)',
    },
    responsable_nom: 'Père Marcel',
    responsable_email: 'marcel@paroisse.ci',
    users_count: 3,
    membres_count: 120,
    activites_count: 12,
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SuperAdminOrganisationService,
        { provide: ApiClient, useValue: mockApiClient },
      ],
    });

    service = TestBed.inject(SuperAdminOrganisationService);
  });

  it('devrait être instancié correctement', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrganisations', () => {
    it('devrait appeler GET super-admin/organisations sans filtres', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockOrg],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      );

      service.getOrganisations().subscribe((res) => {
        expect(res.data).toEqual([mockOrg]);
        expect(res.meta.total).toBe(1);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/organisations', {
        params: {},
      });
    });

    it('devrait transmettre les filtres réels type_organisation, statut, search et pagination', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: [mockOrg],
          meta: { current_page: 2, last_page: 5, per_page: 10, total: 45 },
        })
      );

      service
        .getOrganisations({
          type_organisation: 'OPPJ',
          statut: 'actif',
          search: 'Jeunesse',
          page: 2,
          per_page: 10,
        })
        .subscribe((res) => {
          expect(res.data.length).toBe(1);
          expect(res.meta.current_page).toBe(2);
        });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/organisations', {
        params: {
          type_organisation: 'OPPJ',
          statut: 'actif',
          search: 'Jeunesse',
          page: 2,
          per_page: 10,
        },
      });
    });

    it('devrait ignorer les filtres statut et type lorsqu’ils valent "tous"', () => {
      mockApiClient.get.mockReturnValue(of({ status: 'success', data: [] }));

      service
        .getOrganisations({
          type_organisation: 'tous',
          statut: 'tous',
        })
        .subscribe();

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/organisations', {
        params: {},
      });
    });
  });

  describe('getOrganisation', () => {
    it('devrait appeler GET super-admin/organisations/{id} et retourner l’organisation', () => {
      mockApiClient.get.mockReturnValue(
        of({
          status: 'success',
          data: mockOrg,
        })
      );

      service.getOrganisation(1).subscribe((res) => {
        expect(res).toEqual(mockOrg);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('super-admin/organisations/1');
    });

    it('devrait propager les erreurs 404', () => {
      mockApiClient.get.mockReturnValue(
        throwError(() => ({ status: 404, error: { message: 'Non trouvée' } }))
      );

      service.getOrganisation(999).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });
    });
  });

  describe('provisionResponsable', () => {
    it('devrait appeler POST super-admin/organisations/{id}/responsable avec les données', () => {
      const payload: StoreResponsableDto = {
        name: 'Abbé Paul',
        email: 'paul@catheo.org',
        telephone: '+22507000000',
        password: 'password123',
      };

      mockApiClient.post.mockReturnValue(
        of({
          status: 'success',
          data: { id: 101, name: 'Abbé Paul', email: 'paul@catheo.org' },
        })
      );

      service.provisionResponsable(1, payload).subscribe((res) => {
        expect(res.id).toBe(101);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        'super-admin/organisations/1/responsable',
        payload
      );
    });

    it('devrait gérer les erreurs 422 renvoyées par le backend', () => {
      mockApiClient.post.mockReturnValue(
        throwError(() => ({
          status: 422,
          error: { errors: { email: ['Cet email est déjà utilisé.'] } },
        }))
      );

      service
        .provisionResponsable(1, { name: 'Test', email: 'pris@catheo.org' })
        .subscribe({
          error: (err) => {
            expect(err.status).toBe(422);
            expect(err.error.errors.email[0]).toBe('Cet email est déjà utilisé.');
          },
        });
    });
  });

  describe('updateOrganisationInfo', () => {
    it('devrait appeler PUT organisation/info avec l’en-tête X-Organisation-Id', () => {
      const updateData: UpdateOrganisationInfoDto = {
        nom: 'Nouveau Nom OPPE',
        telephone: '+22501020304',
      };

      mockApiClient.put.mockReturnValue(
        of({
          status: 'success',
          data: { ...mockOrg, ...updateData },
        })
      );

      service.updateOrganisationInfo(1, updateData).subscribe((res) => {
        expect(res.nom).toBe('Nouveau Nom OPPE');
      });

      expect(mockApiClient.put).toHaveBeenCalledWith('organisation/info', updateData, {
        headers: {
          'X-Organisation-Id': '1',
        },
      });
    });
  });
});
