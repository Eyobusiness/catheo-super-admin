import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api-client.service';
import { RapportAnnuel } from '../models/rapport.model';

@Injectable({
  providedIn: 'root',
})
export class RapportService {
  private readonly api = inject(ApiClient);
  private readonly endpoint = 'organisation/rapports';

  /**
   * Récupère le rapport annuel consolidé réel de l'organisation.
   * GET /api/v1/organisation/rapports/annuel?annee={annee}
   */
  getRapportAnnuel(annee?: number): Observable<RapportAnnuel> {
    const params: Record<string, number> = {};
    if (annee) {
      params['annee'] = annee;
    }

    return this.api
      .get<RapportAnnuel>(`${this.endpoint}/annuel`, { params })
      .pipe(map((res) => res.data));
  }
}
