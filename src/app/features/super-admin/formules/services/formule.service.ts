import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  Formule,
  FormuleFilterParams,
  FormuleFormData,
} from '../models/formule.model';

@Injectable({
  providedIn: 'root',
})
export class FormuleService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/formules
   * Query params: produit_id, statut, est_gratuite, all, page, per_page
   */
  public getFormules(
    params?: FormuleFilterParams
  ): Observable<{ data: Formule[]; meta: PaginatedMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.produit) queryParams['produit'] = params.produit;
      if (params.produit_id) queryParams['produit_id'] = params.produit_id;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.est_gratuite !== undefined) queryParams['est_gratuite'] = params.est_gratuite;
      if (params.all !== undefined) queryParams['all'] = params.all;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<Formule[]>('super-admin/formules', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Formule>>
    ).pipe(
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
   * GET /api/v1/super-admin/formules/{id}
   */
  public getFormule(idOrUuid: string | number): Observable<Formule> {
    return this.api.get<Formule>(`super-admin/formules/${idOrUuid}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/formules
   */
  public createFormule(data: FormuleFormData): Observable<Formule> {
    return this.api.post<Formule>('super-admin/formules', data).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PUT /api/v1/super-admin/formules/{id}
   */
  public updateFormule(
    idOrUuid: string | number,
    data: Partial<FormuleFormData>
  ): Observable<Formule> {
    return this.api.put<Formule>(`super-admin/formules/${idOrUuid}`, data).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PATCH /api/v1/super-admin/formules/{id}/toggle-status
   */
  public toggleStatus(idOrUuid: string | number): Observable<Formule> {
    return this.api
      .patch<Formule>(`super-admin/formules/${idOrUuid}/toggle-status`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * DELETE /api/v1/super-admin/formules/{id}
   */
  public deleteFormule(idOrUuid: string | number): Observable<void> {
    return this.api.delete<void>(`super-admin/formules/${idOrUuid}`).pipe(
      map(() => undefined)
    );
  }
}
