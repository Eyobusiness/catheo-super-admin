import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { PaginatedMeta } from '../../../../core/models/api.models';
import {
  Activite,
  ActiviteFilterParams,
  CreateActiviteDto,
  UpdateActiviteDto,
} from '../models/activite.model';

@Injectable({
  providedIn: 'root',
})
export class ActiviteService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/activites';

  /**
   * Récupère la liste paginée des activités pastorales de l'organisation courante.
   */
  public getActivites(
    params?: ActiviteFilterParams
  ): Observable<{ data: Activite[]; meta: PaginatedMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) queryParams['search'] = params.search;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.type_activite && params.type_activite !== 'tous') {
        queryParams['type_activite'] = params.type_activite;
      }
      if (params.date_debut) queryParams['date_debut'] = params.date_debut;
      if (params.date_fin) queryParams['date_fin'] = params.date_fin;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return this.api.get<Activite[]>(this.endpoint, { params: queryParams }).pipe(
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
   * Récupère la fiche détaillée d'une activité par son UUID ou identifiant.
   */
  public getActivite(idOrUuid: string | number): Observable<Activite> {
    return this.api.get<Activite>(`${this.endpoint}/${idOrUuid}`).pipe(map((res) => res.data));
  }

  /**
   * Enregistre et planifie une nouvelle activité au sein de l'organisation.
   */
  public createActivite(dto: CreateActiviteDto): Observable<Activite> {
    return this.api.post<Activite>(this.endpoint, dto).pipe(map((res) => res.data));
  }

  /**
   * Met à jour les informations d'une activité existante.
   */
  public updateActivite(idOrUuid: string | number, dto: UpdateActiviteDto): Observable<Activite> {
    return this.api.put<Activite>(`${this.endpoint}/${idOrUuid}`, dto).pipe(map((res) => res.data));
  }

  /**
   * Supprime une activité (Soft Delete dans Laravel).
   */
  public deleteActivite(idOrUuid: string | number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${idOrUuid}`).pipe(map(() => void 0));
  }
}
