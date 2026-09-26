import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { RapportService } from '../services/rapport.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PrintService } from '../../../../core/services/print.service';
import { formatCfa } from '../../../../shared/utils/format.utils';
import { RapportAnnuel } from '../models/rapport.model';

@Component({
  selector: 'app-rapports-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    StatCardComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="rapports-page-container">
      <!-- En-tête -->
      <app-page-header
        title="Rapports & Bilan Annuel"
        subtitle="Rapport annuel consolidé, activités et états financiers officiels"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="flex items-center gap-2">
          <div class="flex items-center gap-2 year-selector-wrap">
            <label for="annee-select" class="text-sm font-semibold text-muted">Exercice :</label>
            <select
              id="annee-select"
              [value]="selectedAnnee()"
              (change)="onAnneeChange($event)"
              class="year-select"
              aria-label="Sélectionner l'année d'exercice"
            >
              @for (annee of anneesDisponibles; track annee) {
                <option [value]="annee">{{ annee }}</option>
              }
            </select>
          </div>
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="loadRapport()"
          >
            Actualiser
          </app-btn>

          @if (rapport()) {
            <app-btn
              variant="outline"
              icon="printer"
              (btnClick)="printRapport()"
            >
              Imprimer Bilan
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- État de chargement -->
      @if (isLoading()) {
        <div class="mt-6">
          <app-loading-state message="Génération du rapport annuel officiel..." />
        </div>
      }

      <!-- État d'erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Impossible de charger le rapport annuel"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadRapport()"
          />
        </div>
      }

      <!-- Rapport chargé avec succès -->
      @if (rapport(); as r) {
        @if (!isLoading()) {
          <!-- Cartes Synthèse Bilan Annuel -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <app-stat-card
              title="Effectif Membres"
              [value]="r.membres.total"
              subtitle="{{ r.membres.actifs }} actifs • +{{ r.membres.nouvelles_adhesions }} adhésions"
              icon="bi bi-people-fill"
              theme="primary"
            />
            <app-stat-card
              title="Activités Réalisées"
              [value]="r.activites.total"
              subtitle="Taux moyen : {{ r.activites.taux_moyen_execution }}%"
              icon="bi bi-calendar-check"
              theme="primary"
            />
            <app-stat-card
              title="Pèlerinages"
              [value]="r.pelerinages.campagnes"
              subtitle="{{ r.pelerinages.total_participants }} participants • {{ r.pelerinages.taux_presence }}% présence"
              icon="bi bi-geo-alt-fill"
              theme="primary"
            />
            <app-stat-card
              title="Solde Net Exercice"
              [value]="formatCfa(r.finances.solde_net)"
              subtitle="Entrées : {{ formatCfa(r.finances.total_entrees) }}"
              icon="bi bi-wallet2"
              [theme]="r.finances.solde_net >= 0 ? 'success' : 'danger'"
            />
          </div>

          <!-- Document de rapport consolidé officiel -->
          <div class="mt-6 catheo-printable-document">
            <app-card>
              <!-- En-tête du document officiel -->
              <div class="report-doc-header">
                <div class="org-badge-wrap">
                  <span class="report-badge">{{ r.organisation.type_organisation }}</span>
                  <span class="report-code">Code : {{ r.organisation.code }}</span>
                </div>
                <h2 class="report-doc-title">
                  Bilan Annuel d'Activité et Financier — Exercice {{ r.annee_exercice }}
                </h2>
                <p class="report-doc-subtitle">
                  Organisation : <strong class="text-primary">{{ r.organisation.nom }}</strong>
                </p>
              </div>

              <hr class="report-divider" />

              <!-- Corps du rapport avec les différentes sections obligatoires -->
              <div class="report-sections-grid">
                <!-- 1. MEMBRES -->
                <div class="report-section-block">
                  <h3 class="section-title">
                    <i class="bi bi-people mr-2 text-primary"></i>
                    1. Effectif & Adhésions
                  </h3>
                  <div class="report-metrics-table">
                    <div class="report-row">
                      <span class="label">Total membres inscrits</span>
                      <span class="val font-bold">{{ r.membres.total }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Membres actifs</span>
                      <span class="val text-success font-bold">{{ r.membres.actifs }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Membres inactifs</span>
                      <span class="val text-muted">{{ r.membres.inactifs }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Nouvelles adhésions de l'année</span>
                      <span class="val text-primary font-bold">+{{ r.membres.nouvelles_adhesions }}</span>
                    </div>
                  </div>
                </div>

                <!-- 2. ACTIVITÉS -->
                <div class="report-section-block">
                  <h3 class="section-title">
                    <i class="bi bi-calendar-event mr-2 text-primary"></i>
                    2. Activités & Projets
                  </h3>
                  <div class="report-metrics-table">
                    <div class="report-row">
                      <span class="label">Total activités organisées</span>
                      <span class="val font-bold">{{ r.activites.total }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Taux moyen d'exécution</span>
                      <span class="val text-success font-bold">{{ r.activites.taux_moyen_execution }}%</span>
                    </div>
                    @for (st of getObjectKeys(r.activites.repartition_statut); track st) {
                      <div class="report-row">
                        <span class="label capitalize">Statut : {{ st }}</span>
                        <span class="val">{{ r.activites.repartition_statut[st] }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- 3. PÈLERINAGES -->
                <div class="report-section-block">
                  <h3 class="section-title">
                    <i class="bi bi-geo-alt mr-2 text-primary"></i>
                    3. Campagnes de Pèlerinages
                  </h3>
                  <div class="report-metrics-table">
                    <div class="report-row">
                      <span class="label">Campagnes lancées</span>
                      <span class="val font-bold">{{ r.pelerinages.campagnes }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Total participants inscrits</span>
                      <span class="val font-bold">{{ r.pelerinages.total_participants }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Présents confirmés</span>
                      <span class="val text-success font-bold">{{ r.pelerinages.presents }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Absents / Désistements</span>
                      <span class="val text-danger">{{ r.pelerinages.absents }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Taux d'assiduité / présence</span>
                      <span class="val font-bold">{{ r.pelerinages.taux_presence }}%</span>
                    </div>
                  </div>
                </div>

                <!-- 4. FINANCES & CAISSE -->
                <div class="report-section-block">
                  <h3 class="section-title">
                    <i class="bi bi-cash-stack mr-2 text-primary"></i>
                    4. Bilan Financier de l'Exercice
                  </h3>
                  <div class="report-metrics-table">
                    <div class="report-row">
                      <span class="label">Total des recettes (Entrées)</span>
                      <span class="val text-success font-bold">+{{ formatCfa(r.finances.total_entrees) }}</span>
                    </div>
                    <div class="report-row">
                      <span class="label">Total des dépenses (Sorties)</span>
                      <span class="val text-danger font-bold">-{{ formatCfa(r.finances.total_sorties) }}</span>
                    </div>
                    <div class="report-row highlight-row">
                      <span class="label font-bold">Solde net de l'exercice</span>
                      <span
                        class="val font-bold"
                        [class.text-success]="r.finances.solde_net >= 0"
                        [class.text-danger]="r.finances.solde_net < 0"
                      >
                        {{ formatCfa(r.finances.solde_net) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 5. POPULATION CATHEO (SI CONNECTÉE) -->
              <div class="report-catheo-box mt-6">
                <h3 class="section-title">
                  <i class="bi bi-book mr-2 text-primary"></i>
                  5. Population Pastorale CATHEO
                </h3>
                @if (r.catheo.catheo_connecte) {
                  <div class="catheo-connected-info mt-2">
                    <p class="text-sm">
                      <i class="bi bi-check-circle-fill text-success mr-1"></i>
                      Organisation interconnectée à la paroisse pour l'année catéchétique :
                      <strong>{{ r.catheo.annee_catechese }}</strong>.
                    </p>
                    <div class="flex flex-wrap gap-4 items-center mt-3">
                      <div class="catheo-badge-stat">
                        <span class="text-xs text-muted">Effectif total couvert :</span>
                        <strong class="text-base text-primary">{{ r.catheo.total_population }} catéchumènes</strong>
                      </div>
                      <div class="catheo-badge-stat">
                        <span class="text-xs text-muted">Sections rattachées :</span>
                        <strong>{{ r.catheo.sections?.join(', ') || '—' }}</strong>
                      </div>
                    </div>
                  </div>
                } @else {
                  <p class="text-sm text-muted mt-2">
                    <i class="bi bi-info-circle mr-1"></i>
                    Organisation autonome ou sans intégration pastorale CATHEO active sur cet exercice.
                  </p>
                }
              </div>
            </app-card>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .rapports-page-container {
      display: flex;
      flex-direction: column;
    }
    .year-selector-wrap {
      background: var(--bg-surface, #ffffff);
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .year-select {
      font-weight: 700;
      color: var(--color-primary, #6366f1);
      border: none;
      background: transparent;
      outline: none;
      cursor: pointer;
    }
    .report-doc-header {
      text-align: center;
      padding: 1.5rem 0 0.5rem 0;
    }
    .org-badge-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .report-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--color-primary-light, #e0e7ff);
      color: var(--color-primary, #6366f1);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }
    .report-code {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .report-doc-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-color, #1e293b);
      margin: 0.25rem 0;
    }
    .report-doc-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    .report-divider {
      border: 0;
      border-top: 1px solid var(--border-color, #e2e8f0);
      margin: 1.5rem 0;
    }
    .report-sections-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.5rem;
    }
    @media (min-width: 768px) {
      .report-sections-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .report-section-block {
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1rem 1.25rem;
    }
    .section-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
    }
    .report-metrics-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .report-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
      padding: 0.25rem 0;
      border-bottom: 1px dashed var(--border-color, #e2e8f0);
    }
    .report-row:last-child {
      border-bottom: none;
    }
    .highlight-row {
      padding-top: 0.5rem;
      font-size: 0.875rem;
    }
    .report-catheo-box {
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1rem 1.25rem;
    }
    .catheo-badge-stat {
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
    }
    .grid {
      display: grid;
    }
    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 640px) {
      .sm\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    .gap-4 {
      gap: 1rem;
    }
    .mt-2 {
      margin-top: 0.5rem;
    }
    .mt-3 {
      margin-top: 0.75rem;
    }
    .mt-6 {
      margin-top: 1.5rem;
    }
    .mr-1 {
      margin-right: 0.25rem;
    }
    .mr-2 {
      margin-right: 0.5rem;
    }
    .text-xs {
      font-size: 0.75rem;
    }
    .text-sm {
      font-size: 0.875rem;
    }
    .text-base {
      font-size: 1rem;
    }
    .text-muted {
      color: var(--text-muted, #64748b);
    }
    .font-bold {
      font-weight: 700;
    }
    .text-success {
      color: var(--color-success, #10b981);
    }
    .text-danger {
      color: var(--color-danger, #ef4444);
    }
    .text-primary {
      color: var(--color-primary, #6366f1);
    }
    .capitalize {
      text-transform: capitalize;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportsPageComponent implements OnInit {
  private readonly rapportService = inject(RapportService);
  private readonly orgContext = inject(OrganisationContextService);
  private readonly printService = inject(PrintService);

  public readonly formatCfa = formatCfa;

  public readonly typeOrganisation = computed(() => {
    return this.orgContext.typeOrganisation() || 'Organisation';
  });

  public readonly anneesDisponibles = [2027, 2026, 2025, 2024, 2023];
  public readonly selectedAnnee = signal<number>(new Date().getFullYear());

  public readonly isLoading = signal<boolean>(false);
  public readonly rapport = signal<RapportAnnuel | null>(null);
  public readonly errorMessage = signal<string | null>(null);

  public ngOnInit(): void {
    this.loadRapport();
  }

  public onAnneeChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.selectedAnnee.set(val);
    this.loadRapport();
  }

  public loadRapport(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rapportService.getRapportAnnuel(this.selectedAnnee()).subscribe({
      next: (data) => {
        this.rapport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Impossible de charger le rapport annuel pour cet exercice.'
        );
      },
    });
  }

  public getObjectKeys(obj: Record<string, any> | null | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  public printRapport(): void {
    const r = this.rapport();
    const orgName = r?.organisation?.nom || 'Organisation';
    const annee = this.selectedAnnee();
    this.printService.printDocument(`Bilan Annuel ${annee} - ${orgName}`);
  }
}
