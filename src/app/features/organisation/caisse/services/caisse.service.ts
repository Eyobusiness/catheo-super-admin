import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import {
  CaisseFilters,
  CaisseResponse,
  OperationCaisse,
  StatistiquesFinances,
  StatistiquesFinancesResponse,
  SyntheseCaisse,
  InscriptionPaiementsResponse,
  StoreDepensePayload,
} from '../models/caisse.model';
import {
  CampagnePelerinage,
  PaiementFilters,
  PaiementPelerinage,
  StorePaiementPayload,
} from '../../pelerinages/models/pelerinage.model';

@Injectable({
  providedIn: 'root',
})
export class CaisseService {
  private readonly api = inject(ApiClient);

  /**
   * Récupère l'état de caisse détaillé de l'organisation :
   * Synthèse (solde initial, entrées, sorties, solde final) et liste paginée des opérations.
   * Endpoint réel : GET /api/v1/organisation/caisse
   */
  public getEtatCaisse(filters?: CaisseFilters): Observable<CaisseResponse> {
    const params: Record<string, any> = {};

    if (filters) {
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
      if (filters.type_operation && filters.type_operation !== 'tous') {
        params['type_operation'] = filters.type_operation;
      }
      if (filters.campagne_id) params['campagne_id'] = filters.campagne_id;
      if (filters.search) params['search'] = filters.search;
      if (filters.page) params['page'] = filters.page;
      if (filters.per_page) params['per_page'] = filters.per_page;
    }

    return this.api.get<OperationCaisse[]>('organisation/caisse', { params }).pipe(
      map((res: any) => ({
        status: res.status || 'success',
        message: res.message || '',
        synthese: (res.synthese as SyntheseCaisse) || {
          periode_debut: null,
          periode_fin: null,
          solde_initial: 0,
          total_entrees: 0,
          total_sorties: 0,
          solde_periode: 0,
          solde_final: 0,
          nombre_operations: 0,
        },
        data: (res.data as OperationCaisse[]) || [],
        meta: res.meta || {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 0,
        },
      }))
    );
  }

  /**
   * Récupère les statistiques financières de l'organisation (répartition modes, évolution mensuelle).
   * Endpoint réel : GET /api/v1/organisation/statistiques/finances
   */
  public getStatistiquesFinances(filters?: {
    date_debut?: string;
    date_fin?: string;
    campagne_id?: number | string;
  }): Observable<StatistiquesFinances> {
    const params: Record<string, any> = {};
    if (filters?.date_debut) params['date_debut'] = filters.date_debut;
    if (filters?.date_fin) params['date_fin'] = filters.date_fin;
    if (filters?.campagne_id) params['campagne_id'] = filters.campagne_id;

    return this.api
      .get<StatistiquesFinances>('organisation/statistiques/finances', { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Récupère les campagnes de pèlerinage pour alimenter les sélecteurs de filtrage.
   * Endpoint réel : GET /api/v1/organisation/pelerinages
   */
  public getCampagnes(): Observable<CampagnePelerinage[]> {
    return this.api
      .get<CampagnePelerinage[]>('organisation/pelerinages', {
        params: { per_page: 100 },
      })
      .pipe(map((res) => res.data || []));
  }

  /**
   * Récupère le journal des paiements d'une campagne de pèlerinage.
   * Endpoint réel : GET /api/v1/organisation/pelerinages/{campagne}/paiements
   */
  public getPaiementsCampagne(
    campagneId: number | string,
    filters?: PaiementFilters
  ): Observable<{ data: PaiementPelerinage[]; meta: any }> {
    const params: Record<string, any> = {};
    if (filters?.statut && filters.statut !== 'tous') params['statut'] = filters.statut;
    if (filters?.mode_paiement && filters.mode_paiement !== 'tous') {
      params['mode_paiement'] = filters.mode_paiement;
    }
    if (filters?.search) params['search'] = filters.search;
    if (filters?.page) params['page'] = filters.page;
    if (filters?.per_page) params['per_page'] = filters.per_page;

    return this.api
      .get<PaiementPelerinage[]>(`organisation/pelerinages/${campagneId}/paiements`, { params })
      .pipe(
        map((res: any) => ({
          data: res.data || [],
          meta: res.meta,
        }))
      );
  }

  /**
   * Récupère l'historique complet des paiements pour une inscription donnée.
   * Endpoint réel : GET /api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements
   */
  public getPaiementsInscription(
    campagneId: number | string,
    inscriptionId: number | string
  ): Observable<InscriptionPaiementsResponse> {
    return this.api
      .get<any[]>(
        `organisation/pelerinages/${campagneId}/inscriptions/${inscriptionId}/paiements`
      )
      .pipe(
        map((res: any) => ({
          status: res.status || 'success',
          message: res.message || '',
          data: res.data || [],
          meta: res.meta || {
            montant_total: 0,
            montant_paye: 0,
            reste_a_payer: 0,
            statut: '',
          },
        }))
      );
  }

  /**
   * Enregistre un paiement pour un participant.
   * Déclenche automatiquement dans le backend la création d'une opération d'encaissement de caisse.
   * Endpoint réel : POST /api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements
   */
  public enregistrerPaiement(
    campagneId: number | string,
    inscriptionId: number | string,
    payload: StorePaiementPayload
  ): Observable<{ paiement: PaiementPelerinage; inscription: any }> {
    return this.api
      .post<any>(
        `organisation/pelerinages/${campagneId}/inscriptions/${inscriptionId}/paiements`,
        payload
      )
      .pipe(
        map((res: any) => ({
          paiement: res.data,
          inscription: res.inscription,
        }))
      );
  }

  /**
   * Annule un paiement de pèlerinage.
   * Déclenche automatiquement dans le backend l'annulation de l'opération de caisse correspondante.
   * Endpoint réel : POST /api/v1/organisation/pelerinages/{campagne}/paiements/{paiement}/annuler
   */
  public annulerPaiement(
    campagneId: number | string,
    paiementId: number | string,
    motif?: string
  ): Observable<{ paiement: PaiementPelerinage; inscription: any }> {
    return this.api
      .post<any>(
        `organisation/pelerinages/${campagneId}/paiements/${paiementId}/annuler`,
        { motif }
      )
      .pipe(
        map((res: any) => ({
          paiement: res.data,
          inscription: res.inscription,
        }))
      );
  }

  /**
   * Enregistre une dépense (décaissement / sortie de caisse).
   * Décompte immédiatement et automatiquement du solde effectif de l'organisation.
   * Endpoint réel : POST /api/v1/organisation/caisse/depenses
   */
  public enregistrerDepense(payload: StoreDepensePayload): Observable<OperationCaisse> {
    return this.api
      .post<any>('organisation/caisse/depenses', payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Annule une opération de dépense de caisse.
   * Restaure le solde effectif de la caisse.
   * Endpoint réel : POST /api/v1/organisation/caisse/depenses/{operation}/annuler
   */
  public annulerDepense(
    operationId: number | string,
    motif?: string
  ): Observable<OperationCaisse> {
    return this.api
      .post<any>(`organisation/caisse/depenses/${operationId}/annuler`, { motif })
      .pipe(map((res) => res.data));
  }
}

