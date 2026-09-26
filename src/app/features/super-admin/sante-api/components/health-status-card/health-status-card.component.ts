import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { SystemHealthReport } from '../../models/sante-api.model';

@Component({
  selector: 'app-health-status-card',
  standalone: true,
  imports: [CardComponent, BadgeComponent],
  template: `
    <app-card title="Disponibilité & Connectivité de l'API">
      <div class="health-card-body">
        <div class="status-banner" [class]="'status-' + report().statut_global">
          <div class="status-icon-wrap" aria-hidden="true">
            <i [class]="statusIcon()"></i>
          </div>
          <div class="status-text-wrap">
            <div class="status-headline">
              <h3 class="status-title">{{ statusTitle() }}</h3>
              <app-badge
                [variant]="report().statut_global === 'healthy' ? 'success' : 'danger'"
                [label]="report().statut_global === 'healthy' ? 'Opérationnelle' : 'Indisponible'"
                [dot]="true"
              />
            </div>
            <p class="status-message">{{ report().message }}</p>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-item">
            <span class="label">Horodatage Serveur (ISO 8601)</span>
            <span class="value font-mono">{{ report().server_timestamp }}</span>
          </div>

          <div class="metric-item">
            <span class="label">Dernière vérification locale</span>
            <span class="value font-mono">{{ formattedLastChecked() }}</span>
          </div>

          <div class="metric-item">
            <span class="label">Temps de requête client (aller-retour HTTP)</span>
            <div class="latency-badge">
              <span class="latency-val font-semibold">{{ report().client_latency_ms }} ms</span>
              <span class="latency-subtext">Mesure réseau aller-retour</span>
            </div>
          </div>

          <div class="metric-item">
            <span class="label">Protocole & Endpoint interrogé</span>
            <span class="value font-mono font-xs">GET /api/v1/health</span>
          </div>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    .health-card-body {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .status-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid transparent;
    }
    .status-healthy {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }
    .status-unhealthy {
      background-color: #fef2f2;
      border-color: #fecaca;
    }
    .status-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .status-healthy .status-icon-wrap {
      background-color: #dcfce7;
      color: #15803d;
    }
    .status-unhealthy .status-icon-wrap {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .status-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .status-headline {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .status-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }
    .status-message {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      margin: 0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .label {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
    }
    .value {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
    }
    .font-mono {
      font-family: monospace;
    }
    .font-xs {
      font-size: 0.8125rem;
    }
    .font-semibold {
      font-weight: 600;
    }
    .latency-badge {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    .latency-val {
      font-size: 1.25rem;
      color: var(--color-primary-600, #3b82f6);
    }
    .latency-subtext {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthStatusCardComponent {
  public readonly report = input.required<SystemHealthReport>();

  protected readonly statusIcon = computed<string>(() => {
    return this.report().statut_global === 'healthy'
      ? 'bi bi-check-circle-fill'
      : 'bi bi-exclamation-triangle-fill';
  });

  protected readonly statusTitle = computed<string>(() => {
    return this.report().statut_global === 'healthy'
      ? 'L’API Catheo répond normalement'
      : 'Incident détecté sur le serveur API';
  });

  protected readonly formattedLastChecked = computed<string>(() => {
    const raw = this.report().derniere_verification;
    if (!raw) return '-';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleTimeString('fr-FR');
  });
}
