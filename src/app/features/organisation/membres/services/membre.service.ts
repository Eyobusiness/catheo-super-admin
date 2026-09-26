import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { PaginatedMeta } from '../../../../core/models/api.models';
import {
  Membre,
  MembreFilterParams,
  CreateMembreDto,
  UpdateMembreDto,
} from '../models/membre.model';

@Injectable({
  providedIn: 'root',
})
export class MembreService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/membres';

  /**
   * Récupère la liste paginée des membres de l'organisation courante.
   */
  public getMembres(
    params?: MembreFilterParams
  ): Observable<{ data: Membre[]; meta: PaginatedMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) queryParams['search'] = params.search;
      if (params.statut && params.statut !== 'tous') queryParams['statut'] = params.statut;
      if (params.sexe && params.sexe !== 'tous') queryParams['sexe'] = params.sexe;
      if (params.fonction) queryParams['fonction'] = params.fonction;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return this.api.get<Membre[]>(this.endpoint, { params: queryParams }).pipe(
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
   * Récupère la fiche détaillée d'un membre par son identifiant ou UUID.
   */
  public getMembre(idOrUuid: string | number): Observable<Membre> {
    return this.api.get<Membre>(`${this.endpoint}/${idOrUuid}`).pipe(map((res) => res.data));
  }

  /**
   * Enregistre un nouveau membre au sein de l'organisation.
   */
  public createMembre(dto: CreateMembreDto): Observable<Membre> {
    return this.api.post<Membre>(this.endpoint, dto).pipe(map((res) => res.data));
  }

  /**
   * Met à jour les informations d'un membre existant.
   */
  public updateMembre(idOrUuid: string | number, dto: UpdateMembreDto): Observable<Membre> {
    return this.api.put<Membre>(`${this.endpoint}/${idOrUuid}`, dto).pipe(map((res) => res.data));
  }

  /**
   * Supprime un membre (Soft Delete dans Laravel).
   */
  public deleteMembre(idOrUuid: string | number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${idOrUuid}`).pipe(map(() => void 0));
  }
}
