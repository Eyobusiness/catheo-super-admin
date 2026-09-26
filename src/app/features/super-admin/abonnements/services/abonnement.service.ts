import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../../core/services/api-client.service';
import { ApiPaginatedResponse, PaginatedMeta } from '../../../../core/models/api.models';
import {
  Abonnement,
  AbonnementFilterParams,
  AbonnementFormData,
  AbonnementPaginatedResponse,
  ChangerStatutData,
  EcheanceAbonnement,
  EcheancePaginatedResponse,
  ResilierAbonnementData,
  AbonnementStatut,
} from '../models/abonnement.model';

@Injectable({
  providedIn: 'root',
})
export class AbonnementService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/super-admin/abonnements
   */
  public getAbonnements(
    params?: AbonnementFilterParams
  ): Observable<AbonnementPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.paroisse_id) queryParams['paroisse_id'] = params.paroisse_id;
      if (params.produit_id) queryParams['produit_id'] = params.produit_id;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<Abonnement[]>('super-admin/abonnements', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Abonnement>>
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
   * GET /api/v1/super-admin/abonnements/paroisses
   * Abonnements spécifiques aux paroisses (CATHEO uniquement).
   */
  public getAbonnementsParoisses(
    params?: AbonnementFilterParams
  ): Observable<AbonnementPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.paroisse_id) queryParams['paroisse_id'] = params.paroisse_id;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<Abonnement[]>('super-admin/abonnements/paroisses', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Abonnement>>
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
   * GET /api/v1/super-admin/abonnements/organisations
   * Abonnements spécifiques aux organisations pastorales (OPPE, OPPJ, OPPA).
   */
  public getAbonnementsOrganisations(
    params?: AbonnementFilterParams
  ): Observable<AbonnementPaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.organisation_id) queryParams['organisation_id'] = params.organisation_id;
      if (params.produit_id) queryParams['produit_id'] = params.produit_id;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return (
      this.api.get<Abonnement[]>('super-admin/abonnements/organisations', {
        params: queryParams,
      }) as Observable<ApiPaginatedResponse<Abonnement>>
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
   * POST /api/v1/super-admin/abonnements/organisations
   * Crée un abonnement pour une organisation avec une formule éligible.
   */
  public createOrganisationAbonnement(data: any): Observable<any> {
    return this.api
      .post('super-admin/abonnements/organisations', data)
      .pipe(map((res) => res.data));
  }

  /**
   * GET /api/v1/super-admin/organisations/{uuid}/formules
   * Charge uniquement les formules tarifaires compatibles avec cette organisation.
   */
  public getOrganisationFormules(uuid: string): Observable<any[]> {
    return this.api
      .get<any[]>(`super-admin/organisations/${uuid}/formules`)
      .pipe(map((res) => res.data || []));
  }


  /**
   * GET /api/v1/super-admin/abonnements/{id}
   */
  public getAbonnement(id: string | number): Observable<Abonnement> {
    return this.api.get<Abonnement>(`super-admin/abonnements/${id}`).pipe(
      map((res) => res.data)
    );
  }

  /**
   * POST /api/v1/super-admin/abonnements
   */
  public createAbonnement(data: AbonnementFormData): Observable<Abonnement> {
    return this.api.post<Abonnement>('super-admin/abonnements', data).pipe(
      map((res) => res.data)
    );
  }

  /**
   * PATCH /api/v1/super-admin/abonnements/{id}/statut
   */
  public changerStatut(
    id: string | number,
    data: ChangerStatutData
  ): Observable<Abonnement> {
    return this.api
      .patch<Abonnement>(`super-admin/abonnements/${id}/statut`, data)
      .pipe(map((res) => res.data));
  }

  /**
   * Alias convenience: changeStatut(id, statut, observation?)
   */
  public changeStatut(
    id: string | number,
    statut: AbonnementStatut,
    observation?: string | null
  ): Observable<Abonnement> {
    return this.changerStatut(id, { statut, observation });
  }

  /**
   * POST /api/v1/super-admin/abonnements/{id}/resilier
   */
  public resilier(
    id: string | number,
    data: ResilierAbonnementData
  ): Observable<Abonnement> {
    return this.api
      .post<Abonnement>(`super-admin/abonnements/${id}/resilier`, data)
      .pipe(map((res) => res.data));
  }

  /**
   * Alias convenience: resilierAbonnement(id, data)
   */
  public resilierAbonnement(
    id: string | number,
    data: ResilierAbonnementData
  ): Observable<Abonnement> {
    return this.resilier(id, data);
  }

  /**
   * GET /api/v1/super-admin/echeances
   */
  public getEcheances(params?: {
    abonnement_id?: string | number;
    statut?: string;
    en_retard?: boolean;
    per_page?: number;
    page?: number;
  }): Observable<EcheancePaginatedResponse> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.abonnement_id) queryParams['abonnement_id'] = params.abonnement_id;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.en_retard !== undefined) queryParams['en_retard'] = params.en_retard;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
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
}
