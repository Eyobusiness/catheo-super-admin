import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { OrganisationDashboardService } from '../services/dashboard.service';
import { OrganisationDashboardData } from '../models/dashboard.model';
import { CATHEO_SECTIONS } from '../../../../core/constants/organisation.constants';

@Component({
  selector: 'app-organisation-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    PageHeaderComponent,
    CardComponent,
    StatCardComponent,
    ButtonComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="oppe-dashboard-container">
      <!-- En-tête -->
      <app-page-header
        [title]="dashboardTitle()"
        [subtitle]="dashboardSubtitle()"
        [badge]="badgeText()"
      >
        <div page-actions class="dashboard-actions">
          @if (activeYear()) {
            <span class="annee-catechese-tag">
              <i class="bi bi-calendar-check mr-1" aria-hidden="true"></i>
              Année : <strong>{{ activeYear() }}</strong>
            </span>
          }
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="refreshDashboard()"
          >
            Actualiser
          </app-btn>
        </div>
      </app-page-header>

      <!-- État de chargement initial -->
      @if (isLoading() && !dashboardData()) {
        <div class="mt-6">
          <app-loading-state message="Chargement des indicateurs du tableau de bord..." />
        </div>
      }

      <!-- État d'erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadDashboard(true)"
          />
        </div>
      }

      <!-- Contenu Dashboard lorsque les données sont chargées -->
      @if (dashboardData(); as data) {
        <div class="dashboard-content mt-6">
          <!-- 1. CARTE POPULATION CATHEO (OPPE ou OPPJ) -->
          <div class="catheo-highlight-section mb-6">
            <app-card variant="elevated">
              <div class="catheo-header-row">
                <div class="catheo-title-wrap">
                  <!-- <div class="catheo-icon-box" [class.catheo-icon-box-oppj]="isOppj()" aria-hidden="true">
                    <i [class]="isOppj() ? 'bi bi-person-walking' : 'bi bi-mortarboard-fill'"></i>
                  </div> -->
                  <div>
                    <!-- <div class="catheo-badges-row">
                      <h2 class="section-title">{{ populationCardTitle() }}</h2>
                      @if (data.catheo.catheo_connecte) {
                        <app-badge variant="success" size="sm">
                          <i class="bi bi-check-circle-fill mr-1"></i> Passerelle Active
                        </app-badge>
                      } @else {
                        <app-badge variant="warning" size="sm">
                          <i class="bi bi-exclamation-triangle-fill mr-1"></i> Déconnecté
                        </app-badge>
                      }
                      @if (isOppj()) {
                        <span class="sections-legend">
                          Code : <code>{{ sectionJeunesCode }}</code>
                        </span>
                      } @else {
                        <span class="sections-legend">
                          Codes : <code>{{ sectionPrimaireCode }}</code> & <code>{{ sectionCollegeCode }}</code>
                        </span>
                      }
                    </div> -->
                    <!-- <p class="section-subtitle">
                      {{ populationSubtitle() }}
                    </p> -->
                  </div>
                </div>
              </div>

              <!-- Cartes des Effectifs selon le contexte (OPPJ ou OPPE) -->
              @if (isOppj()) {
                <!-- Effectifs OPPJ (SEC-JEUNES) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="effectif-card effectif-total effectif-oppj">
                    <span class="effectif-label">Total Jeunes OPPJ</span>
                    <div class="effectif-value-row">
                      <span class="effectif-number">{{ totalJeunes() }}</span>
                      <i class="bi bi-person-arms-up effectif-bg-icon" aria-hidden="true"></i>
                    </div>
                    <span class="effectif-subtext">Effectif global jeunes catéchèse</span>
                  </div>

                  <div class="effectif-card effectif-jeunes">
                    <span class="effectif-label">Section Jeunes</span>
                    <div class="effectif-value-row">
                      <span class="effectif-number">{{ totalJeunes() }}</span>
                      <span class="code-pill">{{ sectionJeunesCode }}</span>
                    </div>
                    <span class="effectif-subtext">Section jeunes paroissiale ({{ activeYear() || 'En cours' }})</span>
                  </div>
                </div>
              } @else {
                <!-- Effectifs OPPE (SEC-ENFANTS-PRI & SEC-ENFANTS-COL) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div class="effectif-card effectif-total">
                    <span class="effectif-label">Total Enfants OPPE</span>
                    <div class="effectif-value-row">
                      <span class="effectif-number">{{ data.catheo.total_population || 0 }}</span>
                      <i class="bi bi-people-fill effectif-bg-icon" aria-hidden="true"></i>
                    </div>
                    <span class="effectif-subtext">Effectif global primaire + collège</span>
                  </div>

                  <div class="effectif-card effectif-primaire">
                    <span class="effectif-label">Enfants Primaire</span>
                    <div class="effectif-value-row">
                      <span class="effectif-number">{{ data.catheo.total_primaire || 0 }}</span>
                      <!-- <span class="code-pill">{{ sectionPrimaireCode }}</span> -->
                    </div>
                    <span class="effectif-subtext">Section primaire paroissiale</span>
                  </div>

                  <div class="effectif-card effectif-college">
                    <span class="effectif-label">Enfants Collège</span>
                    <div class="effectif-value-row">
                      <span class="effectif-number">{{ data.catheo.total_college || 0 }}</span>
                      <!-- <span class="code-pill">{{ sectionCollegeCode }}</span> -->
                    </div>
                    <span class="effectif-subtext">Section collège paroissiale</span>
                  </div>
                </div>
              }

              <!-- Message si aucune année active ou passerelle déconnectée -->
              @if (!data.catheo.catheo_connecte && data.catheo.message) {
                <div class="alert-info-catheo mt-4" role="status">
                  <i class="bi bi-info-circle mr-2"></i>
                  <span>{{ data.catheo.message }}</span>
                </div>
              }

              <!-- Répartition par niveaux si disponible -->
              @if (data.catheo.repartition_niveaux && data.catheo.repartition_niveaux.length > 0) {
                <div class="repartition-block mt-4">
                  <span class="repartition-title">Répartition par Niveaux de Catéchèse :</span>
                  <div class="repartition-tags">
                    @for (item of data.catheo.repartition_niveaux; track item.niveau_id || item.niveau) {
                      <span class="niveau-tag">
                        <strong>{{ item.niveau || 'Niveau' }}</strong> : {{ item.total }}
                      </span>
                    }
                  </div>
                </div>
              }
            </app-card>
          </div>

          <!-- 2. INDICATEURS PRINCIPAUX (StatCards Métier) -->
          <div class="section-heading mb-3">
            <h3 class="section-group-title">
              <i class="bi bi-grid-1x2-fill mr-2" aria-hidden="true"></i>
              Activité Pastorale & Gestion de l'Organisation
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Membres -->
            <app-stat-card
              title="Membres de l'Équipe"
              [value]="data.membres.total"
              [subtitle]="data.membres.actifs + ' actifs sur ' + data.membres.total"
              icon="bi bi-person-badge"
              theme="primary"
            />

            <!-- Activités -->
            <app-stat-card
              title="Activités Pastorales"
              [value]="data.activites.total"
              [subtitle]="data.activites.en_cours + ' en cours · ' + data.activites.planifiees + ' planifiées'"
              icon="bi bi-calendar-event"
              theme="accent"
            />

            <!-- Pèlerinages -->
            <app-stat-card
              title="Pèlerinages & Voyages"
              [value]="data.pelerinages.campagnes_total"
              [subtitle]="data.pelerinages.total_inscrits + ' inscrits · ' + data.pelerinages.campagnes_ouvertes + ' ouverte(s)'"
              icon="bi bi-compass"
              theme="warning"
            />

            <!-- Caisse -->
            <app-stat-card
              title="Solde Caisse"
              [value]="(data.finances.solde_caisse | number) + ' F'"
              [subtitle]="'Entrées : ' + (data.finances.total_entrees | number) + ' F'"
              icon="bi bi-cash-coin"
              theme="success"
            />
          </div>

          <!-- 3. SYNTHÈSES DÉTAILLÉES (Pèlerinages & Finances réelles) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Synthèse Financière Réelle -->
            <app-card title="Synthèse Financière & Caisse" subtitle="Mouvements de trésorerie certifiés par le backend">
              <div class="finance-summary-list">
                <div class="summary-row">
                  <span class="summary-label">Total des Recettes / Entrées</span>
                  <span class="summary-val text-success">
                    +{{ data.finances.total_entrees | number }} FCFA
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Total des Dépenses / Sorties</span>
                  <span class="summary-val text-danger">
                    -{{ data.finances.total_sorties | number }} FCFA
                  </span>
                </div>
                <div class="summary-row row-total">
                  <span class="summary-label font-bold">Solde Disponible en Caisse</span>
                  <span class="summary-val font-bold" [class.text-success]="data.finances.solde_caisse >= 0" [class.text-danger]="data.finances.solde_caisse < 0">
                    {{ data.finances.solde_caisse | number }} FCFA
                  </span>
                </div>
              </div>
            </app-card>

            <!-- Synthèse Pèlerinages Réelle -->
            <app-card
              title="Campagnes & Inscriptions"
              [subtitle]="pelerinagesSubtitle()"
            >
              <div class="pelerinage-summary-list">
                <div class="summary-row">
                  <span class="summary-label">Campagnes Ouvertes aux Inscriptions</span>
                  <span class="summary-val font-semibold">
                    {{ data.pelerinages.campagnes_ouvertes }} / {{ data.pelerinages.campagnes_total }}
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Inscriptions Totalisées</span>
                  <span class="summary-val font-semibold">
                    {{ data.pelerinages.total_inscrits }} {{ participantUnit() }}
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Inscriptions Soldées</span>
                  <span class="summary-val text-success font-semibold">
                    {{ data.pelerinages.inscrits_payes }} soldé(s)
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Montant Total Encaissé</span>
                  <span class="summary-val font-bold text-primary">
                    {{ data.pelerinages.montant_encaisse | number }} FCFA
                  </span>
                </div>
              </div>
            </app-card>
          </div>

          <!-- 4. WIDGETS OPÉRATIONNELS ENRICHIS (Phase 2 F26.ORG) -->
          <div class="section-heading mb-3 mt-6">
            <h3 class="section-group-title">
              <i class="bi bi-cpu-fill mr-2" aria-hidden="true"></i>
              Suivi Opérationnel & Alertes en Temps Réel
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Widget 1: Prochaines Activités -->
            <app-card title="Prochaines Activités Pastorales" subtitle="Calendrier des événements à venir">
              <div card-actions>
                <app-btn variant="ghost" size="sm" (btnClick)="navigateTo('/organisation/activites')">
                  <span>Voir tout</span>
                  <i class="bi bi-chevron-right ml-1"></i>
                </app-btn>
              </div>

              @if (data.widgets?.prochaines_activites && data.widgets!.prochaines_activites.length > 0) {
                <div class="widget-list">
                  @for (act of data.widgets!.prochaines_activites; track act.id) {
                    <div class="widget-item" (click)="navigateTo('/organisation/activites')">
                      <div class="widget-item-icon primary">
                        <i class="bi bi-calendar3"></i>
                      </div>
                      <div class="widget-item-info">
                        <span class="widget-item-title">{{ act.titre }}</span>
                        <span class="widget-item-meta">
                          <i class="bi bi-clock mr-1"></i>{{ act.date_debut | date: 'dd/MM/yyyy' }}
                          @if (act.lieu) {
                            · <i class="bi bi-geo-alt mr-1"></i>{{ act.lieu }}
                          }
                        </span>
                      </div>
                      <span class="badge-status">{{ act.statut }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-widget">
                  <i class="bi bi-calendar-x text-muted"></i>
                  <span>Aucune activité planifiée prochainement</span>
                </div>
              }
            </app-card>

            <!-- Widget 2: Derniers Règlements & Paiements -->
            <app-card title="Derniers Règlements Reçus" subtitle="Traçabilité des encaissements récents">
              <div card-actions>
                <app-btn variant="ghost" size="sm" (btnClick)="navigateTo('/organisation/paiements')">
                  <span>Voir tout</span>
                  <i class="bi bi-chevron-right ml-1"></i>
                </app-btn>
              </div>

              @if (data.widgets?.derniers_paiements && data.widgets!.derniers_paiements.length > 0) {
                <div class="widget-list">
                  @for (p of data.widgets!.derniers_paiements; track p.id) {
                    <div class="widget-item" (click)="navigateTo('/organisation/paiements')">
                      <div class="widget-item-icon success">
                        <i class="bi bi-receipt"></i>
                      </div>
                      <div class="widget-item-info">
                        <span class="widget-item-title">
                          {{ p.inscription ? (p.inscription.nom + ' ' + p.inscription.prenoms) : 'Pèlerin' }}
                        </span>
                        <span class="widget-item-meta">
                          Réf: <code>{{ p.reference_recu }}</code> · {{ p.date_paiement | date: 'dd/MM/yyyy HH:mm' }} · {{ p.mode_paiement }}
                        </span>
                      </div>
                      <span class="widget-amount text-success font-semibold">
                        +{{ p.montant | number }} F
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-widget">
                  <i class="bi bi-wallet2 text-muted"></i>
                  <span>Aucun paiement enregistré pour l'instant</span>
                </div>
              }
            </app-card>

            <!-- Widget 3: Notifications & Alertes Métier -->
            <app-card title="Notifications & Alertes de Gestion" subtitle="Points d'attention opérationnels" class="md:col-span-2">
              @if (data.widgets?.notifications && data.widgets!.notifications.length > 0) {
                <div class="widget-list">
                  @for (notif of data.widgets!.notifications; track notif.titre) {
                    <div class="widget-notif-item" [class]="'notif-' + notif.type">
                      <div class="notif-icon">
                        <i [class]="notif.type === 'warning' ? 'bi bi-exclamation-triangle-fill' : notif.type === 'info' ? 'bi bi-info-circle-fill' : 'bi bi-check-circle-fill'"></i>
                      </div>
                      <div class="notif-body">
                        <span class="notif-title">{{ notif.titre }}</span>
                        <span class="notif-message">{{ notif.message }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-widget">
                  <i class="bi bi-bell text-muted"></i>
                  <span>Aucune notification active</span>
                </div>
              }
            </app-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .oppe-dashboard-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .annee-catechese-tag {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 0.85rem;
      background: var(--primary-50, #eff6ff);
      color: var(--primary-700, #1d4ed8);
      border: 1px solid var(--primary-200, #bfdbfe);
      border-radius: var(--radius-full, 9999px);
      font-size: 0.85rem;
    }

    .catheo-highlight-section {
      border-radius: var(--radius-lg, 14px);
    }

    .catheo-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .catheo-title-wrap {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .catheo-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md, 10px);
      background: var(--primary-600, #2563eb);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .catheo-badges-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }

    .sections-legend {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
    }

    .sections-legend code {
      background: var(--neutral-100, #f1f5f9);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      margin: 0;
    }

    .effectif-card {
      padding: 1.25rem;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      position: relative;
      overflow: hidden;
    }

    .effectif-total {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #bfdbfe;
    }

    .effectif-primaire {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #bbf7d0;
    }

    .effectif-college {
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
      border-color: #e9d5ff;
    }

    .effectif-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-secondary, #475569);
    }

    .effectif-value-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .effectif-number {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1.1;
    }

    .code-pill {
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 6px);
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-primary, #0f172a);
    }

    .effectif-bg-icon {
      font-size: 2rem;
      opacity: 0.25;
      color: var(--primary-700, #1d4ed8);
    }

    .effectif-subtext {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }

    .alert-info-catheo {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md, 8px);
      color: #1e40af;
      font-size: 0.85rem;
    }

    .repartition-block {
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-color, #e2e8f0);
    }

    .repartition-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      margin-bottom: 0.4rem;
      display: block;
    }

    .repartition-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .niveau-tag {
      font-size: 0.775rem;
      background: var(--neutral-100, #f1f5f9);
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm, 6px);
      color: var(--text-secondary, #334155);
    }

    .section-group-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      font-size: 0.875rem;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .row-total {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 2px solid var(--border-color, #e2e8f0);
      font-size: 1rem;
    }

    .summary-label {
      color: var(--text-secondary, #475569);
    }

    .text-success {
      color: var(--success-600, #059669);
    }

    .text-danger {
      color: var(--danger-600, #dc2626);
    }

    .text-primary {
      color: var(--primary-600, #2563eb);
    }

    .catheo-icon-box-oppj {
      background: var(--warning-600, #d97706);
    }

    .effectif-oppj {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-color: #fde68a;
    }

    .effectif-jeunes {
      background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
      border-color: #c7d2fe;
    }

    .font-semibold {
      font-weight: 600;
    }

    .font-bold {
      font-weight: 700;
    }

    /* Widgets F26.ORG */
    .widget-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .widget-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #ffffff);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .widget-item:hover {
      background: var(--neutral-50, #f8fafc);
      border-color: var(--primary-300, #93c5fd);
      transform: translateX(2px);
    }

    .widget-item-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }

    .widget-item-icon.primary {
      background: var(--primary-100, #dbeafe);
      color: var(--primary-700, #1d4ed8);
    }

    .widget-item-icon.warning {
      background: #fef3c7;
      color: #b45309;
    }

    .widget-item-icon.success {
      background: #dcfce7;
      color: #15803d;
    }

    .widget-item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .widget-item-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .widget-item-meta {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 2px;
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--neutral-100, #f1f5f9);
      color: var(--text-secondary, #475569);
      text-transform: capitalize;
    }

    .empty-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
      text-align: center;
      gap: 0.5rem;
    }

    .empty-widget i {
      font-size: 1.5rem;
    }

    .widget-notif-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .widget-notif-item.notif-warning {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .widget-notif-item.notif-info {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }

    .widget-notif-item.notif-success {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .notif-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .notif-body {
      display: flex;
      flex-direction: column;
    }

    .notif-title {
      font-weight: 600;
      font-size: 0.85rem;
    }

    .notif-message {
      font-size: 0.78rem;
      margin-top: 2px;
      line-height: 1.3;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationDashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(OrganisationDashboardService);
  private readonly contextService = inject(OrganisationContextService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly sectionPrimaireCode = CATHEO_SECTIONS.ENFANTS_PRIMAIRE;
  public readonly sectionCollegeCode = CATHEO_SECTIONS.ENFANTS_COLLEGE;
  public readonly sectionJeunesCode = CATHEO_SECTIONS.JEUNES;

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly dashboardData = signal<OrganisationDashboardData | null>(null);

  public readonly orgContext = this.contextService.context;
  public readonly isOppe = this.contextService.isOppe;
  public readonly isOppj = this.contextService.isOppj;
  public readonly typeOrganisation = this.contextService.typeOrganisation;

  public readonly dashboardTitle = computed(() => {
    const type = this.typeOrganisation();
    if (type === 'OPPE') return 'Dashboard OPPE';
    if (type === 'OPPJ') return 'Dashboard OPPJ';
    if (type === 'OPPA') return 'Dashboard OPPA';
    return 'Tableau de Bord Pastorale';
  });

  public readonly dashboardSubtitle = computed(() => {
    const org = this.orgContext();
    const parish = org?.paroisse?.nom_paroisse || 'Paroisse';
    return `${org?.nom || 'Organisation Pastorale'} · ${parish}`;
  });

  public readonly badgeText = computed(() => {
    return this.typeOrganisation() || 'OPPE';
  });

  public readonly badgeVariant = computed<'primary' | 'secondary' | 'warning'>(() => {
    const type = this.typeOrganisation();
    if (type === 'OPPE') return 'primary';
    if (type === 'OPPJ') return 'warning';
    return 'secondary';
  });

  public readonly activeYear = computed(() => {
    return this.dashboardData()?.catheo?.annee_catechese || '';
  });

  public readonly populationCardTitle = computed(() => {
    if (this.isOppj()) {
      return 'Population de Catéchèse Paroissiale OPPJ';
    }
    return 'Population de Catéchèse Paroissiale OPPE';
  });

  public readonly populationSubtitle = computed(() => {
    const year = this.activeYear() || 'En cours';
    if (this.isOppj()) {
      return `Jeunes relevant strictement de l'Office Paroissial de la Pastorale des Jeunes (OPPJ) sur l'année catéchétique active (${year}).`;
    }
    return `Enfants relevant strictement de l'Office Paroissial de la Pastorale des Enfants (OPPE) sur l'année catéchétique active (${year}).`;
  });

  public readonly totalJeunes = computed(() => {
    const catheo = this.dashboardData()?.catheo;
    return catheo?.total_jeunes ?? catheo?.total_population ?? 0;
  });

  public readonly pelerinagesSubtitle = computed(() => {
    if (this.isOppj()) {
      return "Vue d'ensemble des voyages et sorties de jeunes";
    }
    return "Vue d'ensemble des voyages et sorties d'enfants";
  });

  public readonly participantUnit = computed(() => {
    return this.isOppj() ? 'jeune(s)' : 'enfant(s)';
  });

  public ngOnInit(): void {
    this.loadDashboard();
  }

  public navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  public loadDashboard(fresh: boolean = false): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getDashboard(fresh).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Impossible de charger le tableau de bord.';
        this.errorMessage.set(msg);
        this.toast.error('Erreur', msg);
      },
    });
  }

  public refreshDashboard(): void {
    this.loadDashboard(true);
    this.toast.info('Actualisation', 'Rechargement des indicateurs en cours...');
  }
}

