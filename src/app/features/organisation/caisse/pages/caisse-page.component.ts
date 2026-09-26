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
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { OperationTypeBadgeComponent } from '../components/operation-type-badge/operation-type-badge.component';
import { OperationStatusBadgeComponent } from '../components/operation-status-badge/operation-status-badge.component';
import { OperationDetailModalComponent } from '../components/operation-detail-modal/operation-detail-modal.component';
import { PaiementDetailModalComponent } from '../components/paiement-detail-modal/paiement-detail-modal.component';
import { CaisseService } from '../services/caisse.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  CaisseFilters,
  OperationCaisse,
  SyntheseCaisse,
  TypeOperationCaisse,
} from '../models/caisse.model';
import {
  CampagnePelerinage,
  PaiementFilters,
  PaiementPelerinage,
} from '../../pelerinages/models/pelerinage.model';
import { DepenseFormModalComponent } from '../components/depense-form-modal/depense-form-modal.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-caisse-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    FilterBarComponent,
    TableComponent,
    PaginationComponent,
    ErrorStateComponent,
    OperationDetailModalComponent,
    PaiementDetailModalComponent,
    DepenseFormModalComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="caisse-page-container">
      <!-- En-tête de page officiel avec Solde Disponible bien mis en avant -->
      <app-page-header
        title="Caisse"
        subtitle="Suivi des encaissements et opérations financières"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="header-actions">
          <!-- Badge Solde Disponible -->
          <div
            class="solde-disponible-header-badge"
            [class.solde-positif]="synthese().solde_final >= 0"
            [class.solde-negatif]="synthese().solde_final < 0"
            title="Solde disponible de la caisse"
          >
            <span class="solde-badge-label">
              <i class="bi bi-wallet2 mr-1"></i> Solde disponible :
            </span>
            <span class="solde-badge-val">
              {{ formatAmount(synthese().solde_final) }}
            </span>
          </div>

          <app-btn
            variant="danger"
            icon="dash-circle"
            (btnClick)="openDepenseModal()"
          >
            Enregistrer une dépense
          </app-btn>

          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="refreshData()"
          >
            Actualiser
          </app-btn>

          @if (canExport()) {
            <app-btn
              variant="secondary"
              icon="file-earmark-excel"
              [loading]="isExporting()"
              (btnClick)="exportCaisse()"
            >
              Export Excel
            </app-btn>
            <app-btn
              variant="secondary"
              icon="file-earmark-pdf"
              (btnClick)="exportPdf()"
            >
              Imprimer / PDF
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- Cartes statistiques réelles issues de l'API -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Solde disponible"
          [value]="formatAmount(synthese().solde_final)"
          subtitle="Fonds disponibles en caisse"
          icon="bi bi-wallet2"
          [theme]="synthese().solde_final >= 0 ? 'success' : 'danger'"
        />

        <app-stat-card
          title="Total des entrées"
          [value]="formatAmount(synthese().total_entrees)"
          subtitle="Recettes encaissées"
          icon="bi bi-arrow-down-left-circle-fill"
          theme="success"
        />

        <app-stat-card
          title="Total des sorties"
          [value]="formatAmount(synthese().total_sorties)"
          subtitle="Décaissements enregistrés"
          icon="bi bi-arrow-up-right-circle-fill"
          theme="danger"
        />

        <app-stat-card
          title="Opérations"
          [value]="synthese().nombre_operations"
          subtitle="Mouvements sur la période"
          icon="bi bi-receipt"
          theme="primary"
        />
      </div>

      <!-- Navigation par onglets -->
      <div class="tabs-nav mt-6">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'journal'"
          (click)="setActiveTab('journal')"
        >
          <i class="bi bi-journal-text mr-2"></i>
          Journal des opérations de caisse
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'depenses'"
          (click)="setActiveTab('depenses')"
        >
          <i class="bi bi-dash-circle mr-2"></i>
          Dépenses & Décaissements
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'pelerinages'"
          (click)="setActiveTab('pelerinages')"
        >
          <i class="bi bi-person-check mr-2"></i>
          Encaissements des pèlerinages
        </button>
      </div>

      <!-- ONGLET 1 : JOURNAL DES OPÉRATIONS DE CAISSE -->
      @if (activeTab() === 'journal') {
        <div class="mt-4">
          <!-- Barre de filtres pour les opérations -->
          <app-filter-bar
            searchPlaceholder="Rechercher par référence, libellé..."
            [hasActiveFilters]="hasActiveFiltersJournal()"
            (searchChange)="onSearchChangeJournal($event)"
            (resetFilters)="onResetFiltersJournal()"
          >
            <div class="filters-wrap">
              <select
                [value]="selectedTypeOperation()"
                (change)="onTypeOperationChange($event)"
                class="filter-select"
                aria-label="Filtrer par type"
              >
                <option value="tous">Tous les mouvements</option>
                <option value="entree">Entrées uniquement</option>
                <option value="sortie">Sorties uniquement</option>
              </select>

              @if (campagnes().length > 0) {
                <select
                  [value]="selectedCampagneJournal()"
                  (change)="onCampagneChangeJournal($event)"
                  class="filter-select"
                  aria-label="Filtrer par campagne"
                >
                  <option value="">Toutes les campagnes</option>
                  @for (c of campagnes(); track c.id) {
                    <option [value]="c.id">{{ c.nom }}</option>
                  }
                </select>
              }

              <div class="date-filter-group">
                <input
                  type="date"
                  [value]="dateDebut()"
                  (change)="onDateDebutChange($event)"
                  class="filter-input-date"
                  placeholder="Date début"
                  title="Date début"
                />
                <span class="date-sep">&agrave;</span>
                <input
                  type="date"
                  [value]="dateFin()"
                  (change)="onDateFinChange($event)"
                  class="filter-input-date"
                  placeholder="Date fin"
                  title="Date fin"
                />
              </div>
            </div>
          </app-filter-bar>

          <!-- État d'erreur -->
          @if (errorMessage() && !isLoading()) {
            <div class="mt-6">
              <app-error-state
                title="Erreur lors de la récupération de la caisse"
                [message]="errorMessage()!"
                actionText="Réessayer"
                (action)="loadCaisse()"
              />
            </div>
          }

          <!-- Tableau des opérations de caisse -->
          @if (!errorMessage()) {
            <div class="mt-4">
              <app-table
                [columns]="operationColumns"
                [data]="operations()"
                [loading]="isLoading()"
                [hasActions]="true"
                [rowActionsTemplate]="opRowActionsTpl"
                emptyMessage="Aucune opération enregistrée"
                emptySubtitle="Aucun mouvement financier ne correspond à vos critères de recherche."
              />

              @if (totalOperations() > 0) {
                <div class="mt-4">
                  <app-pagination
                    [currentPage]="currentPageJournal()"
                    [perPage]="perPageJournal()"
                    [total]="totalOperations()"
                    (pageChange)="onPageChangeJournal($event)"
                  />
                </div>
              }
            </div>
          }

          <ng-template #opRowActionsTpl let-op>
            <div class="row-actions-group">
              <button
                type="button"
                class="action-btn action-view"
                (click)="openOperationDetail(op)"
                title="Consulter le détail"
                aria-label="Détail"
              >
                <i class="bi bi-eye"></i>
              </button>
              @if (op.type_operation === 'sortie' && op.statut === 'valide') {
                <button
                  type="button"
                  class="action-btn action-danger"
                  (click)="askCancelDepense(op)"
                  title="Annuler cette dépense"
                  aria-label="Annuler"
                >
                  <i class="bi bi-x-circle text-danger"></i>
                </button>
              }
            </div>
          </ng-template>
        </div>
      }

      <!-- ONGLET 2 : DÉPENSES & DÉCAISSEMENTS -->
      @if (activeTab() === 'depenses') {
        <div class="mt-4">
          <!-- Bannière récapitulative dépense -->
          <div class="depenses-banner">
            <div class="depenses-banner-info">
              <div class="depenses-banner-icon">
                <i class="bi bi-arrow-up-right-circle-fill"></i>
              </div>
              <div>
                <h4 class="depenses-banner-title">Gestion des dépenses & décaissements</h4>
                <p class="depenses-banner-sub">
                  Toute dépense enregistrée est automatiquement décomptée du solde de caisse.
                </p>
              </div>
            </div>
            <div class="depenses-banner-actions">
              <app-btn
                variant="danger"
                icon="plus-circle"
                (btnClick)="openDepenseModal()"
              >
                Nouvelle dépense
              </app-btn>
            </div>
          </div>

          <!-- Barre de filtres pour les dépenses -->
          <div class="mt-4">
            <app-filter-bar
              searchPlaceholder="Rechercher par référence, libellé, motif..."
              [hasActiveFilters]="hasActiveFiltersJournal()"
              (searchChange)="onSearchChangeJournal($event)"
              (resetFilters)="onResetFiltersJournal()"
            >
              <div class="filters-wrap">
                @if (campagnes().length > 0) {
                  <select
                    [value]="selectedCampagneJournal()"
                    (change)="onCampagneChangeJournal($event)"
                    class="filter-select"
                    aria-label="Filtrer par campagne"
                  >
                    <option value="">Toutes les campagnes</option>
                    @for (c of campagnes(); track c.id) {
                      <option [value]="c.id">{{ c.nom }}</option>
                    }
                  </select>
                }

                <div class="date-filter-group">
                  <input
                    type="date"
                    [value]="dateDebut()"
                    (change)="onDateDebutChange($event)"
                    class="filter-input-date"
                    placeholder="Date début"
                    title="Date début"
                  />
                  <span class="date-sep">&agrave;</span>
                  <input
                    type="date"
                    [value]="dateFin()"
                    (change)="onDateFinChange($event)"
                    class="filter-input-date"
                    placeholder="Date fin"
                    title="Date fin"
                  />
                </div>
              </div>
            </app-filter-bar>
          </div>

          <!-- État d'erreur -->
          @if (errorMessage() && !isLoading()) {
            <div class="mt-6">
              <app-error-state
                title="Erreur lors de la récupération des dépenses"
                [message]="errorMessage()!"
                actionText="Réessayer"
                (action)="loadCaisse()"
              />
            </div>
          }

          <!-- Tableau des dépenses -->
          @if (!errorMessage()) {
            <div class="mt-4">
              <app-table
                [columns]="depenseColumns"
                [data]="operations()"
                [loading]="isLoading()"
                [hasActions]="true"
                [rowActionsTemplate]="depenseRowActionsTpl"
                emptyMessage="Aucune dépense enregistrée"
                emptySubtitle="Aucun décaissement ne correspond à vos critères de recherche."
              />

              @if (totalOperations() > 0) {
                <div class="mt-4">
                  <app-pagination
                    [currentPage]="currentPageJournal()"
                    [perPage]="perPageJournal()"
                    [total]="totalOperations()"
                    (pageChange)="onPageChangeJournal($event)"
                  />
                </div>
              }
            </div>
          }

          <ng-template #depenseRowActionsTpl let-dep>
            <div class="row-actions-group">
              <button
                type="button"
                class="action-btn action-view"
                (click)="openOperationDetail(dep)"
                title="Consulter le détail"
                aria-label="Détail"
              >
                <i class="bi bi-eye"></i>
              </button>
              @if (dep.statut === 'valide') {
                <button
                  type="button"
                  class="action-btn action-danger"
                  (click)="askCancelDepense(dep)"
                  title="Annuler cette dépense"
                  aria-label="Annuler"
                >
                  <i class="bi bi-x-circle text-danger"></i>
                </button>
              }
            </div>
          </ng-template>
        </div>
      }

      <!-- ONGLET 3 : ENCAISSEMENTS DES PÈLERINAGES -->
      @if (activeTab() === 'pelerinages') {
        <div class="mt-4">
          @if (campagnes().length === 0) {
            <div class="empty-campagne-box">
              <i class="bi bi-geo-alt text-muted"></i>
              <p>Aucune campagne de pèlerinage disponible pour cette organisation.</p>
            </div>
          } @else {
            <!-- Sélection de la campagne & filtres -->
            <app-filter-bar
              searchPlaceholder="Rechercher par pèlerin, référence..."
              [hasActiveFilters]="hasActiveFiltersPaiements()"
              (searchChange)="onSearchChangePaiement($event)"
              (resetFilters)="onResetFiltersPaiement()"
            >
              <div class="filters-wrap">
                <select
                  [value]="selectedCampagnePelerinageId()"
                  (change)="onCampagneChangePelerinages($event)"
                  class="filter-select highlight-select"
                  aria-label="Campagne de pèlerinage"
                >
                  @for (c of campagnes(); track c.id) {
                    <option [value]="c.id">Campagne : {{ c.nom }}</option>
                  }
                </select>

                <select
                  [value]="selectedModePaiement()"
                  (change)="onModePaiementChange($event)"
                  class="filter-select"
                  aria-label="Mode de paiement"
                >
                  <option value="tous">Tous les modes</option>
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                </select>

                <select
                  [value]="selectedStatutPaiement()"
                  (change)="onStatutPaiementChange($event)"
                  class="filter-select"
                  aria-label="Statut du paiement"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="valide">Validé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>
            </app-filter-bar>

            <!-- Tableau des paiements de pèlerinages -->
            <div class="mt-4">
              <app-table
                [columns]="paiementColumns"
                [data]="paiementsCampagne()"
                [loading]="isLoadingPaiements()"
                [hasActions]="true"
                [rowActionsTemplate]="paiementRowActionsTpl"
                emptyMessage="Aucun paiement trouvé"
                emptySubtitle="Aucun versement ne correspond aux critères sélectionnés."
              />

              @if (totalPaiements() > 0) {
                <div class="mt-4">
                  <app-pagination
                    [currentPage]="currentPagePaiements()"
                    [perPage]="perPagePaiements()"
                    [total]="totalPaiements()"
                    (pageChange)="onPageChangePaiements($event)"
                  />
                </div>
              }
            </div>

            <ng-template #paiementRowActionsTpl let-p>
              <div class="row-actions-group">
                <button
                  type="button"
                  class="action-btn action-view"
                  (click)="openPaiementDetail(p)"
                  title="Consulter et gérer les règlements de ce participant"
                  aria-label="Règlements"
                >
                  <i class="bi bi-wallet2"></i>
                </button>
              </div>
            </ng-template>
          }
        </div>
      }
    </div>

    <!-- Modals -->
    <app-operation-detail-modal
      [isOpen]="showOpDetailModal()"
      [operation]="selectedOperation()"
      (close)="showOpDetailModal.set(false)"
    />

    <app-paiement-detail-modal
      [isOpen]="showPaiementModal()"
      [campagneId]="currentCampagneIdForModal()"
      [campagneNom]="currentCampagneNomForModal()"
      [inscription]="selectedInscriptionForModal()"
      (close)="showPaiementModal.set(false)"
      (paymentChanged)="onPaymentChanged()"
    />

    <app-depense-form-modal
      [isOpen]="showDepenseModal()"
      [soldeActuel]="synthese().solde_final"
      [campagnes]="campagnes()"
      (close)="closeDepenseModal()"
      (saved)="onDepenseSaved($event)"
    />

    <app-confirm-dialog
      [isOpen]="showCancelConfirmModal()"
      title="Annuler la dépense"
      [message]="cancelModalMessage()"
      variant="danger"
      confirmText="Oui, annuler la dépense"
      cancelText="Non, conserver"
      [loading]="isCancellingDepense()"
      (confirmed)="confirmAnnulerDepense()"
      (cancelled)="showCancelConfirmModal.set(false)"
    />
  `,
  styles: [`
    .caisse-page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      .caisse-page-container {
        padding: 1rem;
      }
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .solde-disponible-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.875rem;
      font-weight: 700;
      border: 1.5px solid transparent;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    .solde-disponible-header-badge.solde-positif {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
    }
    .solde-disponible-header-badge.solde-negatif {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .solde-badge-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.9;
      display: flex;
      align-items: center;
    }
    .solde-badge-val {
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.25rem;
    }
    .tab-btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all var(--transition-fast, 0.15s ease);
    }
    .tab-btn:hover {
      color: var(--color-primary, #6366f1);
    }
    .tab-btn.active {
      color: var(--color-primary, #6366f1);
      border-bottom-color: var(--color-primary, #6366f1);
    }
    .filters-wrap {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-select {
      padding: 0.4375rem 0.75rem;
      font-size: 0.8125rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-color, #1e293b);
      font-family: inherit;
    }
    .highlight-select {
      font-weight: 600;
      border-color: var(--color-primary-light, #e0e7ff);
    }
    .date-filter-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .filter-input-date {
      padding: 0.375rem 0.5rem;
      font-size: 0.8125rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-color, #1e293b);
    }
    .date-sep {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .row-actions-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      color: var(--text-muted, #64748b);
      cursor: pointer;
      transition: all var(--transition-fast, 0.15s ease);
    }
    .action-btn:hover {
      background: var(--color-primary-light, #e0e7ff);
      color: var(--color-primary, #6366f1);
      border-color: var(--color-primary, #6366f1);
    }
    .empty-campagne-box {
      text-align: center;
      padding: 3rem 1rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px dashed var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
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
    .mt-4 {
      margin-top: 1rem;
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
    .depenses-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-surface-elevated, #fef2f2);
      border: 1px solid var(--danger-100, #fee2e2);
      border-radius: var(--radius-lg, 12px);
      flex-wrap: wrap;
    }
    .depenses-banner-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .depenses-banner-icon {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--danger-500, #ef4444);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .depenses-banner-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      margin: 0 0 0.25rem 0;
    }
    .depenses-banner-sub {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    .action-btn.action-danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
      color: #ef4444;
    }
    .text-danger {
      color: #ef4444;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaissePageComponent implements OnInit {
  private readonly caisseService = inject(CaisseService);
  private readonly orgContext = inject(OrganisationContextService);
  private readonly permission = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiClient);

  // Type d'organisation active (OPPE, OPPJ, OPPA)
  public readonly typeOrganisation = computed(() => {
    return this.orgContext.typeOrganisation() || 'Organisation';
  });

  public readonly formatAmount = formatCfa;

  public readonly canExport = computed(() =>
    this.permission.hasPermission('caisse.export') || this.permission.hasPermission('caisse.read')
  );

  // Onglet actif : 'journal' | 'depenses' | 'pelerinages'
  public readonly activeTab = signal<'journal' | 'depenses' | 'pelerinages'>('journal');

  // États globaux
  public readonly isLoading = signal<boolean>(false);
  public readonly isExporting = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  // Synthèse financière réelle
  public readonly synthese = signal<SyntheseCaisse>({
    periode_debut: null,
    periode_fin: null,
    solde_initial: 0,
    total_entrees: 0,
    total_sorties: 0,
    solde_periode: 0,
    solde_final: 0,
    nombre_operations: 0,
  });

  // Filtres Journal
  public readonly operations = signal<OperationCaisse[]>([]);
  public readonly totalOperations = signal<number>(0);
  public readonly currentPageJournal = signal<number>(1);
  public readonly perPageJournal = signal<number>(25);
  public readonly searchJournal = signal<string>('');
  public readonly selectedTypeOperation = signal<'tous' | TypeOperationCaisse>('tous');
  public readonly selectedCampagneJournal = signal<string>('');
  public readonly dateDebut = signal<string>('');
  public readonly dateFin = signal<string>('');

  // Campagnes pour filtres et onglet pèlerinages
  public readonly campagnes = signal<CampagnePelerinage[]>([]);

  // Onglet Encaissements Pèlerinages
  public readonly selectedCampagnePelerinageId = signal<number | string>('');
  public readonly paiementsCampagne = signal<PaiementPelerinage[]>([]);
  public readonly totalPaiements = signal<number>(0);
  public readonly currentPagePaiements = signal<number>(1);
  public readonly perPagePaiements = signal<number>(20);
  public readonly searchPaiement = signal<string>('');
  public readonly selectedModePaiement = signal<string>('tous');
  public readonly selectedStatutPaiement = signal<string>('tous');
  public readonly isLoadingPaiements = signal<boolean>(false);

  // Modals state
  public readonly showOpDetailModal = signal<boolean>(false);
  public readonly selectedOperation = signal<OperationCaisse | null>(null);

  public readonly showPaiementModal = signal<boolean>(false);
  public readonly currentCampagneIdForModal = signal<number | string>('');
  public readonly currentCampagneNomForModal = signal<string>('');
  public readonly selectedInscriptionForModal = signal<any | null>(null);

  // Modal Dépense (Sortie de caisse)
  public readonly showDepenseModal = signal<boolean>(false);
  public readonly showCancelConfirmModal = signal<boolean>(false);
  public readonly depenseToCancel = signal<OperationCaisse | null>(null);
  public readonly isCancellingDepense = signal<boolean>(false);

  public readonly cancelModalMessage = computed(() => {
    const dep = this.depenseToCancel();
    if (!dep) return 'Voulez-vous annuler cette dépense ?';
    return `Êtes-vous sûr de vouloir annuler la dépense ${dep.reference} d'un montant de ${formatCfa(dep.montant)} ? Le montant sera immédiatement recrédité sur le solde de caisse.`;
  });

  // Colonnes du tableau Journal
  public readonly operationColumns: TableColumn<OperationCaisse>[] = [
    {
      key: 'reference',
      label: 'Réf. Opération',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'date_operation',
      label: 'Date & Heure',
      formatter: (val: string) =>
        val ? new Date(val).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          : '—',
    },
    {
      key: 'libelle',
      label: 'Libellé / Origine',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'mode_reglement',
      label: 'Mode',
      formatter: (val: string) => (val ? val.toUpperCase() : '—'),
    },
    {
      key: 'type_operation',
      label: 'Type',
      formatter: (val: string) => (val === 'sortie' ? 'Sortie' : 'Entrée'),
    },
    {
      key: 'montant',
      label: 'Montant',
      formatter: (val: number, row: OperationCaisse) =>
        `${row.type_operation === 'sortie' ? '-' : '+'} ${formatCfa(val)}`,
    },
    {
      key: 'statut',
      label: 'Statut',
      formatter: (val: string) => (val === 'valide' ? 'Validé' : 'Annulé'),
    },
    {
      key: 'operateur',
      label: 'Opérateur',
      formatter: (val: any) => val?.name || '—',
    },
  ];

  // Colonnes du tableau Paiements Pèlerinages
  public readonly paiementColumns: TableColumn<PaiementPelerinage>[] = [
    {
      key: 'date_paiement',
      label: 'Date',
      formatter: (val: string) =>
        val ? new Date(val).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'reference',
      label: 'Réf. Reçu',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'participant',
      label: 'Pèlerin',
      formatter: (_: any, row: any) =>
        row.inscription?.nom_complet ||
        `${row.inscription?.nom || ''} ${row.inscription?.prenoms || ''}`.trim() ||
        '—',
    },
    {
      key: 'montant',
      label: 'Montant payé',
      formatter: (val: number) => formatCfa(val),
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      formatter: (val: string) => (val ? val.toUpperCase() : '—'),
    },
    {
      key: 'statut',
      label: 'Statut',
      formatter: (val: string) => (val === 'valide' ? 'Validé' : 'Annulé'),
    },
    {
      key: 'caissier',
      label: 'Enregistré par',
      formatter: (val: any) => val?.name || '—',
    },
  ];

  // Colonnes du tableau Dépenses (Décaissements)
  public readonly depenseColumns: TableColumn<OperationCaisse>[] = [
    {
      key: 'reference',
      label: 'Réf. Dépense',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'date_operation',
      label: 'Date & Heure',
      formatter: (val: string) =>
        val
          ? new Date(val).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—',
    },
    {
      key: 'libelle',
      label: 'Motif / Justification',
      formatter: (val: string) => val || '—',
    },
    {
      key: 'mode_reglement',
      label: 'Mode',
      formatter: (val: string) => (val ? val.toUpperCase() : '—'),
    },
    {
      key: 'montant',
      label: 'Montant décompté',
      formatter: (val: number) => `- ${formatCfa(val)}`,
    },
    {
      key: 'statut',
      label: 'Statut',
      formatter: (val: string) => (val === 'valide' ? 'Validé' : 'Annulé'),
    },
    {
      key: 'operateur',
      label: 'Enregistré par',
      formatter: (val: any) => val?.name || '—',
    },
  ];

  public readonly hasActiveFiltersJournal = computed(() => {
    return (
      !!this.searchJournal() ||
      this.selectedTypeOperation() !== 'tous' ||
      !!this.selectedCampagneJournal() ||
      !!this.dateDebut() ||
      !!this.dateFin()
    );
  });

  public readonly hasActiveFiltersPaiements = computed(() => {
    return (
      !!this.searchPaiement() ||
      this.selectedModePaiement() !== 'tous' ||
      this.selectedStatutPaiement() !== 'tous'
    );
  });

  public ngOnInit(): void {
    this.loadCampagnes();
    this.loadCaisse();
  }

  public setActiveTab(tab: 'journal' | 'depenses' | 'pelerinages'): void {
    this.activeTab.set(tab);
    if (tab === 'pelerinages' && this.selectedCampagnePelerinageId()) {
      this.loadPaiementsCampagne();
    } else if (tab === 'journal' || tab === 'depenses') {
      this.currentPageJournal.set(1);
      this.loadCaisse();
    }
  }

  public refreshData(): void {
    this.loadCaisse();
    if (this.activeTab() === 'pelerinages' && this.selectedCampagnePelerinageId()) {
      this.loadPaiementsCampagne();
    }
  }

  public loadCaisse(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const typeOp =
      this.activeTab() === 'depenses'
        ? 'sortie'
        : this.selectedTypeOperation() !== 'tous'
        ? this.selectedTypeOperation()
        : undefined;

    const filters: CaisseFilters = {
      page: this.currentPageJournal(),
      per_page: this.perPageJournal(),
      search: this.searchJournal() || undefined,
      type_operation: typeOp,
      campagne_id: this.selectedCampagneJournal() ? Number(this.selectedCampagneJournal()) : undefined,
      date_debut: this.dateDebut() || undefined,
      date_fin: this.dateFin() || undefined,
    };

    this.caisseService.getEtatCaisse(filters).subscribe({
      next: (res) => {
        this.synthese.set(res.synthese);
        this.operations.set(res.data);
        this.totalOperations.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || "Impossible de charger l'état de caisse."
        );
      },
    });
  }

  public loadCampagnes(): void {
    this.caisseService.getCampagnes().subscribe({
      next: (campagnes) => {
        this.campagnes.set(campagnes);
        if (campagnes.length > 0 && !this.selectedCampagnePelerinageId()) {
          this.selectedCampagnePelerinageId.set(campagnes[0].id);
          if (this.activeTab() === 'pelerinages') {
            this.loadPaiementsCampagne();
          }
        }
      },
      error: () => {},
    });
  }

  public loadPaiementsCampagne(): void {
    const cid = this.selectedCampagnePelerinageId();
    if (!cid) return;

    this.isLoadingPaiements.set(true);
    const filters: PaiementFilters = {
      page: this.currentPagePaiements(),
      per_page: this.perPagePaiements(),
      search: this.searchPaiement() || undefined,
      mode_paiement: this.selectedModePaiement() !== 'tous' ? this.selectedModePaiement() : undefined,
      statut: this.selectedStatutPaiement() !== 'tous' ? this.selectedStatutPaiement() : undefined,
    };

    this.caisseService.getPaiementsCampagne(cid, filters).subscribe({
      next: (res) => {
        this.paiementsCampagne.set(res.data);
        this.totalPaiements.set(res.meta?.total || res.data.length);
        this.isLoadingPaiements.set(false);
      },
      error: () => {
        this.isLoadingPaiements.set(false);
      },
    });
  }

  // Filtres Journal Handlers
  public onSearchChangeJournal(query: string): void {
    this.searchJournal.set(query);
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onTypeOperationChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as any;
    this.selectedTypeOperation.set(val);
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onCampagneChangeJournal(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCampagneJournal.set(val);
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onDateDebutChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.dateDebut.set(val);
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onDateFinChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.dateFin.set(val);
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onResetFiltersJournal(): void {
    this.searchJournal.set('');
    this.selectedTypeOperation.set('tous');
    this.selectedCampagneJournal.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
    this.currentPageJournal.set(1);
    this.loadCaisse();
  }

  public onPageChangeJournal(evt: PageChangeEvent): void {
    this.currentPageJournal.set(evt.page);
    this.perPageJournal.set(evt.perPage);
    this.loadCaisse();
  }

  // Filtres Paiements Handlers
  public onSearchChangePaiement(query: string): void {
    this.searchPaiement.set(query);
    this.currentPagePaiements.set(1);
    this.loadPaiementsCampagne();
  }

  public onCampagneChangePelerinages(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCampagnePelerinageId.set(val);
    this.currentPagePaiements.set(1);
    this.loadPaiementsCampagne();
  }

  public onModePaiementChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedModePaiement.set(val);
    this.currentPagePaiements.set(1);
    this.loadPaiementsCampagne();
  }

  public onStatutPaiementChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatutPaiement.set(val);
    this.currentPagePaiements.set(1);
    this.loadPaiementsCampagne();
  }

  public onResetFiltersPaiement(): void {
    this.searchPaiement.set('');
    this.selectedModePaiement.set('tous');
    this.selectedStatutPaiement.set('tous');
    this.currentPagePaiements.set(1);
    this.loadPaiementsCampagne();
  }

  public onPageChangePaiements(evt: PageChangeEvent): void {
    this.currentPagePaiements.set(evt.page);
    this.perPagePaiements.set(evt.perPage);
    this.loadPaiementsCampagne();
  }

  // Modals
  public openOperationDetail(op: OperationCaisse): void {
    this.selectedOperation.set(op);
    this.showOpDetailModal.set(true);
  }

  public openPaiementDetail(p: PaiementPelerinage): void {
    const campId = this.selectedCampagnePelerinageId();
    const camp = this.campagnes().find((c) => String(c.id) === String(campId));
    this.currentCampagneIdForModal.set(campId);
    this.currentCampagneNomForModal.set(camp?.nom || 'Campagne de pèlerinage');
    this.selectedInscriptionForModal.set(p.inscription || { id: p.inscription_pelerinage_id, reference: p.reference });
    this.showPaiementModal.set(true);
  }

  public onPaymentChanged(): void {
    this.loadCaisse();
    this.loadPaiementsCampagne();
  }

  public exportCaisse(): void {
    this.isExporting.set(true);
    this.api.downloadBlob('organisation/exports/caisse').subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caisse_organisation_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Export réussi', 'Le journal de caisse a été téléchargé.');
      },
      error: () => {
        this.isExporting.set(false);
        this.toast.error("Erreur d'export", "Impossible de télécharger l'export de caisse.");
      },
    });
  }

  public exportPdf(): void {
    window.print();
  }

  // Gestion des dépenses (Sorties de caisse)
  public openDepenseModal(): void {
    this.showDepenseModal.set(true);
  }

  public closeDepenseModal(): void {
    this.showDepenseModal.set(false);
  }

  public onDepenseSaved(op: OperationCaisse): void {
    this.closeDepenseModal();
    this.refreshData();
    this.toast.success(
      'Dépense enregistrée',
      `La dépense de ${formatCfa(op?.montant || 0)} a été enregistrée et décomptée de la caisse avec succès.`
    );
  }

  public askCancelDepense(dep: OperationCaisse): void {
    this.depenseToCancel.set(dep);
    this.showCancelConfirmModal.set(true);
  }

  public confirmAnnulerDepense(): void {
    const dep = this.depenseToCancel();
    if (!dep) return;

    this.isCancellingDepense.set(true);
    this.caisseService.annulerDepense(dep.id, 'Annulation par le gestionnaire de caisse').subscribe({
      next: () => {
        this.isCancellingDepense.set(false);
        this.showCancelConfirmModal.set(false);
        this.depenseToCancel.set(null);
        this.toast.success(
          'Dépense annulée',
          'La dépense a été annulée et le montant a été recrédité sur le solde de la caisse.'
        );
        this.refreshData();
      },
      error: (err) => {
        this.isCancellingDepense.set(false);
        this.toast.error('Erreur', err?.error?.message || "Impossible d'annuler cette dépense.");
      },
    });
  }
}
