import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import {
  CatechumeneItem,
  CatheoPopulationFilterParams,
  CatheoPopulationMeta,
  CatheoStatusSummary,
  PopulationType,
  SectionCode,
  SECTION_POPULATION_MAP,
} from '../models/catheo-population.model';

@Injectable({
  providedIn: 'root',
})
export class CatheoPopulationService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/catheo/population';

  /**
   * Récupère la population catéchétique de la paroisse pour l'organisation courante,
   * filtrée strictement selon ses sections pastorales et pour l'année courante.
   */
  public getPopulation(
    params?: CatheoPopulationFilterParams
  ): Observable<{ data: CatechumeneItem[]; meta: CatheoPopulationMeta }> {
    const queryParams: Record<string, any> = {};

    if (params) {
      if (params.search) queryParams['search'] = params.search;
      if (params.sexe && params.sexe !== 'tous') queryParams['sexe'] = params.sexe;
      if (params.niveau_id) queryParams['niveau_id'] = params.niveau_id;
      if (params.classe_id) queryParams['classe_id'] = params.classe_id;
      if (params.page) queryParams['page'] = params.page;
      if (params.per_page) queryParams['per_page'] = params.per_page;
    }

    return this.api.get<CatechumeneItem[]>(this.endpoint, { params: queryParams }).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta || {
            current_page: 1,
            last_page: 1,
            per_page: raw.data?.length || 20,
            total: raw.data?.length || 0,
          },
        };
      })
    );
  }

  /**
   * Récupère le statut de connexion CATHEO et la synthèse pastorale
   * (année active, total effectif, répartition par niveau et classe).
   */
  public getCatheoSummary(): Observable<CatheoStatusSummary> {
    return this.api.get<any>('organisation/dashboard').pipe(
      map((res) => {
        const raw = res as any;
        const catheo = raw?.data?.catheo;
        if (!catheo) {
          return {
            catheo_connecte: false,
            message: 'Données CATHEO non disponibles pour cette organisation.',
          };
        }
        return catheo as CatheoStatusSummary;
      })
    );
  }

  /**
   * Détermine le type d'organisation cible pour un code de section officiel.
   */
  public getPopulationType(sectionCode: SectionCode): PopulationType {
    return SECTION_POPULATION_MAP[sectionCode] || 'OPPE';
  }
}
