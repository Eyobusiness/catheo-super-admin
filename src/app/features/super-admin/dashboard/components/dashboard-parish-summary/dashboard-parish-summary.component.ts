import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { DashboardParoissesMetrics } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-parish-summary',
  standalone: true,
  imports: [CardComponent, BadgeComponent],
  template: `
    <app-card title="Paroisses & Déploiement" subtitle="État du parc paroissial de la plateforme">
      <div class="parish-summary-container">
        <!-- Big Stat Row -->
        <div class="parish-hero-stats">
          <div class="hero-stat-block">
            <span class="hero-number">{{ paroisses().total }}</span>
            <span class="hero-label">Total Paroisses Déployées</span>
          </div>

          <div class="hero-divider"></div>

          <div class="hero-stat-block highlight-success">
            <span class="hero-number">{{ paroisses().actives }}</span>
            <span class="hero-label">Paroisses Actives</span>
          </div>

          <div class="hero-divider"></div>

          <div class="hero-stat-block">
            <span class="hero-number">{{ inactivesCount() }}</span>
            <span class="hero-label">Inactives / En attente</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="rate-progress-section">
          <div class="rate-header-row">
            <span class="rate-label">Taux d'activité du parc</span>
            <span class="rate-value">{{ activityRate() }}%</span>
          </div>
          <div class="progress-track" role="progressbar" [attr.aria-valuenow]="activityRate()" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" [style.width.%]="activityRate()"></div>
          </div>
        </div>

        <!-- Catalog Products count -->
        <div class="catalog-status-row">
          <div class="catalog-info">
            <i class="bi bi-shield-check text-primary"></i>
            <span class="catalog-text">Modules activés sur la plateforme :</span>
          </div>
          <app-badge [variant]="'primary'" [size]="'sm'">
            {{ produitsActifs() }} modules actifs
          </app-badge>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .parish-summary-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .parish-hero-stats {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 1rem 0.5rem;
      border-radius: 0.75rem;
      background: var(--bg-surface-secondary, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .hero-stat-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      text-align: center;
    }
    .hero-number {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1;
    }
    .hero-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
    }
    .highlight-success .hero-number {
      color: var(--success-600, #16a34a);
    }
    .hero-divider {
      width: 1px;
      height: 36px;
      background: var(--border-color, #e2e8f0);
    }
    .rate-progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .rate-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
    }
    .rate-label {
      font-weight: 600;
      color: var(--text-secondary, #475569);
    }
    .rate-value {
      font-weight: 700;
      color: var(--primary-600, #2563eb);
    }
    .progress-track {
      width: 100%;
      height: 8px;
      background: var(--border-color, #e2e8f0);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .catalog-status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: var(--bg-surface-secondary, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .catalog-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary, #0f172a);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardParishSummaryComponent {
  public readonly paroisses = input.required<DashboardParoissesMetrics>();
  public readonly produitsActifs = input.required<number>();

  protected readonly inactivesCount = computed(() => {
    const total = this.paroisses().total;
    const actives = this.paroisses().actives;
    return Math.max(0, total - actives);
  });

  protected readonly activityRate = computed(() => {
    const total = this.paroisses().total;
    if (total <= 0) return 0;
    return Math.round((this.paroisses().actives / total) * 100);
  });
}
