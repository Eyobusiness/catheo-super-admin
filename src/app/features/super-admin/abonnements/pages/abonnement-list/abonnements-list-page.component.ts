import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../../shared/models/table.model';
import { PageChangeEvent, PaginationState } from '../../../../../shared/models/pagination.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { AbonnementService } from '../../services/abonnement.service';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { ProduitService } from '../../../produits/services/produit.service';
import {
  Abonnement,
  AbonnementFilterParams,
  AbonnementStatut,
} from '../../models/abonnement.model';
import { Paroisse } from '../../../paroisses/models/paroisse.model';
import { Produit } from '../../../produits/models/produit.model';
import { AbonnementStatusBadgeComponent } from '../../components/abonnement-status-badge/abonnement-status-badge.component';

@Component({
  selector: 'app-abonnements-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    TableComponent,
    ButtonComponent,
    FilterBarComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    ModalComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Abonnements & Souscriptions"
        subtitle="Gestion des souscriptions paroissiales aux modules applicatifs CATHEO, OPPE, OPPJ et OPPA"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Abonnements' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToCreate()"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Nouvel Abonnement</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Deux cartes de synthèse séparées (F25 / F26) -->
      <div class="abonnements-cards-grid">
        <!-- Carte Gauche : Abonnements CATHEO Paroisses -->
        <div
          class="abo-overview-card"
          [class.is-selected]="activeSection() === 'paroisses'"
          (click)="setSection('paroisses')"
        >
          <div class="card-top">
            <div class="card-icon blue"><i class="bi bi-building"></i></div>
            <div class="card-titles">
              <h3 class="card-main-title">Abonnements Paroisses</h3>
              <span class="card-sub-title">Module Central CATHEO</span>
            </div>
            @if (activeSection() === 'paroisses') {
              <span class="active-indicator-badge">Actif</span>
            }
          </div>
          <div class="card-stats-row">
            <div class="stat-pill green">
              <span class="pill-number">{{ paroisseStats().actifs }}</span>
              <span class="pill-text">Actifs</span>
            </div>
            <div class="stat-pill amber">
              <span class="pill-number">{{ paroisseStats().attente }}</span>
              <span class="pill-text">En attente</span>
            </div>
            <div class="stat-pill red">
              <span class="pill-number">{{ paroisseStats().suspendus }}</span>
              <span class="pill-text">Suspendus</span>
            </div>
          </div>
        </div>

        <!-- Carte Droite : Abonnements Organisations -->
        <div
          class="abo-overview-card"
          [class.is-selected]="activeSection() === 'organisations'"
          (click)="setSection('organisations')"
        >
          <div class="card-top">
            <div class="card-icon purple"><i class="bi bi-diagram-3"></i></div>
            <div class="card-titles">
              <h3 class="card-main-title">Abonnements Organisations</h3>
              <span class="card-sub-title">Modules OPPE, OPPJ et OPPA</span>
            </div>
            @if (activeSection() === 'organisations') {
              <span class="active-indicator-badge">Actif</span>
            }
          </div>
          <div class="card-stats-row">
            <div class="stat-pill oppe">
              <span class="pill-number">{{ orgStats().oppe }}</span>
              <span class="pill-text">OPPE Enfants</span>
            </div>
            <div class="stat-pill oppj">
              <span class="pill-number">{{ orgStats().oppj }}</span>
              <span class="pill-text">OPPJ Jeunes</span>
            </div>
            <div class="stat-pill oppa">
              <span class="pill-number">{{ orgStats().oppa }}</span>
              <span class="pill-text">OPPA Adultes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sélecteur d'onglets de vue -->
      <div class="section-tabs-bar">
        <button
          type="button"
          class="section-tab-btn"
          [class.is-active]="activeSection() === 'paroisses'"
          (click)="setSection('paroisses')"
        >
          <i class="bi bi-building me-1"></i>
          <span>Paroisses (CATHEO)</span>
        </button>

        <button
          type="button"
          class="section-tab-btn"
          [class.is-active]="activeSection() === 'organisations'"
          (click)="setSection('organisations')"
        >
          <i class="bi bi-diagram-3 me-1"></i>
          <span>Organisations (OPPE / OPPJ / OPPA)</span>
        </button>
      </div>

      <!-- Barre de filtres réels -->
      <app-filter-bar
        [searchPlaceholder]="'Filtrer les abonnements...'"
        [hasActiveFilters]="hasActiveFilters()"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          @if (activeSection() === 'paroisses') {
            <!-- Filtre Paroisse -->
            <select
              [value]="filterParoisseId()"
              (change)="onParoisseFilterChange($event)"
              class="filter-select"
              aria-label="Filtrer par paroisse"
            >
              <option value="">Toutes les paroisses</option>
              @for (p of paroissesList(); track p.id) {
                <option [value]="p.id">{{ p.nom_paroisse }} ({{ p.code_paroisse }})</option>
              }
            </select>
          } @else {
            <!-- Filtre Produit Organisation -->
            <select
              [value]="filterProduitId()"
              (change)="onProduitFilterChange($event)"
              class="filter-select"
              aria-label="Filtrer par module organisation"
            >
              <option value="">Tous les modules (OPPE, OPPJ, OPPA)</option>
              <option value="OPPE">OPPE · Office Paroissial de la Pastorale des Enfants</option>
              <option value="OPPJ">OPPJ · Office Paroissial de la Pastorale des Jeunes</option>
              <option value="OPPA">OPPA · Office Paroissial de la Pastorale des Adultes</option>
            </select>
          }

          <!-- Filtre Statut -->
          <select
            [value]="filterStatut()"
            (change)="onStatutFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par statut"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="en_attente">En attente</option>
            <option value="suspendu">Suspendu</option>
            <option value="expire">Expiré</option>
            <option value="resilie">Résilié</option>
          </select>

          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="refresh()"
            [loading]="loading()"
            title="Rafraîchir les données"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-filter-bar>


      <!-- Erreur API -->
      @if (hasError()) {
        <app-error-state
          title="Impossible de charger les abonnements"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des abonnements -->
        <app-table
          [columns]="columns"
          [data]="abonnements()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucun abonnement trouvé"
          emptySubtitle="Aucun contrat d'abonnement ne correspond à vos critères de sélection."
        />

        <!-- Pagination -->
        @if (paginationMeta().total > 0) {
          <app-pagination
            [currentPage]="paginationMeta().currentPage"
            [perPage]="paginationMeta().perPage"
            [total]="paginationMeta().total"
            (pageChange)="onPageChange($event)"
          />
        }
      }

      <!-- Actions par ligne -->
      <ng-template #rowActionsTpl let-abo>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-icon-btn action-view"
            (click)="navigateToDetail(abo.id)"
            title="Consulter le contrat et les échéances"
            aria-label="Détails de l'abonnement"
          >
            <i class="bi bi-eye"></i>
          </button>

          @if (abo.statut === 'en_attente' || abo.statut === 'suspendu') {
            <button
              type="button"
              class="action-icon-btn action-activate"
              (click)="promptStatusChange(abo, 'actif')"
              title="Activer l'abonnement"
              aria-label="Activer l'abonnement"
            >
              <i class="bi bi-check-circle"></i>
            </button>
          }

          @if (abo.statut === 'actif') {
            <button
              type="button"
              class="action-icon-btn action-suspend"
              (click)="promptStatusChange(abo, 'suspendu')"
              title="Suspendre l'abonnement"
              aria-label="Suspendre l'abonnement"
            >
              <i class="bi bi-pause-circle"></i>
            </button>
          }

          @if (abo.statut !== 'resilie') {
            <button
              type="button"
              class="action-icon-btn action-resilier"
              (click)="openResiliationModal(abo)"
              title="Résilier l'abonnement"
              aria-label="Résilier l'abonnement"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          }
        </div>
      </ng-template>

      <!-- Dialogue de confirmation de changement de statut -->
      <app-confirm-dialog
        [isOpen]="confirmDialogOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [variant]="confirmVariant()"
        [confirmText]="confirmActionLabel()"
        [loading]="actionLoading()"
        (confirmed)="executeStatusChange()"
        (cancelled)="closeConfirmDialog()"
      />

      <!-- Modal de Résiliation -->
      <app-modal
        [isOpen]="resiliationModalOpen()"
        title="Résilier un abonnement"
        (close)="closeResiliationModal()"
      >
        <div class="resiliation-modal-content">
          <p class="modal-intro">
            Vous êtes sur le point de résilier l'abonnement <strong>{{ targetAbo?.reference }}</strong> de la paroisse <strong>{{ targetAbo?.paroisse_nom }}</strong>.
          </p>

          <div class="field-group">
            <label class="field-label required">Motif de la résiliation</label>
            <textarea
              [(ngModel)]="motifResiliation"
              rows="3"
              class="form-textarea"
              placeholder="Veuillez spécifier la raison administrative ou contractuelle de cette résiliation (obligatoire)..."
            ></textarea>
            @if (resiliationError()) {
              <span class="field-error">{{ resiliationError() }}</span>
            }
          </div>

          <div class="field-group">
            <label class="field-label">Date d'effet (optionnel)</label>
            <input
              type="date"
              [(ngModel)]="dateResiliation"
              class="form-input"
            />
          </div>
        </div>

        <div modal-footer class="modal-footer-actions">
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            [disabled]="actionLoading()"
            (btnClick)="closeResiliationModal()"
          >
            Annuler
          </app-btn>

          <app-btn
            [variant]="'danger'"
            [size]="'md'"
            [loading]="actionLoading()"
            (btnClick)="executeResiliation()"
          >
            <i class="bi bi-x-circle"></i>
            <span>Confirmer la résiliation</span>
          </app-btn>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .filter-select {
      height: 36px;
      padding: 0 0.75rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      cursor: pointer;
    }
    .filter-select:focus {
      border-color: var(--primary-600, #0284c7);
    }
    .row-actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
    }
    .action-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
      background-color: var(--bg-surface, #ffffff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      color: var(--text-secondary, #475569);
    }
    .action-icon-btn:hover {
      background-color: var(--neutral-100, #f1f5f9);
    }
    .action-view:hover {
      color: var(--primary-600, #0284c7);
      border-color: var(--primary-300, #93c5fd);
    }
    .action-activate:hover {
      color: var(--success-600, #059669);
      border-color: var(--success-300, #6ee7b7);
    }
    .action-suspend:hover {
      color: var(--warning-600, #d97706);
      border-color: var(--warning-300, #fcd34d);
    }
    .action-resilier:hover {
      color: var(--danger-600, #dc2626);
      border-color: var(--danger-300, #fca5a5);
    }
    /* Modal styles */
    .resiliation-modal-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-intro {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
      margin: 0;
      line-height: 1.5;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
    }
    .field-label.required::after {
      content: ' *';
      color: var(--danger-600, #dc2626);
    }
    .form-textarea,
    .form-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-textarea:focus,
    .form-input:focus {
      border-color: var(--primary-600, #0284c7);
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      font-weight: 500;
    }
    .abonnements-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 0.5rem;
    }
    .abo-overview-card {
      background: var(--bg-surface, #ffffff);
      border: 2px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .abo-overview-card:hover {
      border-color: var(--primary-400, #38bdf8);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .abo-overview-card.is-selected {
      border-color: var(--primary-600, #0284c7);
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
      box-shadow: 0 0 0 1px var(--primary-600, #0284c7), 0 4px 12px rgba(2, 132, 199, 0.1);
    }
    .card-top {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .card-icon.blue {
      background: rgba(2, 132, 199, 0.1);
      color: #0284c7;
    }
    .card-icon.purple {
      background: rgba(147, 51, 234, 0.1);
      color: #9333ea;
    }
    .card-titles {
      flex: 1;
      min-width: 0;
    }
    .card-main-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .card-sub-title {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .active-indicator-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: #0284c7;
      color: #ffffff;
    }
    .card-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
    }
    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.625rem 0.5rem;
      border-radius: var(--radius-md, 8px);
      text-align: center;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .stat-pill.green {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }
    .stat-pill.amber {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }
    .stat-pill.red {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .stat-pill.oppe {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }
    .stat-pill.oppj {
      background: #fdf4ff;
      border-color: #f5d0fe;
      color: #86198f;
    }
    .stat-pill.oppa {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .pill-number {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .pill-text {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-top: 0.15rem;
    }
    .section-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.5rem;
    }
    .section-tab-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      background: transparent;
      border: none;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      transition: all 150ms ease;
    }
    .section-tab-btn:hover {
      color: var(--text-primary, #0f172a);
      background: var(--neutral-100, #f1f5f9);
    }
    .section-tab-btn.is-active {
      color: var(--primary-600, #0284c7);
      background: rgba(2, 132, 199, 0.08);
    }
    .modal-footer-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbonnementsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly abonnementService = inject(AbonnementService);
  private readonly paroisseService = inject(ParoisseService);
  private readonly produitService = inject(ProduitService);
  private readonly toast = inject(ToastService);

  public readonly rowActionsTpl = viewChild<TemplateRef<any>>('rowActionsTpl');

  // Active section (Paroisses vs Organisations)
  protected readonly activeSection = signal<'paroisses' | 'organisations'>('paroisses');
  protected readonly paroisseStats = signal<{ actifs: number; attente: number; suspendus: number }>({
    actifs: 0,
    attente: 0,
    suspendus: 0,
  });
  protected readonly orgStats = signal<{ oppe: number; oppj: number; oppa: number }>({
    oppe: 0,
    oppj: 0,
    oppa: 0,
  });

  // State signals
  protected readonly abonnements = signal<Abonnement[]>([]);
  protected readonly paroissesList = signal<Paroisse[]>([]);
  protected readonly produitsList = signal<Produit[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Filters
  protected readonly filterParoisseId = signal<string>('');
  protected readonly filterProduitId = signal<string>('');
  protected readonly filterStatut = signal<AbonnementStatut | 'tous'>('tous');

  // Pagination
  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // Status Change Dialog
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private targetStatus: AbonnementStatut = 'actif';

  // Resiliation Modal
  protected readonly resiliationModalOpen = signal<boolean>(false);
  protected readonly resiliationError = signal<string>('');
  protected motifResiliation = '';
  protected dateResiliation = '';
  protected targetAbo: Abonnement | null = null;

  public get columns(): TableColumn<Abonnement>[] {
    if (this.activeSection() === 'organisations') {
      return [
        {
          key: 'reference',
          label: 'Référence',
          sortable: true,
          width: '130px',
          formatter: (val) => String(val || '—'),
        },
        {
          key: 'organisation_nom',
          label: 'Organisation',
          sortable: true,
          formatter: (val, row) => (val ? String(val) : (row.paroisse_nom ? `Org (${row.paroisse_nom})` : '—')),
        },
        {
          key: 'produit_nom',
          label: 'Module & Formule',
          formatter: (val, row) => `${val || row.produit_code || '—'} — ${row.formule_nom}`,
        },
        {
          key: 'montant',
          label: 'Montant',
          width: '140px',
          formatter: (val, row) => {
            const montantNum = Number(val) || 0;
            return montantNum === 0
              ? 'Gratuit'
              : `${montantNum.toLocaleString('fr-FR')} ${row.devise || 'XOF'}`;
          },
        },
        {
          key: 'date_debut',
          label: 'Période',
          width: '190px',
          formatter: (val, row) => {
            const fin = row.date_fin || 'Indéfinie';
            return `${val} au ${fin}`;
          },
        },
        {
          key: 'statut',
          label: 'Statut',
          width: '120px',
          formatter: (val) => {
            switch (val) {
              case 'actif':
                return '● Actif';
              case 'en_attente':
                return '● En attente';
              case 'suspendu':
                return '● Suspendu';
              case 'expire':
                return '● Expiré';
              case 'resilie':
                return '● Résilié';
              default:
                return String(val || '—');
            }
          },
        },
      ];
    }

    return [
      {
        key: 'reference',
        label: 'Référence',
        sortable: true,
        width: '130px',
        formatter: (val) => String(val || '—'),
      },
      {
        key: 'paroisse_nom',
        label: 'Paroisse',
        sortable: true,
        formatter: (val, row) =>
          row.paroisse_code ? `${val} (${row.paroisse_code})` : String(val),
      },
      {
        key: 'produit_nom',
        label: 'Produit & Formule',
        formatter: (val, row) => `${val} — ${row.formule_nom}`,
      },
      {
        key: 'montant',
        label: 'Montant',
        width: '140px',
        formatter: (val, row) => {
          const montantNum = Number(val) || 0;
          return montantNum === 0
            ? 'Gratuit'
            : `${montantNum.toLocaleString('fr-FR')} ${row.devise || 'XOF'}`;
        },
      },
      {
        key: 'date_debut',
        label: 'Période',
        width: '190px',
        formatter: (val, row) => {
          const fin = row.date_fin || 'Indéfinie';
          return `${val} au ${fin}`;
        },
      },
      {
        key: 'statut',
        label: 'Statut',
        width: '120px',
        formatter: (val) => {
          switch (val) {
            case 'actif':
              return '● Actif';
            case 'en_attente':
              return '● En attente';
            case 'suspendu':
              return '● Suspendu';
            case 'expire':
              return '● Expiré';
            case 'resilie':
              return '● Résilié';
            default:
              return String(val || '—');
          }
        },
      },
    ];
  }

  public ngOnInit(): void {
    this.loadFilterOptions();
    this.loadOverviewStats();
    this.refresh();
  }

  protected setSection(section: 'paroisses' | 'organisations'): void {
    if (this.activeSection() === section) return;
    this.activeSection.set(section);
    this.filterParoisseId.set('');
    this.filterProduitId.set('');
    this.filterStatut.set('tous');
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  private loadOverviewStats(): void {
    // Stat syntheses for Paroisses
    this.abonnementService.getAbonnementsParoisses({ per_page: 100 }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.paroisseStats.set({
          actifs: list.filter((a) => a.statut === 'actif').length,
          attente: list.filter((a) => a.statut === 'en_attente').length,
          suspendus: list.filter((a) => a.statut === 'suspendu').length,
        });
      },
      error: () => {},
    });

    // Stat syntheses for Organisations
    this.abonnementService.getAbonnementsOrganisations({ per_page: 100 }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.orgStats.set({
          oppe: list.filter((a) => a.produit_code === 'OPPE' || a.produit_nom?.includes('OPPE')).length,
          oppj: list.filter((a) => a.produit_code === 'OPPJ' || a.produit_nom?.includes('OPPJ')).length,
          oppa: list.filter((a) => a.produit_code === 'OPPA' || a.produit_nom?.includes('OPPA')).length,
        });
      },
      error: () => {},
    });
  }

  private loadFilterOptions(): void {
    this.paroisseService.getParoisses({ per_page: 100 }).subscribe({
      next: (res) => this.paroissesList.set(res.data),
      error: () => {},
    });

    this.produitService.getProduits({ all: true }).subscribe({
      next: (res) => this.produitsList.set(res.data),
      error: () => {},
    });
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const params: AbonnementFilterParams = {
      paroisse_id: this.filterParoisseId() || undefined,
      produit_id: this.filterProduitId() || undefined,
      statut: this.filterStatut() !== 'tous' ? this.filterStatut() : undefined,
      page: this.paginationMeta().currentPage,
      per_page: this.paginationMeta().perPage,
    };

    const fetch$ =
      this.activeSection() === 'organisations'
        ? this.abonnementService.getAbonnementsOrganisations(params)
        : this.abonnementService.getAbonnementsParoisses(params);

    fetch$.subscribe({
      next: (res) => {
        this.abonnements.set(res.data);
        this.paginationMeta.set({
          currentPage: res.meta.current_page,
          perPage: res.meta.per_page,
          total: res.meta.total,
          lastPage: res.meta.last_page,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors de la récupération des abonnements.'
        );
        this.loading.set(false);
      },
    });
  }

  protected hasActiveFilters(): boolean {
    return (
      this.filterParoisseId() !== '' ||
      this.filterProduitId() !== '' ||
      this.filterStatut() !== 'tous'
    );
  }

  protected onParoisseFilterChange(event: Event): void {
    this.filterParoisseId.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onProduitFilterChange(event: Event): void {
    this.filterProduitId.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onStatutFilterChange(event: Event): void {
    this.filterStatut.set(
      (event.target as HTMLSelectElement).value as AbonnementStatut | 'tous'
    );
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.filterParoisseId.set('');
    this.filterProduitId.set('');
    this.filterStatut.set('tous');
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onPageChange(event: PageChangeEvent): void {
    this.paginationMeta.update((m) => ({
      ...m,
      currentPage: event.page,
      perPage: event.perPage,
    }));
    this.refresh();
  }

  public navigateToCreate(): void {
    this.router.navigate(['/super-admin/abonnements/nouveau']);
  }

  public navigateToDetail(id: string | number): void {
    this.router.navigate(['/super-admin/abonnements', id]);
  }

  protected promptStatusChange(abo: Abonnement, newStatus: AbonnementStatut): void {
    this.targetAbo = abo;
    this.targetStatus = newStatus;

    if (newStatus === 'actif') {
      this.confirmTitle.set('Activer l’abonnement');
      this.confirmMessage.set(
        `Voulez-vous activer le contrat ${abo.reference} pour la paroisse ${abo.paroisse_nom} ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    } else if (newStatus === 'suspendu') {
      this.confirmTitle.set('Suspendre l’abonnement');
      this.confirmMessage.set(
        `Êtes-vous sûr de vouloir suspendre le contrat ${abo.reference} (${abo.paroisse_nom}) ?`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Suspendre');
    }

    this.confirmDialogOpen.set(true);
  }

  protected executeStatusChange(): void {
    if (!this.targetAbo) return;

    this.actionLoading.set(true);
    this.abonnementService
      .changerStatut(this.targetAbo.id, { statut: this.targetStatus })
      .subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success(
            'Statut mis à jour',
            `Le contrat ${updated.reference} est désormais [${updated.statut}].`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors de la mise à jour du statut.'
          );
        },
      });
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
  }

  // Resiliation Modal Handlers
  protected openResiliationModal(abo: Abonnement): void {
    this.targetAbo = abo;
    this.motifResiliation = '';
    this.dateResiliation = new Date().toISOString().substring(0, 10);
    this.resiliationError.set('');
    this.resiliationModalOpen.set(true);
  }

  protected closeResiliationModal(): void {
    this.resiliationModalOpen.set(false);
    this.targetAbo = null;
  }

  protected executeResiliation(): void {
    if (!this.targetAbo) return;

    if (!this.motifResiliation || this.motifResiliation.trim().length === 0) {
      this.resiliationError.set('Le motif de la résiliation est obligatoire.');
      return;
    }

    this.actionLoading.set(true);
    this.resiliationError.set('');

    this.abonnementService
      .resilier(this.targetAbo.id, {
        motif_resiliation: this.motifResiliation.trim(),
        date_resiliation: this.dateResiliation || null,
      })
      .subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          this.resiliationModalOpen.set(false);
          this.toast.success(
            'Résiliation effectuée',
            `L'abonnement ${res.reference} a été résilié avec succès.`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors de la résiliation de l’abonnement.'
          );
        },
      });
  }
}
