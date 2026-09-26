import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse } from '../../../../core/models/api.models';
import {
  Facture,
  FactureFilterParams,
  FacturePaginatedResponse,
} from '../models/facture.model';

@Injectable({
  providedIn: 'root',
})
export class FactureService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/factures
   */
  public getFactures(
    params?: FactureFilterParams
  ): Observable<FacturePaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.statut && params.statut !== 'tous') {
        queryParams['statut'] = params.statut;
      }
      if (params.date_debut) {
        queryParams['date_debut'] = params.date_debut;
      }
      if (params.date_fin) {
        queryParams['date_fin'] = params.date_fin;
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
      this.api.get<Facture[]>('super-admin/factures', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Facture>>
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
          links: raw.links,
        };
      })
    );
  }

  /**
   * GET /api/v1/super-admin/factures/{id}
   */
  public getFacture(id: string | number): Observable<Facture> {
    return this.api
      .get<Facture>(`super-admin/factures/${id}`)
      .pipe(map((res) => res.data));
  }
}
