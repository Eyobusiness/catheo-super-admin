import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { PaginatedMeta } from '../../../../core/models/api.models';
import {
  CampagneFilters,
  CampagnePelerinage,
  CampagneStatistiques,
  InscriptionFilters,
  InscriptionPelerinage,
  PaiementFilters,
  PaiementPelerinage,
  ParticipationStatut,
  StoreCampagnePayload,
  StoreInscriptionPayload,
  StorePaiementPayload,
  StoreTarifPayload,
  TarifPelerinage,
  UpdateCampagnePayload,
} from '../models/pelerinage.model';

@Injectable({
  providedIn: 'root',
})
export class PelerinageService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/pelerinages';

  // ==========================================
  // CAMPAGNES DE PÈLERINAGE
  // ==========================================

  public getCampagnes(
    filters?: CampagneFilters
  ): Observable<{ data: CampagnePelerinage[]; meta: PaginatedMeta }> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.search) params['search'] = filters.search;
      if (filters.statut && filters.statut !== 'tous') params['statut'] = filters.statut;
      if (filters.date_depart_min) params['date_depart_min'] = filters.date_depart_min;
      if (filters.page) params['page'] = filters.page;
      if (filters.per_page) params['per_page'] = filters.per_page;
    }

    return this.api.get<any>(this.endpoint, { params }).pipe(
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

  public getCampagne(
    idOrUuid: number | string
  ): Observable<{ data: CampagnePelerinage; stats?: CampagneStatistiques }> {
    return this.api.get<any>(`${this.endpoint}/${idOrUuid}`).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data,
          stats: raw.stats,
        };
      })
    );
  }

  public createCampagne(payload: StoreCampagnePayload): Observable<CampagnePelerinage> {
    return this.api.post<any>(this.endpoint, payload).pipe(
      map((res) => res.data)
    );
  }

  public updateCampagne(
    idOrUuid: number | string,
    payload: UpdateCampagnePayload
  ): Observable<CampagnePelerinage> {
    return this.api.put<any>(`${this.endpoint}/${idOrUuid}`, payload).pipe(
      map((res) => res.data)
    );
  }

  public deleteCampagne(idOrUuid: number | string): Observable<void> {
    return this.api.delete<any>(`${this.endpoint}/${idOrUuid}`).pipe(
      map(() => undefined)
    );
  }

  public ouvrirCampagne(idOrUuid: number | string): Observable<CampagnePelerinage> {
    return this.api.patch<any>(`${this.endpoint}/${idOrUuid}/ouvrir`, {}).pipe(
      map((res) => res.data)
    );
  }

  public cloturerCampagne(
    idOrUuid: number | string
  ): Observable<{ campagne: CampagnePelerinage; inscriptions_annulees: number }> {
    return this.api.patch<any>(`${this.endpoint}/${idOrUuid}/cloturer`, {}).pipe(
      map((res) => {
        const raw = res as any;
        return {
          campagne: raw.data,
          inscriptions_annulees: raw.meta?.inscriptions_annulees || 0,
        };
      })
    );
  }

  public annulerCampagne(
    idOrUuid: number | string,
    motif?: string
  ): Observable<CampagnePelerinage> {
    return this.api.patch<any>(`${this.endpoint}/${idOrUuid}/annuler`, { motif }).pipe(
      map((res) => res.data)
    );
  }

  public getStatistiques(idOrUuid: number | string): Observable<CampagneStatistiques> {
    return this.api.get<any>(`${this.endpoint}/${idOrUuid}/statistiques`).pipe(
      map((res) => res.data)
    );
  }

  // ==========================================
  // TARIFS DE PÈLERINAGE
  // ==========================================

  public getTarifs(campagneId: number | string): Observable<TarifPelerinage[]> {
    return this.api.get<any>(`${this.endpoint}/${campagneId}/tarifs`).pipe(
      map((res) => res.data || [])
    );
  }

  public createTarif(
    campagneId: number | string,
    payload: StoreTarifPayload
  ): Observable<TarifPelerinage> {
    return this.api.post<any>(`${this.endpoint}/${campagneId}/tarifs`, payload).pipe(
      map((res) => res.data)
    );
  }

  public updateTarif(
    campagneId: number | string,
    tarifId: number | string,
    payload: Partial<StoreTarifPayload>
  ): Observable<TarifPelerinage> {
    return this.api.put<any>(`${this.endpoint}/${campagneId}/tarifs/${tarifId}`, payload).pipe(
      map((res) => res.data)
    );
  }

  public deleteTarif(
    campagneId: number | string,
    tarifId: number | string
  ): Observable<void> {
    return this.api.delete<any>(`${this.endpoint}/${campagneId}/tarifs/${tarifId}`).pipe(
      map(() => undefined)
    );
  }

  // ==========================================
  // INSCRIPTIONS / PARTICIPANTS
  // ==========================================

  public getInscriptions(
    campagneId: number | string,
    filters?: InscriptionFilters
  ): Observable<{ data: InscriptionPelerinage[]; meta: PaginatedMeta }> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.search) params['search'] = filters.search;
      if (filters.statut_inscription && filters.statut_inscription !== 'tous') {
        params['statut_inscription'] = filters.statut_inscription;
      }
      if (filters.statut_participation && filters.statut_participation !== 'tous') {
        params['statut_participation'] = filters.statut_participation;
      }
      if (filters.type_participant && filters.type_participant !== 'tous') {
        params['type_participant'] = filters.type_participant;
      }
      if (filters.tarif_id) params['tarif_id'] = filters.tarif_id;
      if (filters.taille) params['taille'] = filters.taille;
      if (filters.page) params['page'] = filters.page;
      if (filters.per_page) params['per_page'] = filters.per_page;
    }

    return this.api.get<any>(`${this.endpoint}/${campagneId}/inscriptions`, { params }).pipe(
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

  public createInscription(
    campagneId: number | string,
    payload: StoreInscriptionPayload
  ): Observable<InscriptionPelerinage> {
    return this.api.post<any>(`${this.endpoint}/${campagneId}/inscriptions`, payload).pipe(
      map((res) => res.data)
    );
  }

  public getInscription(
    campagneId: number | string,
    insId: number | string
  ): Observable<InscriptionPelerinage> {
    return this.api.get<any>(`${this.endpoint}/${campagneId}/inscriptions/${insId}`).pipe(
      map((res) => res.data)
    );
  }

  public annulerInscription(
    campagneId: number | string,
    insId: number | string,
    motif?: string
  ): Observable<InscriptionPelerinage> {
    return this.api.patch<any>(
      `${this.endpoint}/${campagneId}/inscriptions/${insId}/annuler`,
      { motif }
    ).pipe(map((res) => res.data));
  }

  public updateParticipation(
    campagneId: number | string,
    insId: number | string,
    statutParticipation: ParticipationStatut
  ): Observable<InscriptionPelerinage> {
    return this.api.patch<any>(
      `${this.endpoint}/${campagneId}/inscriptions/${insId}/participation`,
      { statut_participation: statutParticipation }
    ).pipe(map((res) => res.data));
  }

  // ==========================================
  // PAIEMENTS DE PÈLERINAGE
  // ==========================================

  public getCampagnePaiements(
    campagneId: number | string,
    filters?: PaiementFilters
  ): Observable<{ data: PaiementPelerinage[]; meta: PaginatedMeta }> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.search) params['search'] = filters.search;
      if (filters.statut && filters.statut !== 'tous') params['statut'] = filters.statut;
      if (filters.mode_paiement && filters.mode_paiement !== 'tous') {
        params['mode_paiement'] = filters.mode_paiement;
      }
      if (filters.page) params['page'] = filters.page;
      if (filters.per_page) params['per_page'] = filters.per_page;
    }

    return this.api.get<any>(`${this.endpoint}/${campagneId}/paiements`, { params }).pipe(
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

  public getInscriptionPaiements(
    campagneId: number | string,
    insId: number | string
  ): Observable<{ data: PaiementPelerinage[]; meta?: any }> {
    return this.api.get<any>(
      `${this.endpoint}/${campagneId}/inscriptions/${insId}/paiements`
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          data: raw.data || [],
          meta: raw.meta,
        };
      })
    );
  }

  public createPaiement(
    campagneId: number | string,
    insId: number | string,
    payload: StorePaiementPayload
  ): Observable<{ paiement: PaiementPelerinage; inscription: InscriptionPelerinage }> {
    return this.api.post<any>(
      `${this.endpoint}/${campagneId}/inscriptions/${insId}/paiements`,
      payload
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          paiement: raw.data,
          inscription: raw.inscription,
        };
      })
    );
  }

  public annulerPaiement(
    campagneId: number | string,
    paiementId: number | string,
    motif?: string
  ): Observable<{ paiement: PaiementPelerinage; inscription: InscriptionPelerinage }> {
    return this.api.post<any>(
      `${this.endpoint}/${campagneId}/paiements/${paiementId}/annuler`,
      { motif }
    ).pipe(
      map((res) => {
        const raw = res as any;
        return {
          paiement: raw.data,
          inscription: raw.inscription,
        };
      })
    );
  }
}
