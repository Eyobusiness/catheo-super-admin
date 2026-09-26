import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  Produit,
  ProduitFilterParams,
  ProduitFormData,
} from '../models/produit.model';

@Injectable({
  providedIn: 'root',
})
export class ProduitService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/produits
   * Query params: search, statut, all, page, per_page
   */
  public getProduits(
    params?: ProduitFilterParams
  ): Observable<{ data: Produit[]; meta: PaginatedMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) queryParams['search'] = params.search;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.all !== undefined) queryParams['all'] = params.all;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<Produit[]>('super-admin/produits', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Produit>>
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
   * GET /api/v1/super-admin/produits/{id}
   * Accepts UUID, code, or internal id. Loads associated formulas.
   */
  public getProduit(idOrUuid: string | number): Observable<Produit> {
    return this.api.get<Produit>(`super-admin/produits/${idOrUuid}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/produits
   */
  public createProduit(data: ProduitFormData): Observable<Produit> {
    return this.api.post<Produit>('super-admin/produits', data).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PUT /api/v1/super-admin/produits/{id}
   */
  public updateProduit(
    idOrUuid: string | number,
    data: Partial<ProduitFormData>
  ): Observable<Produit> {
    return this.api.put<Produit>(`super-admin/produits/${idOrUuid}`, data).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PATCH /api/v1/super-admin/produits/{id}/toggle-status
   */
  public toggleStatus(idOrUuid: string | number): Observable<Produit> {
    return this.api
      .patch<Produit>(`super-admin/produits/${idOrUuid}/toggle-status`, {})
      .pipe(map((res) => res.data));
  }
}
