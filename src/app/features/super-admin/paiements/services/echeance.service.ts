import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse } from '../../../../core/models/api.models';
import {
  EcheanceAbonnement,
  EcheanceFilterParams,
  EcheancePaginatedResponse,
  GenererFactureData,
} from '../models/echeance.model';
import { Facture } from '../../factures/models/facture.model';

@Injectable({
  providedIn: 'root',
})
export class EcheanceService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/echeances
   */
  public getEcheances(
    params?: EcheanceFilterParams
  ): Observable<EcheancePaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.abonnement_id) {
        queryParams['abonnement_id'] = params.abonnement_id;
      }
      if (params.statut && params.statut !== 'tous') {
        queryParams['statut'] = params.statut;
      }
      if (params.en_retard !== undefined) {
        queryParams['en_retard'] = params.en_retard;
      }
      if (params.page) {
        queryParams['page'] = params.page;
      }
      if (params.per_page) {
        queryParams['per_page'] = params.per_page;
      }
    }

    return (
      this.api.get<EcheanceAbonnement[]>('super-admin/echeances', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<EcheanceAbonnement>>
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
   * GET /api/v1/super-admin/echeances/{id}
   */
  public getEcheance(id: string | number): Observable<EcheanceAbonnement> {
    return this.api
      .get<EcheanceAbonnement>(`super-admin/echeances/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/super-admin/echeances/{id}/generer-facture
   */
  public genererFacture(
    id: string | number,
    data?: GenererFactureData
  ): Observable<Facture> {
    return this.api
      .post<Facture>(`super-admin/echeances/${id}/generer-facture`, data || {})
      .pipe(map((res) => res.data));
  }
}
