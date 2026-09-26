import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  Paroisse,
  ParoisseDetail,
  ParoisseFilterParams,
  ParoisseStatut,
} from '../models/paroisse.model';
import {
  ParoisseUser,
  CreateParoisseUserDto,
  UpdateParoisseUserDto,
  SystemProfil,
} from '../models/paroisse-user.model';

@Injectable({
  providedIn: 'root',
})
export class ParoisseService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/paroisses
   * Returns paginated list of supervised parishes with search and filter parameters.
   */
  public getParoisses(
    params?: ParoisseFilterParams
  ): Observable<{ data: Paroisse[]; meta: PaginatedMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) queryParams['search'] = params.search;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.ville) queryParams['ville'] = params.ville;
      if (params.diocese) queryParams['diocese'] = params.diocese;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (this.api.get<Paroisse[]>('super-admin/paroisses', { params: queryParams }) as Observable<ApiPaginatedResponse<Paroisse>>).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: 1,
            last_page: 1,
            per_page: raw.data?.length || 15,
            total: raw.data?.length || 0,
          },
        };
      })
    );
  }

  /**
   * GET /api/v1/super-admin/paroisses/{id}
   * Returns a single parish with subscriptions and subscribed products.
   */
  public getParoisse(id: string | number): Observable<Paroisse> {
    return this.api.get<Paroisse>(`super-admin/paroisses/${id}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * GET parish configuration details and merge with super-admin supervision data.
   */
  public getParoisseDetail(id: string | number): Observable<ParoisseDetail> {
    const superAdmin$ = this.api.get<Paroisse>(`super-admin/paroisses/${id}`).pipe(
      map((res) => res.data)
    );

    const config$ = this.api.get<any>('paroisse-configuration', {
      params: { paroisse_id: id },
    }).pipe(
      map((res) => res.data),
      catchError(() => of(null))
    );

    return forkJoin({ base: superAdmin$, config: config$ }).pipe(
      map(({ base, config }) => {
        if (!config) {
          return base as ParoisseDetail;
        }
        return {
          ...base,
          prefixe_matricule: config.prefixe_matricule ?? null,
          prefixe_recu: config.prefixe_recu ?? null,
          site_web: config.site_web ?? null,
          adresse: config.adresse ?? null,
          cure_nom: config.cure_nom ?? null,
          coordination_nom: config.coordination_nom ?? null,
          logo_paroisse: config.logo_paroisse ?? null,
          logo_paroisse_url: config.logo_paroisse_url ?? null,
          logo_catechese: config.logo_catechese ?? null,
          logo_catechese_url: config.logo_catechese_url ?? null,
        } as ParoisseDetail;
      })
    );
  }

  /**
   * POST /api/v1/paroisse-configuration
   * Updates configuration and status of a parish using existing backend endpoint.
   */
  public updateParoisse(
    id: string | number,
    payload: FormData | Record<string, any>
  ): Observable<any> {
    if (payload instanceof FormData) {
      if (!payload.has('paroisse_id')) {
        payload.append('paroisse_id', String(id));
      }
      return this.api.post<any>('paroisse-configuration', payload).pipe(
        map((res) => res.data)
      );
    }

    const body = {
      ...payload,
      paroisse_id: id,
    };
    return this.api.post<any>('paroisse-configuration', body).pipe(
      map((res) => res.data)
    );
  }

  /**
   * Change parish operational status: 'actif' | 'suspendu' | 'inactif'.
   */
  public changeStatus(id: string | number, statut: ParoisseStatut): Observable<any> {
    return this.updateParoisse(id, { statut });
  }

  /**
   * POST /api/v1/super-admin/paroisses
   * Batch creates/activates organisations for the given parish (OPPE, OPPJ, OPPA).
   */
  public activateProduits(paroisseId: string, produits: string[]): Observable<any> {
    return this.api
      .post('super-admin/organisations', {
        paroisse_id: paroisseId,
        produits,
      })
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/super-admin/paroisses
   * Creates a new parish directly via autonomous endpoint F25.8
   */
  public createParoisse(payload: FormData | Record<string, any>): Observable<any> {
    return this.api.post<any>('super-admin/paroisses', payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * GET /api/v1/profils
   * Returns profiles for assigning to parish admins (filtered with code containing 'ADMIN').
   */
  public getSystemProfils(): Observable<SystemProfil[]> {
    return this.api.get<SystemProfil[]>('profils').pipe(
      map((res) => {
        const list = res.data || [];
        return list.filter((p: SystemProfil) => p.code && p.code.toUpperCase().includes('ADMIN'));
      }),
      catchError(() => {
        // Fallback standard si l'endpoint profils n'est pas accessible
        return of([
          { id: 1, code: 'ADMIN', nom: 'Administrateur', is_system: 1 },
          { id: 2, code: 'ADMIN_PAROISSE', nom: 'Administrateur Paroissial', is_system: 1 },
        ]);
      })
    );
  }

  /**
   * GET /api/v1/super-admin/paroisses/{id}/users
   * Lists parish users (organisation_id is null)
   */
  public getParoisseUsers(paroisseId: string | number): Observable<ParoisseUser[]> {
    return this.api.get<ParoisseUser[]>(`super-admin/paroisses/${paroisseId}/users`).pipe(
      map((res) => res.data || [])
    );
  }

  /**
   * POST /api/v1/super-admin/paroisses/{id}/users
   * Creates a user / first administrator for the parish
   */
  public createParoisseUser(
    paroisseId: string | number,
    payload: CreateParoisseUserDto
  ): Observable<ParoisseUser> {
    return this.api.post<ParoisseUser>(`super-admin/paroisses/${paroisseId}/users`, payload).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PUT /api/v1/super-admin/paroisses/{paroisseId}/users/{userId}
   * Updates an existing parish user
   */
  public updateParoisseUser(
    paroisseId: string | number,
    userId: string | number,
    payload: UpdateParoisseUserDto
  ): Observable<ParoisseUser> {
    return this.api
      .put<ParoisseUser>(`super-admin/paroisses/${paroisseId}/users/${userId}`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * DELETE /api/v1/super-admin/paroisses/{paroisseId}/users/{userId}
   * Soft deletes a parish user
   */
  public deleteParoisseUser(
    paroisseId: string | number,
    userId: string | number
  ): Observable<any> {
    return this.api.delete<any>(`super-admin/paroisses/${paroisseId}/users/${userId}`).pipe(
      map((res) => res.data)
    );
  }
}

