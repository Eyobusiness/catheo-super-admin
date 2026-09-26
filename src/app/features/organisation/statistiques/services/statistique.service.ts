import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api-client.service';
import {
  ActivitesStatFilters,
  FinancesStatFilters,
  MembresStatFilters,
  OrganisationDashboardMetrics,
  PelerinagesStatFilters,
  StatistiquesActivites,
  StatistiquesFinances,
  StatistiquesMembres,
  StatistiquesPelerinages,
} from '../models/statistique.model';

@Injectable({
  providedIn: 'root',
})
export class StatistiqueService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/statistiques';

  /**
   * Statistiques réelles des membres de l'organisation.
   * GET /api/v1/organisation/statistiques/membres
   */
  getStatistiquesMembres(filters?: MembresStatFilters): Observable<StatistiquesMembres> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut) params['statut'] = filters.statut;
      if (filters.sexe) params['sexe'] = filters.sexe;
      if (filters.fonction) params['fonction'] = filters.fonction;
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
    }

    return this.api
      .get<StatistiquesMembres>(`${this.endpoint}/membres`, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Statistiques réelles des activités de l'organisation.
   * GET /api/v1/organisation/statistiques/activites
   */
  getStatistiquesActivites(filters?: ActivitesStatFilters): Observable<StatistiquesActivites> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.statut) params['statut'] = filters.statut;
      if (filters.type_activite) params['type_activite'] = filters.type_activite;
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
    }

    return this.api
      .get<StatistiquesActivites>(`${this.endpoint}/activites`, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Statistiques réelles des pèlerinages de l'organisation.
   * GET /api/v1/organisation/statistiques/pelerinages
   */
  getStatistiquesPelerinages(filters?: PelerinagesStatFilters): Observable<StatistiquesPelerinages> {
    const params: Record<string, string | number> = {};
    if (filters) {
      if (filters.campagne_id) params['campagne_id'] = filters.campagne_id;
      if (filters.statut_inscription) params['statut_inscription'] = filters.statut_inscription;
      if (filters.type_participant) params['type_participant'] = filters.type_participant;
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
    }

    return this.api
      .get<StatistiquesPelerinages>(`${this.endpoint}/pelerinages`, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Statistiques réelles des finances/caisse de l'organisation.
   * GET /api/v1/organisation/statistiques/finances
   */
  getStatistiquesFinances(filters?: FinancesStatFilters): Observable<StatistiquesFinances> {
    const params: Record<string, string | number> = {};
    if (filters) {
      if (filters.campagne_id) params['campagne_id'] = filters.campagne_id;
      if (filters.date_debut) params['date_debut'] = filters.date_debut;
      if (filters.date_fin) params['date_fin'] = filters.date_fin;
    }

    return this.api
      .get<StatistiquesFinances>(`${this.endpoint}/finances`, { params })
      .pipe(map((res) => res.data));
  }

  /**
   * Tableau de bord général consolidé de l'organisation.
   * GET /api/v1/organisation/dashboard
   */
  getDashboard(fresh = false): Observable<OrganisationDashboardMetrics> {
    const params: Record<string, string> = fresh ? { fresh: 'true' } : {};
    return this.api
      .get<OrganisationDashboardMetrics>('organisation/dashboard', { params })
      .pipe(map((res) => res.data));
  }
}
