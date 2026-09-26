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
import { CardComponent } from '../../../../shared/components/card/card.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StatistiqueService } from '../services/statistique.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PrintService } from '../../../../core/services/print.service';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  ActivitesStatFilters,
  FinancesStatFilters,
  MembresStatFilters,
  PelerinagesStatFilters,
  StatistiquesActivites,
  StatistiquesFinances,
  StatistiquesMembres,
  StatistiquesPelerinages,
} from '../models/statistique.model';

type StatTab = 'synthese' | 'membres' | 'activites' | 'pelerinages' | 'finances' | 'catheo';

@Component({
  selector: 'app-statistiques-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    StatCardComponent,
    ButtonComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="statistiques-page-container catheo-printable-document">
      <!-- En-tête -->
      <app-page-header
        title="Statistiques & Rapports"
        subtitle="Analyses chiffrées, indicateurs réels et projections pastorales"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="flex items-center gap-2">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoadingAny()"
            (btnClick)="refreshCurrentTab()"
          >
            Actualiser
          </app-btn>

          <app-btn
            variant="outline"
            icon="printer"
            (btnClick)="printStatistiques()"
          >
            Imprimer
          </app-btn>
        </div>
      </app-page-header>

      <!-- Navigation par onglets -->
      <div class="tabs-nav mt-3">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'synthese'"
          (click)="setActiveTab('synthese')"
        >
          <i class="bi bi-speedometer2 mr-1.5"></i>
          Synthèse globale
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'membres'"
          (click)="setActiveTab('membres')"
        >
          <i class="bi bi-people mr-1.5"></i>
          Membres
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'activites'"
          (click)="setActiveTab('activites')"
        >
          <i class="bi bi-calendar-event mr-1.5"></i>
          Activités
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'pelerinages'"
          (click)="setActiveTab('pelerinages')"
        >
          <i class="bi bi-geo-alt mr-1.5"></i>
          Pèlerinages
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'finances'"
          (click)="setActiveTab('finances')"
        >
          <i class="bi bi-cash-stack mr-1.5"></i>
          Finances
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'catheo'"
          (click)="setActiveTab('catheo')"
        >
          <i class="bi bi-book mr-1.5"></i>
          Population CATHEO
        </button>
      </div>

      <!-- ==================================================== -->
      <!-- 1. ONGLET : SYNTHÈSE GLOBALE (DASHBOARD CONSOLIDÉ) -->
      <!-- ==================================================== -->
      @if (activeTab() === 'synthese') {
        @if (isLoadingDashboard()) {
          <div class="mt-4">
            <app-loading-state message="Chargement des indicateurs consolidés..." />
          </div>
        } @else if (dashboardError()) {
          <div class="mt-4">
            <app-error-state
              title="Erreur de chargement"
              [message]="dashboardError()!"
              actionText="Réessayer"
              (action)="loadDashboard()"
            />
          </div>
        } @else if (dashboardData(); as d) {
          <!-- Cartes Synthèse -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <app-stat-card
              title="Membres Actifs"
              [value]="d.membres.actifs + ' / ' + d.membres.total"
              subtitle="Taux d'activité : {{ getMembresRatio(d.membres.actifs, d.membres.total) }}%"
              icon="bi bi-people-fill"
              theme="primary"
            />
            <app-stat-card
              title="Activités Terminées"
              [value]="d.activites.terminees + ' / ' + d.activites.total"
              subtitle="Taux moyen : {{ d.activites.taux_moyen_execution }}%"
              icon="bi bi-check-circle-fill"
              theme="success"
            />
            <app-stat-card
              title="Inscrits Pèlerinages"
              [value]="d.pelerinages.total_inscrits"
              subtitle="{{ d.pelerinages.campagnes_total }} campagne(s) au total"
              icon="bi bi-geo-alt-fill"
              theme="primary"
            />
            <app-stat-card
              title="Solde Financier"
              [value]="formatCfa(d.finances.solde)"
              subtitle="Recettes : {{ formatCfa(d.finances.total_entrees) }}"
              icon="bi bi-wallet2"
              [theme]="d.finances.solde >= 0 ? 'success' : 'danger'"
            />
          </div>

          <!-- Grille des synthèses sectorielles -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- Synthèse Activités -->
            <app-card>
              <div class="section-card-header">
                <h3 class="section-title">
                  <i class="bi bi-activity mr-2 text-primary"></i>
                  Statuts des Activités
                </h3>
              </div>
              <div class="stat-progress-list mt-3">
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Terminées</span>
                    <span class="font-bold">{{ d.activites.terminees }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-success"
                      [style.width.%]="getProgressPercent(d.activites.terminees, d.activites.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>En cours</span>
                    <span class="font-bold">{{ d.activites.en_cours }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-primary"
                      [style.width.%]="getProgressPercent(d.activites.en_cours, d.activites.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Planifiées</span>
                    <span class="font-bold">{{ d.activites.planifiees }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-info"
                      [style.width.%]="getProgressPercent(d.activites.planifiees, d.activites.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Brouillons / Annulées</span>
                    <span class="font-bold">{{ d.activites.brouillon + d.activites.annulees }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-muted"
                      [style.width.%]="getProgressPercent(d.activites.brouillon + d.activites.annulees, d.activites.total)"
                    ></div>
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Synthèse Recouvrement Pèlerinages -->
            <app-card>
              <div class="section-card-header">
                <h3 class="section-title">
                  <i class="bi bi-cash-coin mr-2 text-success"></i>
                  Recouvrement Pèlerinages
                </h3>
              </div>
              <div class="financial-summary-grid mt-3">
                <div class="financial-stat-box">
                  <span class="label">Montant attendu</span>
                  <span class="val">{{ formatCfa(d.pelerinages.montant_attendu) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Montant encaissé</span>
                  <span class="val text-success">{{ formatCfa(d.pelerinages.montant_encaisse) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Reste à encaisser</span>
                  <span class="val text-danger">{{ formatCfa(d.pelerinages.reste_a_encaisser) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Taux d'encaissement</span>
                  <span class="val font-bold">
                    {{ getProgressPercent(d.pelerinages.montant_encaisse, d.pelerinages.montant_attendu) }}%
                  </span>
                </div>
              </div>
              <div class="mt-3">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill fill-success"
                    [style.width.%]="getProgressPercent(d.pelerinages.montant_encaisse, d.pelerinages.montant_attendu)"
                  ></div>
                </div>
              </div>
            </app-card>
          </div>
        }
      }

      <!-- ==================================================== -->
      <!-- 2. ONGLET : STATISTIQUES MEMBRES -->
      <!-- ==================================================== -->
      @if (activeTab() === 'membres') {
        <div class="filter-zone mt-3">
          <div class="filter-header">
            <div class="filter-title">
              <i class="bi bi-funnel text-primary"></i>
              <span>Filtres de recherche</span>
            </div>
            @if (hasMembresFilters()) {
              <button type="button" class="btn-reset-filters" (click)="resetMembresFilters()" title="Effacer les filtres">
                <i class="bi bi-arrow-counterclockwise"></i>
                <span>Réinitialiser</span>
              </button>
            }
          </div>
          <div class="filter-controls-row">
            <div class="filter-control-item">
              <label class="filter-label">Statut</label>
              <select
                [value]="filterMembresStatut()"
                (change)="onFilterMembresStatutChange($event)"
                class="filter-select"
                aria-label="Statut membre"
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            <div class="filter-control-item">
              <label class="filter-label">Sexe</label>
              <select
                [value]="filterMembresSexe()"
                (change)="onFilterMembresSexeChange($event)"
                class="filter-select"
                aria-label="Sexe membre"
              >
                <option value="">Tous les sexes</option>
                <option value="M">Hommes (M)</option>
                <option value="F">Femmes (F)</option>
              </select>
            </div>

            <div class="filter-control-item filter-control-expand">
              <label class="filter-label">Fonction</label>
              <div class="input-with-icon">
                <i class="bi bi-search input-icon"></i>
                <input
                  type="text"
                  [value]="filterMembresFonction()"
                  (input)="onFilterMembresFonctionChange($event)"
                  placeholder="Ex: Responsable, Choriste..."
                  class="filter-input-text"
                  aria-label="Fonction membre"
                />
              </div>
            </div>

            <div class="filter-control-item">
              <label class="filter-label">Période d'adhésion</label>
              <div class="date-range-box">
                <span class="date-prefix">Du</span>
                <input
                  type="date"
                  [value]="filterMembresDateDebut()"
                  (change)="onFilterMembresDateDebutChange($event)"
                  class="filter-input-date"
                  title="Date entrée début"
                />
                <span class="date-sep">au</span>
                <input
                  type="date"
                  [value]="filterMembresDateFin()"
                  (change)="onFilterMembresDateFinChange($event)"
                  class="filter-input-date"
                  title="Date entrée fin"
                />
              </div>
            </div>
          </div>
        </div>

        @if (isLoadingMembres()) {
          <div class="mt-4">
            <app-loading-state message="Chargement des statistiques des membres..." />
          </div>
        } @else if (membresError()) {
          <div class="mt-4">
            <app-error-state
              title="Erreur de chargement"
              [message]="membresError()!"
              actionText="Réessayer"
              (action)="loadMembresStats()"
            />
          </div>
        } @else if (membresStats(); as m) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <app-stat-card
              title="Total Membres"
              [value]="m.total"
              subtitle="Effectif enregistré"
              icon="bi bi-people"
              theme="primary"
            />
            <app-stat-card
              title="Membres Actifs"
              [value]="m.actifs"
              subtitle="Taux : {{ getMembresRatio(m.actifs, m.total) }}%"
              icon="bi bi-person-check-fill"
              theme="success"
            />
            <app-stat-card
              title="Membres Inactifs"
              [value]="m.inactifs"
              subtitle="Non cotisants ou en pause"
              icon="bi bi-person-x-fill"
              theme="danger"
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- Répartition par Sexe -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-gender-ambiguous mr-2 text-primary"></i>
                Répartition par Sexe
              </h3>
              <div class="gender-bar-container">
                <div class="flex justify-between text-sm mb-2">
                  <span class="font-bold text-blue-600">
                    <i class="bi bi-gender-male mr-1"></i> Hommes : {{ m.repartition_sexe.M || 0 }} ({{ getMembresRatio(m.repartition_sexe.M || 0, m.total) }}%)
                  </span>
                  <span class="font-bold text-pink-600">
                    <i class="bi bi-gender-female mr-1"></i> Femmes : {{ m.repartition_sexe.F || 0 }} ({{ getMembresRatio(m.repartition_sexe.F || 0, m.total) }}%)
                  </span>
                </div>
                <div class="dual-progress-bar">
                  <div
                    class="bar-male"
                    [style.width.%]="getMembresRatio(m.repartition_sexe.M || 0, m.total)"
                  ></div>
                  <div
                    class="bar-female"
                    [style.width.%]="getMembresRatio(m.repartition_sexe.F || 0, m.total)"
                  ></div>
                </div>
              </div>
            </app-card>

            <!-- Répartition par Fonction -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-briefcase mr-2 text-primary"></i>
                Répartition par Fonction
              </h3>
              @if (getObjectKeys(m.repartition_fonction).length === 0) {
                <p class="text-sm text-muted">Aucune fonction spécifiée.</p>
              } @else {
                <div class="table-responsive">
                  <table class="simple-data-table">
                    <thead>
                      <tr>
                        <th>Fonction</th>
                        <th class="text-right">Effectif</th>
                        <th class="text-right">Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (key of getObjectKeys(m.repartition_fonction); track key) {
                        <tr>
                          <td>{{ key }}</td>
                          <td class="text-right font-bold">{{ m.repartition_fonction[key] }}</td>
                          <td class="text-right text-muted">
                            {{ getMembresRatio(m.repartition_fonction[key], m.total) }}%
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-card>
          </div>

          <!-- Évolution des adhésions -->
          <div class="mt-4">
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-graph-up-arrow mr-2 text-primary"></i>
                Évolution des adhésions par période
              </h3>
              @if (getObjectKeys(m.evolution_adhesions).length === 0) {
                <p class="text-sm text-muted">Aucune donnée temporelle d'entrée enregistrée.</p>
              } @else {
                <div class="bar-chart-grid">
                  @for (p of getObjectKeys(m.evolution_adhesions); track p) {
                    <div class="bar-chart-item">
                      <div class="bar-val font-bold text-primary">{{ m.evolution_adhesions[p] }}</div>
                      <div class="bar-col">
                        <div
                          class="bar-fill bg-primary"
                          [style.height.%]="getChartBarHeight(m.evolution_adhesions[p], getMaxVal(m.evolution_adhesions))"
                        ></div>
                      </div>
                      <div class="bar-label">{{ p }}</div>
                    </div>
                  }
                </div>
              }
            </app-card>
          </div>
        }
      }

      <!-- ==================================================== -->
      <!-- 3. ONGLET : STATISTIQUES ACTIVITÉS -->
      <!-- ==================================================== -->
      @if (activeTab() === 'activites') {
        <div class="filter-zone mt-3">
          <div class="filter-header">
            <div class="filter-title">
              <i class="bi bi-funnel text-primary"></i>
              <span>Filtres de recherche</span>
            </div>
            @if (hasActivitesFilters()) {
              <button type="button" class="btn-reset-filters" (click)="resetActivitesFilters()" title="Effacer les filtres">
                <i class="bi bi-arrow-counterclockwise"></i>
                <span>Réinitialiser</span>
              </button>
            }
          </div>
          <div class="filter-controls-row">
            <div class="filter-control-item">
              <label class="filter-label">Statut</label>
              <select
                [value]="filterActivitesStatut()"
                (change)="onFilterActivitesStatutChange($event)"
                class="filter-select"
                aria-label="Statut activité"
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            <div class="filter-control-item filter-control-expand">
              <label class="filter-label">Type d'activité</label>
              <div class="input-with-icon">
                <i class="bi bi-tag input-icon"></i>
                <input
                  type="text"
                  [value]="filterActivitesType()"
                  (input)="onFilterActivitesTypeChange($event)"
                  placeholder="Ex: Retraite, Messe, Pèlerinage..."
                  class="filter-input-text"
                  aria-label="Type activité"
                />
              </div>
            </div>

            <div class="filter-control-item">
              <label class="filter-label">Période de déroulement</label>
              <div class="date-range-box">
                <span class="date-prefix">Du</span>
                <input
                  type="date"
                  [value]="filterActivitesDateDebut()"
                  (change)="onFilterActivitesDateDebutChange($event)"
                  class="filter-input-date"
                  title="Date début"
                />
                <span class="date-sep">au</span>
                <input
                  type="date"
                  [value]="filterActivitesDateFin()"
                  (change)="onFilterActivitesDateFinChange($event)"
                  class="filter-input-date"
                  title="Date fin"
                />
              </div>
            </div>
          </div>
        </div>

        @if (isLoadingActivites()) {
          <div class="mt-4">
            <app-loading-state message="Chargement des statistiques des activités..." />
          </div>
        } @else if (activitesError()) {
          <div class="mt-4">
            <app-error-state
              title="Erreur de chargement"
              [message]="activitesError()!"
              actionText="Réessayer"
              (action)="loadActivitesStats()"
            />
          </div>
        } @else if (activitesStats(); as a) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <app-stat-card
              title="Total Activités"
              [value]="a.total"
              subtitle="Activités sur la sélection"
              icon="bi bi-calendar-event"
              theme="primary"
            />
            <app-stat-card
              title="Taux Moyen d'Exécution"
              [value]="a.taux_moyen_execution + '%'"
              subtitle="Progression globale"
              icon="bi bi-speedometer"
              theme="success"
            />
            <app-stat-card
              title="Terminées"
              [value]="a.repartition_statut['terminee'] || 0"
              subtitle="Sur {{ a.total }} activités"
              icon="bi bi-check-all"
              theme="primary"
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- Répartition par statut -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-pie-chart mr-2 text-primary"></i>
                Répartition par Statut
              </h3>
              <div class="stat-progress-list">
                @for (st of getObjectKeys(a.repartition_statut); track st) {
                  <div class="stat-progress-item">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="capitalize">{{ st }}</span>
                      <span class="font-bold">{{ a.repartition_statut[st] }}</span>
                    </div>
                    <div class="progress-bar-bg">
                      <div
                        class="progress-bar-fill fill-primary"
                        [style.width.%]="getProgressPercent(a.repartition_statut[st], a.total)"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </app-card>

            <!-- Répartition par type -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-tag mr-2 text-primary"></i>
                Répartition par Type d'Activité
              </h3>
              @if (getObjectKeys(a.repartition_type).length === 0) {
                <p class="text-sm text-muted">Aucun type spécifique répertorié.</p>
              } @else {
                <div class="table-responsive">
                  <table class="simple-data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th class="text-right">Nombre</th>
                        <th class="text-right">Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (t of getObjectKeys(a.repartition_type); track t) {
                        <tr>
                          <td>{{ t }}</td>
                          <td class="text-right font-bold">{{ a.repartition_type[t] }}</td>
                          <td class="text-right text-muted">
                            {{ getProgressPercent(a.repartition_type[t], a.total) }}%
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-card>
          </div>
        }
      }

      <!-- ==================================================== -->
      <!-- 4. ONGLET : STATISTIQUES PÈLERINAGES -->
      <!-- ==================================================== -->
      @if (activeTab() === 'pelerinages') {
        <div class="filter-zone mt-3">
          <div class="filter-header">
            <div class="filter-title">
              <i class="bi bi-funnel text-primary"></i>
              <span>Filtres de recherche</span>
            </div>
            @if (hasPelerinagesFilters()) {
              <button type="button" class="btn-reset-filters" (click)="resetPelerinagesFilters()" title="Effacer les filtres">
                <i class="bi bi-arrow-counterclockwise"></i>
                <span>Réinitialiser</span>
              </button>
            }
          </div>
          <div class="filter-controls-row">
            <div class="filter-control-item">
              <label class="filter-label">Statut d'inscription</label>
              <select
                [value]="filterPelerinagesStatut()"
                (change)="onFilterPelerinagesStatutChange($event)"
                class="filter-select"
                aria-label="Statut inscription"
              >
                <option value="">Tous les statuts</option>
                <option value="payee">Payée</option>
                <option value="partiellement_payee">Partiellement payée</option>
                <option value="en_attente">En attente</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            <div class="filter-control-item">
              <label class="filter-label">Type de pèlerin</label>
              <select
                [value]="filterPelerinagesTypeParticipant()"
                (change)="onFilterPelerinagesTypeParticipantChange($event)"
                class="filter-select"
                aria-label="Type participant"
              >
                <option value="">Tous les participants</option>
                <option value="CATECHUMENE">Catéchumènes CATHEO</option>
                <option value="EXTERNE">Participants Externes</option>
              </select>
            </div>

            <div class="filter-control-item">
              <label class="filter-label">Période de départ</label>
              <div class="date-range-box">
                <span class="date-prefix">Du</span>
                <input
                  type="date"
                  [value]="filterPelerinagesDateDebut()"
                  (change)="onFilterPelerinagesDateDebutChange($event)"
                  class="filter-input-date"
                  title="Date départ début"
                />
                <span class="date-sep">au</span>
                <input
                  type="date"
                  [value]="filterPelerinagesDateFin()"
                  (change)="onFilterPelerinagesDateFinChange($event)"
                  class="filter-input-date"
                  title="Date fin"
                />
              </div>
            </div>
          </div>
        </div>

        @if (isLoadingPelerinages()) {
          <div class="mt-4">
            <app-loading-state message="Chargement des statistiques des pèlerinages..." />
          </div>
        } @else if (pelerinagesError()) {
          <div class="mt-4">
            <app-error-state
              title="Erreur de chargement"
              [message]="pelerinagesError()!"
              actionText="Réessayer"
              (action)="loadPelerinagesStats()"
            />
          </div>
        } @else if (pelerinagesStats(); as p) {
          <!-- Cartes Pèlerinages -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <app-stat-card
              title="Campagnes"
              [value]="p.campagnes.total"
              subtitle="Capacité : {{ p.campagnes.capacite_totale }} places"
              icon="bi bi-geo-alt"
              theme="primary"
            />
            <app-stat-card
              title="Inscrits Totaux"
              [value]="p.inscriptions.total"
              subtitle="{{ p.inscriptions.catheo }} catéchumènes / {{ p.inscriptions.externes }} externes"
              icon="bi bi-person-badge"
              theme="primary"
            />
            <app-stat-card
              title="Taux de Présence"
              [value]="p.inscriptions.taux_presence + '%'"
              subtitle="{{ p.inscriptions.presents }} présents / {{ p.inscriptions.absents }} absents"
              icon="bi bi-person-check"
              theme="success"
            />
            <app-stat-card
              title="Taux Recouvrement"
              [value]="p.finances.taux_recouvrement + '%'"
              subtitle="Encaissé : {{ formatCfa(p.finances.montant_encaisse) }}"
              icon="bi bi-currency-exchange"
              theme="success"
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- État des inscriptions et présences -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-ui-checks mr-2 text-primary"></i>
                Statuts des Inscriptions
              </h3>
              <div class="stat-progress-list">
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Payées intégralement</span>
                    <span class="font-bold text-success">{{ p.inscriptions.payes }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-success"
                      [style.width.%]="getProgressPercent(p.inscriptions.payes, p.inscriptions.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Partiellement payées</span>
                    <span class="font-bold text-warning">{{ p.inscriptions.partiellement_payes }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-warning"
                      [style.width.%]="getProgressPercent(p.inscriptions.partiellement_payes, p.inscriptions.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>En attente de paiement</span>
                    <span class="font-bold text-muted">{{ p.inscriptions.en_attente }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-muted"
                      [style.width.%]="getProgressPercent(p.inscriptions.en_attente, p.inscriptions.total)"
                    ></div>
                  </div>
                </div>
                <div class="stat-progress-item">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Annulées</span>
                    <span class="font-bold text-danger">{{ p.inscriptions.annules }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill fill-danger"
                      [style.width.%]="getProgressPercent(p.inscriptions.annules, p.inscriptions.total)"
                    ></div>
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Bilan Financier Pèlerinages -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-wallet-fill mr-2 text-success"></i>
                Bilan Financier des Pèlerinages
              </h3>
              <div class="financial-summary-grid">
                <div class="financial-stat-box">
                  <span class="label">Montant Total Attendu</span>
                  <span class="val">{{ formatCfa(p.finances.montant_attendu) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Montant Encaissé</span>
                  <span class="val text-success">{{ formatCfa(p.finances.montant_encaisse) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Solde Restant</span>
                  <span class="val text-danger">{{ formatCfa(p.finances.solde_restant) }}</span>
                </div>
                <div class="financial-stat-box">
                  <span class="label">Taux Recouvrement</span>
                  <span class="val font-bold">{{ p.finances.taux_recouvrement }}%</span>
                </div>
              </div>
              <div class="mt-3">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill fill-success"
                    [style.width.%]="p.finances.taux_recouvrement"
                  ></div>
                </div>
              </div>
            </app-card>
          </div>
        }
      }

      <!-- ==================================================== -->
      <!-- 5. ONGLET : STATISTIQUES FINANCES -->
      <!-- ==================================================== -->
      @if (activeTab() === 'finances') {
        <div class="filter-zone mt-3">
          <div class="filter-header">
            <div class="filter-title">
              <i class="bi bi-funnel text-primary"></i>
              <span>Filtres de période</span>
            </div>
            @if (hasFinancesFilters()) {
              <button type="button" class="btn-reset-filters" (click)="resetFinancesFilters()" title="Effacer les filtres">
                <i class="bi bi-arrow-counterclockwise"></i>
                <span>Réinitialiser</span>
              </button>
            }
          </div>
          <div class="filter-controls-row">
            <div class="filter-control-item">
              <label class="filter-label">Période des opérations</label>
              <div class="date-range-box">
                <span class="date-prefix">Du</span>
                <input
                  type="date"
                  [value]="filterFinancesDateDebut()"
                  (change)="onFilterFinancesDateDebutChange($event)"
                  class="filter-input-date"
                  title="Date opération début"
                />
                <span class="date-sep">au</span>
                <input
                  type="date"
                  [value]="filterFinancesDateFin()"
                  (change)="onFilterFinancesDateFinChange($event)"
                  class="filter-input-date"
                  title="Date opération fin"
                />
              </div>
            </div>
          </div>
        </div>

        @if (isLoadingFinances()) {
          <div class="mt-4">
            <app-loading-state message="Chargement des statistiques financières..." />
          </div>
        } @else if (financesError()) {
          <div class="mt-4">
            <app-error-state
              title="Erreur de chargement"
              [message]="financesError()!"
              actionText="Réessayer"
              (action)="loadFinancesStats()"
            />
          </div>
        } @else if (financesStats(); as f) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <app-stat-card
              title="Total Recettes (Entrées)"
              [value]="formatCfa(f.total_entrees)"
              subtitle="Pèlerinages : {{ formatCfa(f.recettes_pelerinages) }}"
              icon="bi bi-arrow-down-left-circle"
              theme="success"
            />
            <app-stat-card
              title="Total Dépenses (Sorties)"
              [value]="formatCfa(f.total_sorties)"
              subtitle="Décaissements validés"
              icon="bi bi-arrow-up-right-circle"
              theme="danger"
            />
            <app-stat-card
              title="Solde Net"
              [value]="formatCfa(f.solde)"
              subtitle="Résultat de la période"
              icon="bi bi-cash"
              [theme]="f.solde >= 0 ? 'success' : 'danger'"
            />
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <!-- Modes de règlement -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-credit-card mr-2 text-primary"></i>
                Répartition par Mode de Règlement
              </h3>
              @if (f.repartition_modes.length === 0) {
                <p class="text-sm text-muted">Aucun règlement enregistré sur cette période.</p>
              } @else {
                <div class="table-responsive">
                  <table class="simple-data-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th class="text-right">Opérations</th>
                        <th class="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of f.repartition_modes; track m.mode) {
                        <tr>
                          <td class="font-bold">{{ m.mode }}</td>
                          <td class="text-right">{{ m.count }}</td>
                          <td class="text-right text-success font-bold">{{ formatCfa(m.total) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-card>

            <!-- Évolution Mensuelle -->
            <app-card>
              <h3 class="section-title mb-3">
                <i class="bi bi-graph-up mr-2 text-primary"></i>
                Flux Mensuels (Entrées vs Sorties)
              </h3>
              @if (f.evolution_mensuelle.length === 0) {
                <p class="text-sm text-muted">Aucun flux mensuel sur cette période.</p>
              } @else {
                <div class="table-responsive">
                  <table class="simple-data-table">
                    <thead>
                      <tr>
                        <th>Période</th>
                        <th class="text-right text-success">Entrées</th>
                        <th class="text-right text-danger">Sorties</th>
                        <th class="text-right">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (em of f.evolution_mensuelle; track em.periode) {
                        <tr>
                          <td>{{ em.periode }}</td>
                          <td class="text-right text-success">+{{ formatCfa(em.entrees) }}</td>
                          <td class="text-right text-danger">-{{ formatCfa(em.sorties) }}</td>
                          <td class="text-right font-bold" [class.text-success]="em.solde >= 0" [class.text-danger]="em.solde < 0">
                            {{ formatCfa(em.solde) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </app-card>
          </div>
        }
      }

      <!-- ==================================================== -->
      <!-- 6. ONGLET : POPULATION CATHEO (RAPPORT DE CAMPAGNE)   -->
      <!-- ==================================================== -->
      @if (activeTab() === 'catheo') {
        @if (isLoadingDashboard() || (isLoadingPelerinages() && !pelerinagesStats())) {
          <div class="mt-4">
            <app-loading-state message="Chargement des données de campagne et de la population pastorale..." />
          </div>
        } @else if (dashboardData(); as d) {
          @if (!d.catheo.catheo_connecte) {
            <div class="mt-4">
              <app-empty-state
                title="Organisation autonome"
                description="Cette organisation n'est pas connectée directement à la base paroissiale CATHEO ou la paroisse n'a pas configuré d'année catéchétique active."
                icon="shield-lock"
              />
            </div>
          } @else {
            <!-- Barre de filtre par Campagne -->
            <div class="filter-zone mt-3">
              <div class="filter-header">
                <div class="filter-title">
                  <i class="bi bi-funnel text-primary"></i>
                  <span>Filtre par Campagne de Pèlerinage</span>
                </div>
                @if (filterCatheoCampagneId()) {
                  <button type="button" class="btn-reset-filters" (click)="resetCatheoCampagneFilter()" title="Afficher toutes les campagnes">
                    <i class="bi bi-arrow-counterclockwise"></i>
                    <span>Toutes les campagnes</span>
                  </button>
                }
              </div>
              <div class="filter-controls-row">
                <div class="filter-control-item filter-control-expand">
                  <label class="filter-label">Sélectionner une campagne spécifique</label>
                  <select
                    [value]="filterCatheoCampagneId()"
                    (change)="onFilterCatheoCampagneChange($event)"
                    class="filter-select"
                    aria-label="Campagne"
                  >
                    <option value="">Toutes les campagnes confondues</option>
                    @for (camp of d.pelerinages_recents || []; track camp.id) {
                      <option [value]="camp.id">{{ camp.nom }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- 4 INDICATEURS CLÉS DEMANDÉS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <!-- 1. Total Inscrits Campagne -->
              <app-stat-card
                title="Total Inscrits (Campagne)"
                [value]="pelerinagesStats()?.inscriptions?.total ?? d.pelerinages?.total_inscrits ?? 0"
                subtitle="Tous pèlerins enregistrés"
                icon="bi bi-person-badge-fill"
                theme="primary"
              />

              <!-- 2. Total Catéchumènes -->
              <app-stat-card
                title="Total Catéchumènes"
                [value]="d.catheo.total_population || 0"
                subtitle="Effectif pastoral ({{ d.catheo.annee_catechese || 'En cours' }})"
                icon="bi bi-people-fill"
                theme="primary"
              />

              <!-- 3. Catéchumènes Inscrits -->
              <app-stat-card
                title="Catéchumènes Inscrits"
                [value]="pelerinagesStats()?.inscriptions?.catheo || 0"
                subtitle="Part : {{ getMembresRatio(pelerinagesStats()?.inscriptions?.catheo || 0, pelerinagesStats()?.inscriptions?.total || 1) }}% des inscrits"
                icon="bi bi-person-check-fill"
                theme="success"
              />

              <!-- 4. Total Inscrits Externes -->
              <app-stat-card
                title="Inscrits Externes"
                [value]="pelerinagesStats()?.inscriptions?.externes || 0"
                subtitle="Part : {{ getMembresRatio(pelerinagesStats()?.inscriptions?.externes || 0, pelerinagesStats()?.inscriptions?.total || 1) }}% des inscrits"
                icon="bi bi-person-plus-fill"
                theme="warning"
              />
            </div>

            <!-- ANALYSE COMPARATIVE : CATÉCHUMÈNES VS EXTERNES -->
            <div class="mt-4">
              <app-card>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="section-title">
                    <i class="bi bi-pie-chart-fill mr-2 text-primary"></i>
                    Composition des Inscriptions à la Campagne
                  </h3>
                  <span class="text-xs text-muted">
                    Année pastorale : <strong>{{ d.catheo.annee_catechese || 'En cours' }}</strong>
                  </span>
                </div>

                <div class="gender-bar-container">
                  <div class="flex justify-between text-sm mb-2">
                    <span class="font-bold text-success">
                      <i class="bi bi-person-check mr-1"></i> Catéchumènes : {{ pelerinagesStats()?.inscriptions?.catheo || 0 }} 
                      ({{ getMembresRatio(pelerinagesStats()?.inscriptions?.catheo || 0, pelerinagesStats()?.inscriptions?.total || 1) }}%)
                    </span>
                    <span class="font-bold text-warning">
                      <i class="bi bi-person-plus mr-1"></i> Externes : {{ pelerinagesStats()?.inscriptions?.externes || 0 }} 
                      ({{ getMembresRatio(pelerinagesStats()?.inscriptions?.externes || 0, pelerinagesStats()?.inscriptions?.total || 1) }}%)
                    </span>
                  </div>
                  <div class="dual-progress-bar">
                    <div
                      class="bar-male"
                      style="background: var(--color-success, #10b981);"
                      [style.width.%]="getMembresRatio(pelerinagesStats()?.inscriptions?.catheo || 0, pelerinagesStats()?.inscriptions?.total || 1)"
                    ></div>
                    <div
                      class="bar-female"
                      style="background: var(--color-warning, #f59e0b);"
                      [style.width.%]="getMembresRatio(pelerinagesStats()?.inscriptions?.externes || 0, pelerinagesStats()?.inscriptions?.total || 1)"
                    ></div>
                  </div>
                </div>

                <!-- Taux de participation des catéchumènes -->
                <div class="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted gap-2">
                  <div>
                    <i class="bi bi-info-circle mr-1 text-primary"></i>
                    Taux de mobilisation des catéchumènes : 
                    <strong class="text-foreground">
                      {{ getMembresRatio(pelerinagesStats()?.inscriptions?.catheo || 0, d.catheo.total_population || 1) }}%
                    </strong> 
                    ({{ pelerinagesStats()?.inscriptions?.catheo || 0 }} inscrits sur un total de {{ d.catheo.total_population || 0 }} catéchumènes)
                  </div>
                  <div>
                    Sections pastorales : <strong>{{ d.catheo.sections?.join(', ') || 'Toutes sections' }}</strong>
                  </div>
                </div>
              </app-card>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .statistiques-page-container {
      padding: 1.25rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
      width: 100%;
      box-sizing: border-box;
    }
    @media (max-width: 768px) {
      .statistiques-page-container {
        padding: 0.875rem;
        gap: 0.875rem;
      }
    }

    /* Onglets de navigation compacts */
    .tabs-nav {
      display: flex;
      gap: 0.375rem;
      border-bottom: 1.5px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.125rem;
      overflow-x: auto;
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
    }
    .tab-btn {
      padding: 0.45rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      white-space: nowrap;
      transition: all var(--transition-fast, 0.15s ease);
    }
    .tab-btn i {
      font-size: 0.875rem;
    }
    .tab-btn:hover {
      color: var(--color-primary, #6366f1);
    }
    .tab-btn.active {
      color: var(--color-primary, #6366f1);
      font-weight: 600;
      border-bottom-color: var(--color-primary, #6366f1);
    }

    /* Barre de filtres soignée et aérée */
    .filter-zone {
      background: var(--bg-surface, #ffffff);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-lg, 12px);
      border: 1px solid var(--border-color, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .filter-title {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .btn-reset-filters {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      background: var(--bg-surface-elevated, #f1f5f9);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-reset-filters:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fca5a5;
    }
    .filter-controls-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0.625rem;
    }
    .filter-control-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .filter-control-expand {
      flex: 1;
      min-width: 160px;
    }
    .filter-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
    }
    .filter-select {
      height: 32px;
      padding: 0 0.625rem;
      font-size: 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-color, #1e293b);
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .filter-select:focus {
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
    }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 0.625rem;
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
    }
    .filter-input-text {
      height: 32px;
      padding: 0 0.625rem 0 1.75rem;
      font-size: 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-color, #1e293b);
      width: 100%;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .filter-input-text:focus {
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
    }
    .date-range-box {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      padding: 0 0.5rem;
      height: 32px;
      box-sizing: border-box;
    }
    .date-range-box:focus-within {
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
    }
    .date-prefix, .date-sep {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      user-select: none;
    }
    .filter-input-date {
      border: none;
      background: transparent;
      padding: 0;
      font-size: 0.75rem;
      color: var(--text-color, #1e293b);
      font-family: inherit;
      outline: none;
      cursor: pointer;
    }

    /* Allègement global des stat-cards & réduction de police */
    :host ::ng-deep app-stat-card .stat-card {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    :host ::ng-deep app-stat-card .stat-title {
      font-size: 0.6875rem;
      letter-spacing: 0.03em;
      font-weight: 600;
    }
    :host ::ng-deep app-stat-card .stat-value {
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1.2;
    }
    :host ::ng-deep app-stat-card .stat-subtitle {
      font-size: 0.6875rem;
    }
    :host ::ng-deep app-stat-card .stat-icon-wrap {
      width: 36px;
      height: 36px;
      font-size: 1rem;
      border-radius: 8px;
    }
    :host ::ng-deep app-stat-card .stat-content {
      gap: 0.2rem;
    }

    /* Allègement des cartes de détails */
    :host ::ng-deep app-card .card-body {
      padding: 0.875rem 1rem;
    }
    .section-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
      margin: 0;
      display: flex;
      align-items: center;
    }
    .section-title i {
      font-size: 0.9375rem;
    }

    /* Progress bar fine et allégée */
    .stat-progress-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--bg-surface-elevated, #f1f5f9);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    .fill-primary {
      background: var(--color-primary, #6366f1);
    }
    .fill-success {
      background: var(--color-success, #10b981);
    }
    .fill-warning {
      background: var(--color-warning, #f59e0b);
    }
    .fill-danger {
      background: var(--color-danger, #ef4444);
    }
    .fill-info {
      background: #0284c7;
    }
    .fill-muted {
      background: var(--text-muted, #94a3b8);
    }

    /* Boîtes financières compactes */
    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
    }
    .financial-stat-box {
      padding: 0.5rem 0.625rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 6px);
      display: flex;
      flex-direction: column;
    }
    .financial-stat-box .label {
      font-size: 0.6875rem;
      color: var(--text-muted, #64748b);
      margin-bottom: 0.15rem;
    }
    .financial-stat-box .val {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
    }

    /* Barres doubles sexe */
    .gender-bar-container {
      padding: 0.25rem 0;
    }
    .dual-progress-bar {
      width: 100%;
      height: 8px;
      display: flex;
      border-radius: 9999px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .bar-male {
      background: #3b82f6;
      height: 100%;
      transition: width 0.3s ease;
    }
    .bar-female {
      background: #ec4899;
      height: 100%;
      transition: width 0.3s ease;
    }

    /* Mini graphiques en barre */
    .bar-chart-grid {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      height: 120px;
      padding-top: 0.5rem;
      overflow-x: auto;
    }
    .bar-chart-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      min-width: 44px;
      height: 100%;
    }
    .bar-col {
      flex: 1;
      width: 18px;
      background: var(--bg-surface-elevated, #f1f5f9);
      border-radius: 3px;
      display: flex;
      align-items: flex-end;
    }
    .bar-fill {
      width: 100%;
      border-radius: 3px;
      transition: height 0.3s ease;
    }
    .bar-val {
      font-size: 0.6875rem;
    }
    .bar-label {
      font-size: 0.625rem;
      color: var(--text-muted, #64748b);
    }

    /* Tableaux plus épurés et alignement strict th/td */
    .simple-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
      table-layout: auto;
    }
    .simple-data-table th,
    .simple-data-table td {
      padding: 0.45rem 0.65rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      vertical-align: middle;
    }
    .simple-data-table th {
      color: var(--text-muted, #64748b);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      text-align: left;
      background: var(--bg-surface-elevated, #f8fafc);
    }
    .simple-data-table td {
      text-align: left;
    }
    .simple-data-table th.text-right,
    .simple-data-table td.text-right {
      text-align: right !important;
    }
    .simple-data-table th.text-center,
    .simple-data-table td.text-center {
      text-align: center !important;
    }
    .simple-data-table tr:last-child td {
      border-bottom: none;
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
      .sm\\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .lg\\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    .gap-3 {
      gap: 0.75rem;
    }
    .gap-4 {
      gap: 1rem;
    }
    .mt-3 {
      margin-top: 0.75rem;
    }
    .mt-4 {
      margin-top: 1rem;
    }
    .mb-1 {
      margin-bottom: 0.25rem;
    }
    .mb-2 {
      margin-bottom: 0.5rem;
    }
    .mb-3 {
      margin-bottom: 0.75rem;
    }
    .mr-1 {
      margin-right: 0.25rem;
    }
    .mr-1\\.5 {
      margin-right: 0.375rem;
    }
    .mr-2 {
      margin-right: 0.5rem;
    }
    .text-sm {
      font-size: 0.75rem;
    }
    .text-muted {
      color: var(--text-muted, #64748b);
    }
    .font-bold {
      font-weight: 700;
    }
    .text-right {
      text-align: right;
    }
    .text-success {
      color: var(--color-success, #10b981);
    }
    .text-danger {
      color: var(--color-danger, #ef4444);
    }
    .text-warning {
      color: var(--color-warning, #f59e0b);
    }
    .text-primary {
      color: var(--color-primary, #6366f1);
    }
    .bg-primary {
      background: var(--color-primary, #6366f1);
    }
    .text-blue-600 {
      color: #2563eb;
    }
    .text-pink-600 {
      color: #db2777;
    }
    .capitalize {
      text-transform: capitalize;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatistiquesPageComponent implements OnInit {
  private readonly statService = inject(StatistiqueService);
  private readonly orgContext = inject(OrganisationContextService);
  private readonly printService = inject(PrintService);

  public readonly formatCfa = formatCfa;

  public readonly typeOrganisation = computed(() => {
    return this.orgContext.typeOrganisation() || 'Organisation';
  });

  // Onglet courant
  public readonly activeTab = signal<StatTab>('synthese');

  // États Dashboard / Synthèse
  public readonly isLoadingDashboard = signal<boolean>(false);
  public readonly dashboardData = signal<any | null>(null);
  public readonly dashboardError = signal<string | null>(null);

  // États Membres
  public readonly isLoadingMembres = signal<boolean>(false);
  public readonly membresStats = signal<StatistiquesMembres | null>(null);
  public readonly membresError = signal<string | null>(null);
  public readonly filterMembresStatut = signal<string>('');
  public readonly filterMembresSexe = signal<string>('');
  public readonly filterMembresFonction = signal<string>('');
  public readonly filterMembresDateDebut = signal<string>('');
  public readonly filterMembresDateFin = signal<string>('');

  // États Activités
  public readonly isLoadingActivites = signal<boolean>(false);
  public readonly activitesStats = signal<StatistiquesActivites | null>(null);
  public readonly activitesError = signal<string | null>(null);
  public readonly filterActivitesStatut = signal<string>('');
  public readonly filterActivitesType = signal<string>('');
  public readonly filterActivitesDateDebut = signal<string>('');
  public readonly filterActivitesDateFin = signal<string>('');

  // États Pèlerinages
  public readonly isLoadingPelerinages = signal<boolean>(false);
  public readonly pelerinagesStats = signal<StatistiquesPelerinages | null>(null);
  public readonly pelerinagesError = signal<string | null>(null);
  public readonly filterPelerinagesStatut = signal<string>('');
  public readonly filterPelerinagesTypeParticipant = signal<string>('');
  public readonly filterPelerinagesDateDebut = signal<string>('');
  public readonly filterPelerinagesDateFin = signal<string>('');
  public readonly filterCatheoCampagneId = signal<string>('');

  // États Finances
  public readonly isLoadingFinances = signal<boolean>(false);
  public readonly financesStats = signal<StatistiquesFinances | null>(null);
  public readonly financesError = signal<string | null>(null);
  public readonly filterFinancesDateDebut = signal<string>('');
  public readonly filterFinancesDateFin = signal<string>('');

  public readonly isLoadingAny = computed(() => {
    return (
      this.isLoadingDashboard() ||
      this.isLoadingMembres() ||
      this.isLoadingActivites() ||
      this.isLoadingPelerinages() ||
      this.isLoadingFinances()
    );
  });

  public ngOnInit(): void {
    this.loadDashboard();
  }

  public setActiveTab(tab: StatTab): void {
    this.activeTab.set(tab);
    switch (tab) {
      case 'synthese':
        if (!this.dashboardData()) {
          this.loadDashboard();
        }
        break;
      case 'catheo':
        if (!this.dashboardData()) {
          this.loadDashboard();
        }
        if (!this.pelerinagesStats()) {
          this.loadPelerinagesStats();
        }
        break;
      case 'membres':
        if (!this.membresStats()) {
          this.loadMembresStats();
        }
        break;
      case 'activites':
        if (!this.activitesStats()) {
          this.loadActivitesStats();
        }
        break;
      case 'pelerinages':
        if (!this.pelerinagesStats()) {
          this.loadPelerinagesStats();
        }
        break;
      case 'finances':
        if (!this.financesStats()) {
          this.loadFinancesStats();
        }
        break;
    }
  }

  public refreshCurrentTab(): void {
    switch (this.activeTab()) {
      case 'synthese':
        this.loadDashboard(true);
        break;
      case 'catheo':
        this.loadDashboard(true);
        this.loadPelerinagesStats();
        break;
      case 'membres':
        this.loadMembresStats();
        break;
      case 'activites':
        this.loadActivitesStats();
        break;
      case 'pelerinages':
        this.loadPelerinagesStats();
        break;
      case 'finances':
        this.loadFinancesStats();
        break;
    }
  }

  // Dashboard Loader
  public loadDashboard(fresh = false): void {
    this.isLoadingDashboard.set(true);
    this.dashboardError.set(null);

    this.statService.getDashboard(fresh).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoadingDashboard.set(false);
      },
      error: (err) => {
        this.isLoadingDashboard.set(false);
        this.dashboardError.set(
          err?.error?.message || 'Impossible de charger la synthèse consolidée.'
        );
      },
    });
  }

  // Membres Loader
  public loadMembresStats(): void {
    this.isLoadingMembres.set(true);
    this.membresError.set(null);

    const filters: MembresStatFilters = {
      statut: this.filterMembresStatut() || undefined,
      sexe: this.filterMembresSexe() || undefined,
      fonction: this.filterMembresFonction() || undefined,
      date_debut: this.filterMembresDateDebut() || undefined,
      date_fin: this.filterMembresDateFin() || undefined,
    };

    this.statService.getStatistiquesMembres(filters).subscribe({
      next: (data) => {
        this.membresStats.set(data);
        this.isLoadingMembres.set(false);
      },
      error: (err) => {
        this.isLoadingMembres.set(false);
        this.membresError.set(
          err?.error?.message || 'Impossible de récupérer les statistiques des membres.'
        );
      },
    });
  }

  // Activités Loader
  public loadActivitesStats(): void {
    this.isLoadingActivites.set(true);
    this.activitesError.set(null);

    const filters: ActivitesStatFilters = {
      statut: this.filterActivitesStatut() || undefined,
      type_activite: this.filterActivitesType() || undefined,
      date_debut: this.filterActivitesDateDebut() || undefined,
      date_fin: this.filterActivitesDateFin() || undefined,
    };

    this.statService.getStatistiquesActivites(filters).subscribe({
      next: (data) => {
        this.activitesStats.set(data);
        this.isLoadingActivites.set(false);
      },
      error: (err) => {
        this.isLoadingActivites.set(false);
        this.activitesError.set(
          err?.error?.message || 'Impossible de récupérer les statistiques des activités.'
        );
      },
    });
  }

  // Pèlerinages Loader
  public loadPelerinagesStats(): void {
    this.isLoadingPelerinages.set(true);
    this.pelerinagesError.set(null);

    const filters: PelerinagesStatFilters = {
      campagne_id: this.filterCatheoCampagneId() ? Number(this.filterCatheoCampagneId()) : undefined,
      statut_inscription: this.filterPelerinagesStatut() || undefined,
      type_participant: this.filterPelerinagesTypeParticipant() || undefined,
      date_debut: this.filterPelerinagesDateDebut() || undefined,
      date_fin: this.filterPelerinagesDateFin() || undefined,
    };

    this.statService.getStatistiquesPelerinages(filters).subscribe({
      next: (data) => {
        this.pelerinagesStats.set(data);
        this.isLoadingPelerinages.set(false);
      },
      error: (err) => {
        this.isLoadingPelerinages.set(false);
        this.pelerinagesError.set(
          err?.error?.message || 'Impossible de récupérer les statistiques des pèlerinages.'
        );
      },
    });
  }

  // Finances Loader
  public loadFinancesStats(): void {
    this.isLoadingFinances.set(true);
    this.financesError.set(null);

    const filters: FinancesStatFilters = {
      date_debut: this.filterFinancesDateDebut() || undefined,
      date_fin: this.filterFinancesDateFin() || undefined,
    };

    this.statService.getStatistiquesFinances(filters).subscribe({
      next: (data) => {
        this.financesStats.set(data);
        this.isLoadingFinances.set(false);
      },
      error: (err) => {
        this.isLoadingFinances.set(false);
        this.financesError.set(
          err?.error?.message || 'Impossible de récupérer les statistiques financières.'
        );
      },
    });
  }

  // Filtres Membres Handlers
  public onFilterMembresStatutChange(e: Event): void {
    this.filterMembresStatut.set((e.target as HTMLSelectElement).value);
    this.loadMembresStats();
  }
  public onFilterMembresSexeChange(e: Event): void {
    this.filterMembresSexe.set((e.target as HTMLSelectElement).value);
    this.loadMembresStats();
  }
  public onFilterMembresFonctionChange(e: Event): void {
    this.filterMembresFonction.set((e.target as HTMLInputElement).value);
    this.loadMembresStats();
  }
  public onFilterMembresDateDebutChange(e: Event): void {
    this.filterMembresDateDebut.set((e.target as HTMLInputElement).value);
    this.loadMembresStats();
  }
  public onFilterMembresDateFinChange(e: Event): void {
    this.filterMembresDateFin.set((e.target as HTMLInputElement).value);
    this.loadMembresStats();
  }
  public hasMembresFilters(): boolean {
    return (
      !!this.filterMembresStatut() ||
      !!this.filterMembresSexe() ||
      !!this.filterMembresFonction() ||
      !!this.filterMembresDateDebut() ||
      !!this.filterMembresDateFin()
    );
  }
  public resetMembresFilters(): void {
    this.filterMembresStatut.set('');
    this.filterMembresSexe.set('');
    this.filterMembresFonction.set('');
    this.filterMembresDateDebut.set('');
    this.filterMembresDateFin.set('');
    this.loadMembresStats();
  }

  // Filtres Activités Handlers
  public onFilterActivitesStatutChange(e: Event): void {
    this.filterActivitesStatut.set((e.target as HTMLSelectElement).value);
    this.loadActivitesStats();
  }
  public onFilterActivitesTypeChange(e: Event): void {
    this.filterActivitesType.set((e.target as HTMLInputElement).value);
    this.loadActivitesStats();
  }
  public onFilterActivitesDateDebutChange(e: Event): void {
    this.filterActivitesDateDebut.set((e.target as HTMLInputElement).value);
    this.loadActivitesStats();
  }
  public onFilterActivitesDateFinChange(e: Event): void {
    this.filterActivitesDateFin.set((e.target as HTMLInputElement).value);
    this.loadActivitesStats();
  }
  public hasActivitesFilters(): boolean {
    return (
      !!this.filterActivitesStatut() ||
      !!this.filterActivitesType() ||
      !!this.filterActivitesDateDebut() ||
      !!this.filterActivitesDateFin()
    );
  }
  public resetActivitesFilters(): void {
    this.filterActivitesStatut.set('');
    this.filterActivitesType.set('');
    this.filterActivitesDateDebut.set('');
    this.filterActivitesDateFin.set('');
    this.loadActivitesStats();
  }

  // Filtres Pèlerinages Handlers
  public onFilterPelerinagesStatutChange(e: Event): void {
    this.filterPelerinagesStatut.set((e.target as HTMLSelectElement).value);
    this.loadPelerinagesStats();
  }
  public onFilterPelerinagesTypeParticipantChange(e: Event): void {
    this.filterPelerinagesTypeParticipant.set((e.target as HTMLSelectElement).value);
    this.loadPelerinagesStats();
  }
  public onFilterPelerinagesDateDebutChange(e: Event): void {
    this.filterPelerinagesDateDebut.set((e.target as HTMLInputElement).value);
    this.loadPelerinagesStats();
  }
  public onFilterPelerinagesDateFinChange(e: Event): void {
    this.filterPelerinagesDateFin.set((e.target as HTMLInputElement).value);
    this.loadPelerinagesStats();
  }
  public hasPelerinagesFilters(): boolean {
    return (
      !!this.filterPelerinagesStatut() ||
      !!this.filterPelerinagesTypeParticipant() ||
      !!this.filterPelerinagesDateDebut() ||
      !!this.filterPelerinagesDateFin()
    );
  }
  public resetPelerinagesFilters(): void {
    this.filterPelerinagesStatut.set('');
    this.filterPelerinagesTypeParticipant.set('');
    this.filterPelerinagesDateDebut.set('');
    this.filterPelerinagesDateFin.set('');
    this.loadPelerinagesStats();
  }

  // Handler filtre Campagne dédié Population CATHEO
  public onFilterCatheoCampagneChange(e: Event): void {
    this.filterCatheoCampagneId.set((e.target as HTMLSelectElement).value);
    this.loadPelerinagesStats();
  }
  public resetCatheoCampagneFilter(): void {
    this.filterCatheoCampagneId.set('');
    this.loadPelerinagesStats();
  }

  // Filtres Finances Handlers
  public onFilterFinancesDateDebutChange(e: Event): void {
    this.filterFinancesDateDebut.set((e.target as HTMLInputElement).value);
    this.loadFinancesStats();
  }
  public onFilterFinancesDateFinChange(e: Event): void {
    this.filterFinancesDateFin.set((e.target as HTMLInputElement).value);
    this.loadFinancesStats();
  }
  public hasFinancesFilters(): boolean {
    return !!this.filterFinancesDateDebut() || !!this.filterFinancesDateFin();
  }
  public resetFinancesFilters(): void {
    this.filterFinancesDateDebut.set('');
    this.filterFinancesDateFin.set('');
    this.loadFinancesStats();
  }

  // Helper calculations
  public getMembresRatio(part: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 100);
  }

  public getProgressPercent(val: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((val / total) * 100));
  }

  public getObjectKeys(obj: Record<string, any> | null | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  public getMaxVal(record: Record<string, number>): number {
    const vals = Object.values(record);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }

  public getChartBarHeight(val: number, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.round((val / max) * 100);
  }

  public printStatistiques(): void {
    const tabName = this.activeTab().toUpperCase();
    const org = this.orgContext.context()?.nom || 'Organisation';
    this.printService.printDocument(`Statistiques ${tabName} - ${org}`);
  }
}
