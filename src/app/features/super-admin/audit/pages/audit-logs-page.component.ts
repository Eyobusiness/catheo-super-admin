import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { AuditService } from '../services/audit.service';
import { AuditActionType, AuditFilters, AuditLog } from '../models/audit.model';
import { AuditDetailModalComponent } from '../components/audit-detail-modal/audit-detail-modal.component';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    TableComponent,
    ButtonComponent,
    FilterBarComponent,
    PaginationComponent,
    ErrorStateComponent,
    AuditDetailModalComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Journal d'Activité & Piste d'Audit"
        subtitle="Historique immuable des événements, créations, modifications, restaurations et suppressions"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Journal d’activité' }
        ]"
      >
        <div page-actions class="header-actions">
          <!-- Toggle Mode Affichage (Tableau / Timeline) -->
          <div class="view-toggle-group">
            <button
              type="button"
              class="view-toggle-btn"
              [class.is-active]="viewMode() === 'tableau'"
              (click)="viewMode.set('tableau')"
              title="Vue Tableau"
            >
              <i class="bi bi-table me-1"></i>
              <span>Tableau</span>
            </button>
            <button
              type="button"
              class="view-toggle-btn"
              [class.is-active]="viewMode() === 'timeline'"
              (click)="viewMode.set('timeline')"
              title="Vue Timeline"
            >
              <i class="bi bi-clock-history me-1"></i>
              <span>Timeline</span>
            </button>
          </div>

          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="refresh()"
            [loading]="loading()"
            title="Rafraîchir les événements d'audit"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de Filtres & Recherche Instantanée -->
      <app-filter-bar
        [searchPlaceholder]="'Recherche instantanée (action, entité, utilisateur)...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearchChange($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <!-- Filtre Action -->
          <select
            [value]="filterAction()"
            (change)="onActionFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par action"
          >
            <option value="tous">Toutes les actions</option>
            <option value="create">Création (create)</option>
            <option value="update">Modification (update)</option>
            <option value="delete">Suppression (delete)</option>
            <option value="restore">Restauration (restore)</option>
            <option value="force_delete">Suppression définitive</option>
            <option value="login">Connexion</option>
            <option value="logout">Déconnexion</option>
          </select>

          <!-- Filtre Module -->
          <select
            [value]="filterModule()"
            (change)="onModuleFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par module"
          >
            <option value="tous">Tous les modules</option>
            <option value="Paroisse">Paroisse</option>
            <option value="Organisation">Organisation</option>
            <option value="User">Utilisateur</option>
            <option value="Abonnement">Abonnement</option>
            <option value="Formule">Formule</option>
            <option value="Produit">Produit</option>
            <option value="Corbeille">Corbeille</option>
          </select>

          <!-- Filtre Période -->
          <select
            [value]="filterPeriode()"
            (change)="onPeriodeChange($event)"
            class="filter-select"
            aria-label="Filtrer par période"
          >
            <option value="toutes">Toutes les dates</option>
            <option value="24h">Dernières 24 heures</option>
            <option value="7j">7 derniers jours</option>
            <option value="30j">30 derniers jours</option>
          </select>
        </div>
      </app-filter-bar>

      <!-- Erreur API -->
      @if (hasError()) {
        <app-error-state
          title="Impossible de charger le journal d'audit"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Vue 1 : Tableau -->
        @if (viewMode() === 'tableau') {
          <app-table
            [columns]="columns"
            [data]="logs()"
            [loading]="loading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun événement d'audit consigné"
            emptySubtitle="Aucune trace d'activité ne correspond aux critères sélectionnés."
          />
        }

        <!-- Vue 2 : Timeline interactive -->
        @if (viewMode() === 'timeline') {
          <div class="audit-timeline-container">
            @for (log of logs(); track log.id) {
              <div class="timeline-row">
                <div class="timeline-marker-col">
                  <div [class]="'timeline-badge ' + getActionClass(log.action)">
                    <i [class]="getActionIcon(log.action)"></i>
                  </div>
                  <div class="timeline-vertical-line"></div>
                </div>

                <div class="timeline-card" (click)="openDetailModal(log)">
                  <div class="timeline-card-header">
                    <div class="card-action-title">
                      <span [class]="'badge-action ' + getActionClass(log.action)">
                        {{ getActionLabel(log.action) }}
                      </span>
                      <strong class="entity-title">{{ log.entite_type }} ({{ log.module || 'Système' }})</strong>
                    </div>
                    <span class="timeline-timestamp">{{ formatDate(log.created_at) }}</span>
                  </div>

                  <div class="timeline-card-meta">
                    <span class="meta-actor">
                      <i class="bi bi-person-circle me-1"></i>
                      {{ log.user?.name || 'Système / Automatique' }}
                    </span>
                    @if (log.ip_address) {
                      <span class="meta-ip">IP: {{ log.ip_address }}</span>
                    }
                  </div>

                  @if (log.anciennes_valeurs || log.nouvelles_valeurs) {
                    <div class="changes-hint">
                      <i class="bi bi-file-diff me-1"></i>
                      <span>Valeurs modifiées enregistrées (cliquer pour voir le diff)</span>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-timeline">
                <i class="bi bi-clock-history"></i>
                <p>Aucun événement consigné pour cette sélection.</p>
              </div>
            }
          </div>
        }

        <!-- Pagination -->
        @if (totalItems() > 0) {
          <app-pagination
            [currentPage]="currentPage()"
            [perPage]="perPage()"
            [total]="totalItems()"
            (pageChange)="onPageChange($event)"
          />
        }
      }

      <!-- Actions par ligne -->
      <ng-template #rowActionsTpl let-log>
        <div class="table-actions">
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="openDetailModal(log)"
            title="Consulter les détails et valeurs modifiées"
          >
            <i class="bi bi-eye me-1"></i>
            <span>Détail</span>
          </app-btn>
        </div>
      </ng-template>

      <!-- Modale de détail d'un log avec sanitization -->
      <app-audit-detail-modal
        [isOpen]="isDetailModalOpen()"
        [log]="selectedLog()"
        (close)="closeDetailModal()"
      />
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .view-toggle-group {
      display: inline-flex;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-sm, 6px);
      overflow: hidden;
      background: var(--neutral-100, #f1f5f9);
    }
    .view-toggle-btn {
      padding: 0.35rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary, #64748b);
      background: transparent;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all var(--transition-fast, 150ms ease);
    }
    .view-toggle-btn.is-active {
      background: var(--bg-surface, #ffffff);
      color: var(--primary-700, #0369a1);
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
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
    .table-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.375rem;
    }
    /* Timeline View styles */
    .audit-timeline-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    .timeline-row {
      display: flex;
      gap: 1rem;
    }
    .timeline-marker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 36px;
      flex-shrink: 0;
    }
    .timeline-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      z-index: 2;
    }
    .timeline-badge.create { background: #dcfce7; color: #15803d; border: 2px solid #86efac; }
    .timeline-badge.update { background: #dbeafe; color: #1d4ed8; border: 2px solid #93c5fd; }
    .timeline-badge.restore { background: #f3e8ff; color: #7e22ce; border: 2px solid #d8b4fe; }
    .timeline-badge.delete,
    .timeline-badge.force_delete { background: #fee2e2; color: #b91c1c; border: 2px solid #fca5a5; }
    .timeline-badge.default { background: #f1f5f9; color: #475569; border: 2px solid #cbd5e1; }
    .timeline-vertical-line {
      flex: 1;
      width: 2px;
      background: var(--border-color, #e2e8f0);
      margin: 0.25rem 0;
      min-height: 28px;
    }
    .timeline-row:last-child .timeline-vertical-line {
      display: none;
    }
    .timeline-card {
      flex: 1;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 0.875rem 1.125rem;
      margin-bottom: 0.75rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all var(--transition-fast, 150ms ease);
    }
    .timeline-card:hover {
      border-color: var(--primary-400, #38bdf8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .timeline-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .card-action-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge-action {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .badge-action.create { background: #ecfdf5; color: #065f46; }
    .badge-action.update { background: #eff6ff; color: #1e40af; }
    .badge-action.restore { background: #fdf4ff; color: #86198f; }
    .badge-action.delete,
    .badge-action.force_delete { background: #fef2f2; color: #991b1b; }
    .badge-action.default { background: #f1f5f9; color: #475569; }
    .entity-title {
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
    }
    .timeline-timestamp {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }
    .timeline-card-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .changes-hint {
      font-size: 0.75rem;
      color: var(--primary-600, #0284c7);
      background: rgba(2, 132, 199, 0.05);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      width: fit-content;
    }
    .empty-timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-muted, #94a3b8);
      font-size: 0.9375rem;
      gap: 0.5rem;
    }
    .empty-timeline i {
      font-size: 2.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsPageComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  // View mode (tableau vs timeline)
  protected readonly viewMode = signal<'tableau' | 'timeline'>('tableau');

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly perPage = signal<number>(25);
  protected readonly totalItems = signal<number>(0);

  // Filtres
  protected readonly filterAction = signal<AuditActionType | 'tous'>('tous');
  protected readonly filterModule = signal<string>('tous');
  protected readonly filterPeriode = signal<string>('toutes');
  protected readonly searchTerm = signal<string>('');

  // Modale détail
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly selectedLog = signal<AuditLog | null>(null);

  protected readonly hasActiveFilters = computed<boolean>(() => {
    return (
      this.filterAction() !== 'tous' ||
      this.filterModule() !== 'tous' ||
      this.filterPeriode() !== 'toutes' ||
      this.searchTerm() !== ''
    );
  });

  protected readonly columns: TableColumn<AuditLog>[] = [
    {
      key: 'created_at',
      label: 'Date & Heure',
      sortable: true,
      width: '170px',
      formatter: (v) => this.formatDate(v),
    },
    {
      key: 'user',
      label: 'Auteur',
      width: '180px',
      formatter: (_, row) => row.user?.name || 'Système / Automatique',
    },
    {
      key: 'action',
      label: 'Action',
      width: '130px',
      align: 'center',
      formatter: (v) => this.getActionLabel(v),
    },
    {
      key: 'entite_type',
      label: 'Entité / Ressource',
      width: '170px',
      formatter: (v, row) => (row.entite_id ? `${v} #${row.entite_id}` : v || '-'),
    },
    {
      key: 'ip_address',
      label: 'Adresse IP',
      width: '130px',
      formatter: (v) => v || 'N/A',
    },
  ];

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const filters: AuditFilters = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchTerm() || undefined,
      module: this.filterModule() !== 'tous' ? this.filterModule() : undefined,
      periode: this.filterPeriode() !== 'toutes' ? this.filterPeriode() : undefined,
    };

    if (this.filterAction() !== 'tous') {
      filters.action = this.filterAction() as AuditActionType;
    }

    this.auditService.getAuditLogs(filters).subscribe({
      next: (res) => {
        this.logs.set(res.data);
        this.totalItems.set(res.meta.total);
        this.currentPage.set(res.meta.current_page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.hasError.set(true);
        if (err.status === 403) {
          this.errorMessage.set('Accès non autorisé au journal d’audit.');
        } else {
          this.errorMessage.set(
            err.error?.message ||
              'Une erreur est survenue lors de la récupération des traces d’audit.'
          );
        }
      },
    });
  }

  public onSearchChange(search: string): void {
    this.searchTerm.set(search);
    this.currentPage.set(1);
    this.refresh();
  }

  public onActionFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterAction.set(select.value as AuditActionType | 'tous');
    this.currentPage.set(1);
    this.refresh();
  }

  public onModuleFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterModule.set(select.value);
    this.currentPage.set(1);
    this.refresh();
  }

  public onPeriodeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterPeriode.set(select.value);
    this.currentPage.set(1);
    this.refresh();
  }

  public onResetFilters(): void {
    this.filterAction.set('tous');
    this.filterModule.set('tous');
    this.filterPeriode.set('toutes');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.refresh();
  }

  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.refresh();
  }

  public openDetailModal(log: AuditLog): void {
    this.selectedLog.set(log);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedLog.set(null);
  }

  protected getActionClass(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'create';
      case 'update':
        return 'update';
      case 'restore':
        return 'restore';
      case 'delete':
      case 'force_delete':
        return 'delete';
      default:
        return 'default';
    }
  }

  protected getActionIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'bi bi-plus-lg';
      case 'update':
        return 'bi bi-pencil';
      case 'restore':
        return 'bi bi-arrow-counterclockwise';
      case 'delete':
      case 'force_delete':
        return 'bi bi-trash';
      case 'login':
        return 'bi bi-box-arrow-in-right';
      case 'logout':
        return 'bi bi-box-arrow-right';
      default:
        return 'bi bi-record-circle';
    }
  }

  protected getActionLabel(v: string): string {
    switch (v) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      case 'restore':
        return 'Restauration';
      case 'force_delete':
        return 'Suppression définitive';
      case 'login':
        return 'Connexion';
      case 'logout':
        return 'Déconnexion';
      case 'export':
        return 'Export';
      default:
        return String(v || '-');
    }
  }

  protected formatDate(v: string | null | undefined): string {
    if (!v) return '-';
    try {
      const d = new Date(v);
      return isNaN(d.getTime())
        ? String(v)
        : `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`;
    } catch {
      return String(v);
    }
  }
}
