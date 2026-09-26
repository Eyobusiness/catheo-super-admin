import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '../../../../core/services/api-client.service';
import { SystemHealthReport } from '../models/sante-api.model';

@Injectable({
  providedIn: 'root',
})
export class SanteApiService {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/v1/health
   * Interroge l'endpoint officiel de santé du backend Laravel
   * et mesure le temps de requête client (aller-retour HTTP).
   */
  public getHealthReport(): Observable<SystemHealthReport> {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    return this.api.get<any>('health').pipe(
      map((res) => {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const clientLatency = Math.max(1, Math.round(endTime - startTime));

        const raw = (res as any) || {};
        // Laravel renvoie soit directement le JSON, soit enveloppé dans ApiResponse
        const payload = raw.data || raw;
        const statusVal = payload.status || raw.status || 'success';
        const messageVal = payload.message || raw.message || 'Catheo API opérationnelle';
        const serverTs = payload.timestamp || raw.timestamp || new Date().toISOString();

        const isHealthy = statusVal === 'success' || statusVal === 'ok';

        return {
          statut_global: isHealthy ? 'healthy' : 'unhealthy',
          message: messageVal,
          server_timestamp: serverTs,
          client_latency_ms: clientLatency,
          derniere_verification: new Date().toISOString(),
        };
      })
    );
  }
}
