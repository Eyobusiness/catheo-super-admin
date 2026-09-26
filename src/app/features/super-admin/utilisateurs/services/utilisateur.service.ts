import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse } from '../../../../core/models/api.models';
import { Utilisateur, UtilisateurFilters } from '../models/utilisateur.model';

export interface UtilisateurPaginatedResponse {
  data: Utilisateur[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'super-admin/users';

  /**
   * GET /api/v1/super-admin/users
   */
  public getUtilisateurs(filters?: UtilisateurFilters): Observable<UtilisateurPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (filters) {
      if (filters.user_type) queryParams['user_type'] = filters.user_type;
      if (filters.paroisse_id) queryParams['paroisse_id'] = filters.paroisse_id;
      if (filters.organisation_id) queryParams['organisation_id'] = filters.organisation_id;
      if (filters.statut && filters.statut !== 'tous') queryParams['statut'] = filters.statut;
      if (filters.profil) queryParams['profil'] = filters.profil;
      if (filters.search) queryParams['search'] = filters.search;
      if (filters.page) queryParams['page'] = filters.page;
      if (filters.per_page) queryParams['per_page'] = filters.per_page;
    }

    return (
      this.api.get<Utilisateur[]>(this.endpoint, {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Utilisateur>>
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: raw.current_page || 1,
            last_page: raw.last_page || 1,
            per_page: raw.per_page || 25,
            total: raw.total !== undefined ? raw.total : (raw.data?.length || 0),
          },
        };
      })
    );
  }

  /**
   * GET /api/v1/super-admin/users/{uuid}
   */
  public getUtilisateurById(uuid: string): Observable<Utilisateur> {
    return this.api.get<Utilisateur>(`${this.endpoint}/${uuid}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/users
   */
  public createUtilisateur(payload: any): Observable<Utilisateur> {
    return this.api.post<Utilisateur>(this.endpoint, payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PUT /api/v1/super-admin/users/{uuid}
   */
  public updateUtilisateur(uuid: string, payload: any): Observable<Utilisateur> {
    return this.api.put<Utilisateur>(`${this.endpoint}/${uuid}`, payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PATCH /api/v1/super-admin/users/{uuid}/statut
   */
  public changeStatut(uuid: string, statut: 'actif' | 'bloque'): Observable<any> {
    return this.api.patch(`${this.endpoint}/${uuid}/statut`, { statut }).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/users/{uuid}/reset-password
   */
  public resetPassword(
    uuid: string,
    payload: { password: string; password_confirmation: string }
  ): Observable<any> {
    return this.api.post(`${this.endpoint}/${uuid}/reset-password`, payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * DELETE /api/v1/super-admin/users/{uuid}
   */
  public deleteUtilisateur(uuid: string): Observable<any> {
    return this.api.delete(`${this.endpoint}/${uuid}`).pipe(
      map((res) => res.data)
    );
  }
}
