import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { OrganisationStatusBadgeComponent } from '../organisation-status-badge/organisation-status-badge.component';
import { OrganisationTypeBadgeComponent } from '../organisation-type-badge/organisation-type-badge.component';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';

@Component({
  selector: 'app-organisation-summary-card',
  standalone: true,
  imports: [
    CardComponent,
    OrganisationStatusBadgeComponent,
    OrganisationTypeBadgeComponent,
  ],
  template: `
    <app-card title="Synthèse de l'Organisation">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Organisation</span>
          <span class="value font-semibold">{{ organisation().nom }}</span>
          <span class="subtext">Code : {{ organisation().code }}</span>
        </div>

        <div class="summary-item">
          <span class="label">Type d'espace</span>
          <div class="mt-1">
            <app-organisation-type-badge [type]="organisation().type_organisation" />
          </div>
        </div>

        <div class="summary-item">
          <span class="label">Statut</span>
          <div class="mt-1">
            <app-organisation-status-badge [statut]="organisation().statut" />
          </div>
        </div>

        <div class="summary-item">
          <span class="label">Paroisse propriétaire</span>
          <span class="value">{{ paroisseNom() }}</span>
          @if (paroisseDiocese()) {
            <span class="subtext">Diocèse : {{ paroisseDiocese() }}</span>
          }
        </div>

        <div class="summary-item">
          <span class="label">Produit SaaS</span>
          <span class="value">{{ produitNom() }}</span>
          <span class="subtext">Code : {{ organisation().produit?.code || organisation().type_organisation }}</span>
        </div>

        <div class="summary-item">
          <span class="label">Mode de rattachement</span>
          <div class="mt-1">
            <span [class]="'badge-mode ' + modeClass()">
              {{ isIndependant() ? '🟣 Indépendante' : '🟢 Liée à la paroisse' }}
            </span>
          </div>
        </div>

        <div class="summary-item">
          <span class="label">Responsable Principal</span>
          <span class="value">{{ responsableNom() }}</span>
          @if (responsableEmail()) {
            <span class="subtext">{{ responsableEmail() }}</span>
          }
        </div>
      </div>


      <div class="metrics-row">
        <div class="metric-box">
          <span class="metric-value">{{ usersCount() }}</span>
          <span class="metric-label">Comptes Utilisateurs</span>
        </div>
        <div class="metric-box">
          <span class="metric-value">{{ membresCount() }}</span>
          <span class="metric-label">Membres Enregistrés</span>
        </div>
        <div class="metric-box">
          <span class="metric-value">{{ activitesCount() }}</span>
          <span class="metric-label">Activités Référencées</span>
        </div>
        <div class="metric-box">
          <span class="metric-value">{{ pelerinagesCount() }}</span>
          <span class="metric-label">Pèlerinages / Voyages</span>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .label {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 500;
    }
    .value {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
    }
    .subtext {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .font-semibold {
      font-weight: 600;
    }
    .mt-1 {
      margin-top: 0.25rem;
    }
    .metrics-row {
      display: flex;
      gap: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
    .metric-box {
      flex: 1;
      padding: 0.875rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary-600, #3b82f6);
    }
    .metric-label {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.25rem;
      text-transform: uppercase;
      font-weight: 500;
    }
    .badge-mode {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-mode.liee {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-mode.independant {
      background-color: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationSummaryCardComponent {
  public readonly organisation = input.required<SuperAdminOrganisation>();

  protected isIndependant(): boolean {
    const org = this.organisation();
    if (org.mode) return org.mode === 'independant';
    return !org.paroisse && !org.paroisse_configuration_id && !org.paroisse_id;
  }

  protected modeClass(): string {
    return this.isIndependant() ? 'independant' : 'liee';
  }

  protected paroisseNom(): string {
    const p = this.organisation().paroisse;
    return p?.nom_paroisse || p?.nom || (this.isIndependant() ? 'Aucune (Indépendante)' : 'Paroisse rattachée');
  }

  protected paroisseDiocese(): string {
    return this.organisation().paroisse?.diocese || '';
  }

  protected produitNom(): string {
    const pr = this.organisation().produit;
    return pr?.nom || `Espace ${this.organisation().type_organisation}`;
  }

  protected usersCount(): number {
    const org = this.organisation();
    return org.statistiques?.total_utilisateurs ?? org.utilisateurs?.length ?? org.users_count ?? 0;
  }

  protected membresCount(): number {
    const org = this.organisation();
    return org.statistiques?.total_membres ?? org.membres?.length ?? org.membres_count ?? 0;
  }

  protected activitesCount(): number {
    const org = this.organisation();
    return org.statistiques?.total_activites ?? org.activites?.length ?? org.activites_count ?? 0;
  }

  protected pelerinagesCount(): number {
    const org = this.organisation();
    return org.statistiques?.total_pelerinages ?? org.pelerinages?.length ?? 0;
  }

  protected responsableNom(): string {
    const org = this.organisation();
    return org.responsable_nom || org.responsable?.nom || 'Aucun responsable assigné';
  }

  protected responsableEmail(): string {
    const org = this.organisation();
    return org.responsable_email || org.responsable?.email || '';
  }
}

