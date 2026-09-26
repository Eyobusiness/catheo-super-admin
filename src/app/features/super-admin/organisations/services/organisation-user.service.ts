import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  OrganisationUser,
  CreateOrganisationUserDto,
  UpdateOrganisationUserDto,
  OrganisationProfil,
  OrganisationUsersFilterParams,
} from '../models/organisation-user.model';

export interface OrganisationUserPaginatedResponse {
  data: OrganisationUser[];
  meta: PaginatedMeta;
}

@Injectable({
  providedIn: 'root',
})
export class OrganisationUserService {
  private readonly api = inject(ApiClient);

  private getOrgHeaders(organisationId: string | number): Record<string, string> {
    return {
      'X-Organisation-Id': String(organisationId),
    };
  }

  /**
   * GET /api/v1/organisation/users
   * Liste paginée des utilisateurs rattachés à une organisation
   */
  public getUsers(
    organisationId: string | number,
    params?: OrganisationUsersFilterParams
  ): Observable<OrganisationUserPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) {
        queryParams['search'] = params.search;
      }
      if (params.statut && params.statut !== 'tous') {
        queryParams['statut'] = params.statut;
      }
      if (params.profil_id) {
        queryParams['profil_id'] = params.profil_id;
      }
      if (params.page) {
        queryParams['page'] = params.page;
      }
      if (params.per_page) {
        queryParams['per_page'] = params.per_page;
      }
    }

    return (
      this.api.get<OrganisationUser[]>('organisation/users', {
        headers: this.getOrgHeaders(organisationId),
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<OrganisationUser>>
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
   * GET /api/v1/organisation/users/{id}
   */
  public getUser(
    organisationId: string | number,
    userId: string | number
  ): Observable<OrganisationUser> {
    return this.api
      .get<OrganisationUser>(`organisation/users/${userId}`, {
        headers: this.getOrgHeaders(organisationId),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/organisation/users
   */
  public createUser(
    organisationId: string | number,
    payload: CreateOrganisationUserDto
  ): Observable<OrganisationUser> {
    return this.api
      .post<OrganisationUser>('organisation/users', payload, {
        headers: this.getOrgHeaders(organisationId),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * PUT /api/v1/organisation/users/{id}
   */
  public updateUser(
    organisationId: string | number,
    userId: string | number,
    payload: UpdateOrganisationUserDto
  ): Observable<OrganisationUser> {
    return this.api
      .put<OrganisationUser>(`organisation/users/${userId}`, payload, {
        headers: this.getOrgHeaders(organisationId),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * PATCH /api/v1/organisation/users/{id}/toggle-status
   */
  public toggleStatus(
    organisationId: string | number,
    userId: string | number
  ): Observable<any> {
    return this.api
      .patch(`organisation/users/${userId}/toggle-status`, {}, {
        headers: this.getOrgHeaders(organisationId),
      })
      .pipe(map((res) => res.data));
  }

  /**
   * GET /api/v1/profils
   */
  public getProfils(organisationId?: string | number): Observable<OrganisationProfil[]> {
    const headers = organisationId ? this.getOrgHeaders(organisationId) : undefined;
    return this.api
      .get<OrganisationProfil[]>('profils', headers ? { headers } : undefined)
      .pipe(map((res) => res.data || []));
  }
}
