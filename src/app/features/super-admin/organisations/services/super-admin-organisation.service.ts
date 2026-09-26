import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  SuperAdminOrganisation,
  StoreResponsableDto,
  UpdateOrganisationInfoDto,
  OrganisationsFilterParams,
} from '../models/super-admin-organisation.model';

export interface OrganisationPaginatedResponse {
  data: SuperAdminOrganisation[];
  meta: PaginatedMeta;
}

@Injectable({
  providedIn: 'root',
})
export class SuperAdminOrganisationService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/organisations
   * Récupère la liste paginée des organisations avec filtres réels
   */
  public getOrganisations(
    params?: OrganisationsFilterParams
  ): Observable<OrganisationPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.type_organisation && params.type_organisation !== 'tous') {
        queryParams['type_organisation'] = params.type_organisation;
      }
      if (params.statut && params.statut !== 'tous') {
        queryParams['statut'] = params.statut;
      }
      if (params.paroisse_id) {
        queryParams['paroisse_id'] = params.paroisse_id;
      }
      if (params.search) {
        queryParams['search'] = params.search;
      }
      if (params.page) {
        queryParams['page'] = params.page;
      }
      if (params.per_page) {
        queryParams['per_page'] = params.per_page;
      }
    }

    return (
      this.api.get<SuperAdminOrganisation[]>('super-admin/organisations', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<SuperAdminOrganisation>>
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: raw.current_page || 1,
            last_page: raw.last_page || 1,
            per_page: raw.per_page || 15,
            total: raw.total !== undefined ? raw.total : (raw.data?.length || 0),
          },
        };
      })
    );
  }

  /**
   * GET /api/v1/super-admin/organisations/{id}
   * Récupère le détail d'une organisation par ID ou UUID
   */
  public getOrganisation(id: string | number): Observable<SuperAdminOrganisation> {
    return this.api.get<SuperAdminOrganisation>(`super-admin/organisations/${id}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/organisations
   * Crée une organisation (Mode Liée ou Indépendante)
   */
  public createOrganisation(payload: FormData | Record<string, any>): Observable<any> {
    return this.api.post('super-admin/organisations', payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/organisations/{id}/responsable
   * Provisionne le premier responsable de l'organisation
   */
  public provisionResponsable(
    organisationId: string | number,
    payload: StoreResponsableDto
  ): Observable<any> {
    return this.api
      .post(`super-admin/organisations/${organisationId}/responsable`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * PUT /api/v1/super-admin/organisations/{uuid}
   * Met à jour les informations, coordonnées et logo d'une organisation en Super Admin.
   * Si FormData est fourni, utilise POST avec _method=PUT pour le support d'upload de fichiers.
   */
  public updateOrganisation(
    organisationId: string | number,
    payload: FormData | UpdateOrganisationInfoDto | Record<string, any>
  ): Observable<any> {
    if (payload instanceof FormData) {
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT');
      }
      return this.api
        .post(`super-admin/organisations/${organisationId}`, payload)
        .pipe(map((res) => res.data));
    }

    return this.api
      .put(`super-admin/organisations/${organisationId}`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * PATCH /api/v1/super-admin/organisations/{uuid}/statut
   * Change le statut de l'organisation : 'actif' | 'suspendu' | 'inactif'
   */
  public changeStatus(
    organisationId: string | number,
    statut: 'actif' | 'suspendu' | 'inactif'
  ): Observable<any> {
    return this.api
      .patch(`super-admin/organisations/${organisationId}/statut`, { statut })
      .pipe(map((res) => res.data));
  }

  /**
   * DELETE /api/v1/super-admin/organisations/{uuid}
   * Soft-delete de l'organisation vers la Corbeille
   */
  public deleteOrganisation(organisationId: string | number): Observable<any> {
    return this.api
      .delete(`super-admin/organisations/${organisationId}`)
      .pipe(map((res) => res.data));
  }

  /**
   * GET /api/v1/super-admin/organisations/{uuid}/formules
   * Récupère uniquement les formules tarifaires éligibles au produit de l'organisation
   */
  public getFormulesEligibles(organisationId: string | number): Observable<any[]> {
    return this.api
      .get<any[]>(`super-admin/organisations/${organisationId}/formules`)
      .pipe(map((res) => res.data || []));
  }

  /**
   * Rétrocompatibilité : PUT /api/v1/organisation/info
   */
  public updateOrganisationInfo(
    organisationId: string | number,
    payload: UpdateOrganisationInfoDto
  ): Observable<any> {
    return this.updateOrganisation(organisationId, payload);
  }
}

