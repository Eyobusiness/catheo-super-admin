import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableComponent } from '../../../../../shared/components/table/table.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { TableColumn } from '../../../../../shared/models/table.model';
import { EcheanceAbonnement } from '../../models/abonnement.model';
import { EcheanceStatusBadgeComponent } from '../echeance-status-badge/echeance-status-badge.component';

@Component({
  selector: 'app-echeance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmptyStateComponent,
    EcheanceStatusBadgeComponent,
  ],
  template: `
    <div class="echeance-list-container">
      @if (!echeances() || echeances()!.length === 0) {
        <app-empty-state
          title="Aucune échéance enregistrée"
          description="Cet abonnement ne comporte aucune échéance de facturation (les formules gratuites ne génèrent pas d'échéances)."
        />
      } @else {
        <div class="table-wrapper">
          <table class="echeance-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Période</th>
                <th>Date d'échéance</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Reste dû</th>
                <th>Statut</th>
                <th>Facture</th>
              </tr>
            </thead>
            <tbody>
              @for (ech of echeances()!; track ech.id) {
                <tr>
                  <td class="font-mono font-bold">
                    <a [routerLink]="['/super-admin/echeances', ech.id]" class="ref-link">
                      {{ ech.reference }}
                    </a>
                  </td>
                  <td class="text-sm">
                    {{ ech.periode_debut | date: 'dd/MM/yyyy' }} — {{ ech.periode_fin | date: 'dd/MM/yyyy' }}
                  </td>
                  <td class="text-sm font-medium">
                    {{ ech.date_echeance | date: 'dd/MM/yyyy' }}
                  </td>
                  <td class="font-bold">
                    {{ ech.montant | number }} {{ ech.devise }}
                  </td>
                  <td class="text-success font-medium">
                    {{ ech.montant_paye | number }} {{ ech.devise }}
                  </td>
                  <td [class.text-danger]="ech.solde_restant > 0" class="font-medium">
                    {{ ech.solde_restant | number }} {{ ech.devise }}
                  </td>
                  <td>
                    <app-echeance-status-badge [statut]="ech.statut" />
                  </td>
                  <td>
                    @if (ech.facture) {
                      <a [routerLink]="['/super-admin/factures', ech.facture.id]" class="facture-pill" [title]="ech.facture.statut">
                        <i class="bi bi-receipt"></i>
                        <span>{{ ech.facture.numero_facture || ech.facture.numero || ech.facture.reference }}</span>
                      </a>
                    } @else {
                      <span class="text-muted text-sm">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .echeance-list-container {
      width: 100%;
    }
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background-color: var(--bg-surface, #ffffff);
    }
    .echeance-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .echeance-table th {
      padding: 0.75rem 1rem;
      background-color: var(--neutral-50, #f8fafc);
      color: var(--text-secondary, #64748b);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .echeance-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-primary, #0f172a);
      vertical-align: middle;
    }
    .echeance-table tbody tr:last-child td {
      border-bottom: none;
    }
    .echeance-table tbody tr:hover td {
      background-color: var(--neutral-50, #f8fafc);
    }
    .font-mono {
      font-family: monospace;
      font-size: 0.8125rem;
    }
    .font-bold {
      font-weight: 700;
    }
    .font-medium {
      font-weight: 500;
    }
    .text-sm {
      font-size: 0.8125rem;
    }
    .text-success {
      color: var(--success-600, #059669);
    }
    .text-danger {
      color: var(--danger-600, #dc2626);
    }
    .text-muted {
      color: var(--text-secondary, #94a3b8);
    }
    .facture-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      background-color: var(--primary-50, #eff6ff);
      color: var(--primary-700, #1d4ed8);
      border: 1px solid var(--primary-200, #bfdbfe);
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcheanceListComponent {
  public readonly echeances = input<EcheanceAbonnement[] | null | undefined>([]);
}
