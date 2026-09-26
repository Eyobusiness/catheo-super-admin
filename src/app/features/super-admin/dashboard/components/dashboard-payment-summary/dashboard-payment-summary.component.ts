import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { CurrencyCfaPipe } from '../../../../../shared/pipes/currency-cfa.pipe';
import { DashboardFinancesMetrics } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-payment-summary',
  standalone: true,
  imports: [CardComponent, BadgeComponent, CurrencyCfaPipe],
  template: `
    <app-card title="Finances & Facturation Plateforme" subtitle="Encaissements des abonnements paroissiaux">
      <div class="payment-summary-container">
        <!-- 2 Big Financial KPI blocks -->
        <div class="finances-kpi-grid">
          <div class="finance-card ca-total">
            <span class="finance-label">Chiffre d'Affaires Total Encaissé</span>
            <span class="finance-amount">{{ finances().ca_total_encaisse | currencyCfa:finances().devise }}</span>
            <span class="finance-sub">Paiements validés plateforme</span>
          </div>

          <div class="finance-card ca-month">
            <span class="finance-label">Encaissements Mois</span>
            <span class="finance-amount text-success">{{ finances().ca_mois_courant | currencyCfa:finances().devise }}</span>
            <span class="finance-sub">Mois en cours</span>
          </div>
        </div>

        <!-- Arrears / Delays Section -->
        <div class="arrears-panel" [class.has-delay]="finances().echeances_en_retard > 0">
          <div class="arrears-icon-col">
            <i class="bi" [class]="finances().echeances_en_retard > 0 ? 'bi-exclamation-triangle-fill text-danger' : 'bi-check-circle-fill text-success'"></i>
          </div>
          <div class="arrears-content-col">
            <div class="arrears-title-row">
              <span class="arrears-title">
                @if (finances().echeances_en_retard > 0) {
                  {{ finances().echeances_en_retard }} échéance(s) en retard de paiement
                } @else {
                  Aucune échéance en retard
                }
              </span>
              @if (finances().echeances_en_retard > 0) {
                <app-badge [variant]="'danger'" [size]="'sm'">Impayés</app-badge>
              } @else {
                <app-badge [variant]="'success'" [size]="'sm'">À jour</app-badge>
              }
            </div>
            <p class="arrears-desc">
              @if (finances().echeances_en_retard > 0) {
                Montant total en souffrance : <strong>{{ finances().montant_en_retard | currencyCfa:finances().devise }}</strong>
              } @else {
                Tous les abonnements sont à jour de facturation.
              }
            </p>
          </div>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .payment-summary-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .finances-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.875rem;
    }
    .finance-card {
      padding: 1.25rem 1rem;
      border-radius: 0.75rem;
      background: var(--bg-surface-secondary, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .finance-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .finance-amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1.1;
    }
    .text-success {
      color: var(--success-600, #16a34a);
    }
    .finance-sub {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }
    .arrears-panel {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.75rem;
      background: var(--bg-surface-secondary, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .arrears-panel.has-delay {
      background: rgba(239, 68, 68, 0.04);
      border-color: rgba(239, 68, 68, 0.3);
    }
    .arrears-icon-col {
      font-size: 1.5rem;
      display: flex;
      align-items: center;
    }
    .arrears-content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .arrears-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .arrears-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .arrears-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary, #475569);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPaymentSummaryComponent {
  public readonly finances = input.required<DashboardFinancesMetrics>();
}
