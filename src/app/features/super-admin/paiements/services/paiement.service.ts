import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse } from '../../../../core/models/api.models';
import {
  CreatePaiementData,
  PaiementAbonnement,
  PaiementActionData,
  PaiementFilterParams,
  PaiementPaginatedResponse,
} from '../models/paiement.model';

@Injectable({
  providedIn: 'root',
})
export class PaiementService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/paiements-abonnement
   */
  public getPaiements(
    params?: PaiementFilterParams
  ): Observable<PaiementPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.statut && params.statut !== 'tous') {
        queryParams['statut'] = params.statut;
      }
      if (params.mode_paiement && params.mode_paiement !== 'tous') {
        queryParams['mode_paiement'] = params.mode_paiement;
      }
      if (params.echeance_id) {
        queryParams['echeance_id'] = params.echeance_id;
      }
      if (params.date_debut) {
        queryParams['date_debut'] = params.date_debut;
      }
      if (params.date_fin) {
        queryParams['date_fin'] = params.date_fin;
      }
      if (params.page) {
        queryParams['page'] = params.page;
      }
      if (params.per_page) {
        queryParams['per_page'] = params.per_page;
      }
    }

    return (
      this.api.get<PaiementAbonnement[]>('super-admin/paiements-abonnement', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<PaiementAbonnement>>
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
   * GET /api/v1/super-admin/paiements-abonnement/{id}
   */
  public getPaiement(id: string | number): Observable<PaiementAbonnement> {
    return this.api
      .get<PaiementAbonnement>(`super-admin/paiements-abonnement/${id}`)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/super-admin/paiements-abonnement
   */
  public createPaiement(data: CreatePaiementData): Observable<PaiementAbonnement> {
    return this.api
      .post<PaiementAbonnement>('super-admin/paiements-abonnement', data)
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/super-admin/paiements-abonnement/{id}/annuler
   */
  public annulerPaiement(
    id: string | number,
    data?: PaiementActionData
  ): Observable<PaiementAbonnement> {
    return this.api
      .post<PaiementAbonnement>(`super-admin/paiements-abonnement/${id}/annuler`, data || {})
      .pipe(map((res) => res.data));
  }

  /**
   * POST /api/v1/super-admin/paiements-abonnement/{id}/rembourser
   */
  public rembourserPaiement(
    id: string | number,
    data?: PaiementActionData
  ): Observable<PaiementAbonnement> {
    return this.api
      .post<PaiementAbonnement>(`super-admin/paiements-abonnement/${id}/rembourser`, data || {})
      .pipe(map((res) => res.data));
  }
}
