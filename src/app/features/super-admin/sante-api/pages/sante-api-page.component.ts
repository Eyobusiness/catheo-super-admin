import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SanteApiService } from '../services/sante-api.service';
import { SystemHealthReport } from '../models/sante-api.model';
import { HealthStatusCardComponent } from '../components/health-status-card/health-status-card.component';

@Component({
  selector: 'app-sante-api-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    HealthStatusCardComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Santé & Disponibilité API"
        subtitle="Contrôle technique officiel du serveur central Catheo et latence applicative"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Santé API' }
        ]"
      >
        <div page-actions class="d-flex gap-2">
          <app-btn
            variant="primary"
            size="md"
            (btnClick)="checkHealth()"
            [loading]="loading()"
            title="Lancer une vérification immédiate du backend"
          >
            <i class="bi bi-arrow-repeat me-1"></i>
            <span>Vérifier maintenant</span>
          </app-btn>
        </div>
      </app-page-header>

      <div class="health-content">
        @if (loading() && !report()) {
          <app-loading-state message="Vérification de la connectivité avec l'API centrale..." />
        } @else if (hasError() && !report()) {
          <app-error-state
            title="API Inaccessible"
            [message]="errorMessage()"
            (retry)="checkHealth()"
          />
        } @else if (report()) {
          <!-- Carte principale d'état de santé -->
          <app-health-status-card [report]="report()!" />

          <!-- Carte d'informations d'infrastructure -->
          <div class="mt-4">
            <app-card title="Spécifications & Architecture Backend">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Framework Backend</span>
                  <span class="info-value">Laravel 11 / PHP 8.2+</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mode d'authentification</span>
                  <span class="info-value">Laravel Sanctum (Tokens Bearer)</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Modèle Multi-Tenant</span>
                  <span class="info-value">Isolation par paroisse & X-Organisation-Id</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Règles de limitation de débit</span>
                  <span class="info-value">Throttling actif par IP / utilisateur</span>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">Périmètre d'audit & Intégrité</span>
                  <p class="desc-text">
                    La surveillance technique est grounded sur l’endpoint réel <code>/api/v1/health</code>.
                    Conformément aux directives de sécurité, aucun secret, mot de passe ou métrique fictive n'est exposé.
                  </p>
                </div>
              </div>
            </app-card>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }
    .d-flex {
      display: flex;
    }
    .gap-2 {
      gap: 0.5rem;
    }
    .me-1 {
      margin-right: 0.25rem;
    }
    .mt-4 {
      margin-top: 1.25rem;
    }
    .health-content {
      display: flex;
      flex-direction: column;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .info-label {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
    }
    .info-value {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
      font-weight: 500;
    }
    .desc-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      line-height: 1.5;
    }
    code {
      font-family: monospace;
      padding: 0.125rem 0.25rem;
      background-color: var(--bg-muted, #f1f5f9);
      border-radius: 4px;
      font-size: 0.8125rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SanteApiPageComponent implements OnInit {
  private readonly santeService = inject(SanteApiService);
  private readonly toast = inject(ToastService);

  protected readonly report = signal<SystemHealthReport | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  public ngOnInit(): void {
    this.checkHealth(false);
  }

  public checkHealth(showToast = true): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.santeService.getHealthReport().subscribe({
      next: (rep) => {
        this.report.set(rep);
        this.loading.set(false);
        if (showToast) {
          this.toast.show(
            rep.statut_global === 'healthy' ? 'success' : 'warning',
            'Contrôle de santé API',
            `Connectivité confirmée en ${rep.client_latency_ms} ms.`
          );
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(
          err.message || 'Impossible de joindre le serveur API central.'
        );
        if (showToast) {
          this.toast.show(
            'error',
            'Échec du contrôle',
            'Le serveur API ne répond pas ou est inaccessible.'
          );
        }
      },
    });
  }
}
