import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../../shared/models/table.model';
import { PageChangeEvent, PaginationState } from '../../../../../shared/models/pagination.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { TrashService } from '../../services/trash.service';
import { TrashDetail, TrashItem } from '../../models/trash.model';

@Component({
  selector: 'app-trash-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    TableComponent,
    ButtonComponent,
    FilterBarComponent,
    PaginationComponent,
    ModalComponent,
    ConfirmDialogComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Audit des Suppressions & Corbeille"
        subtitle="Supervision centrale des entités supprimées (Soft Delete), aperçu des dépendances et restauration"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Corbeille' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="refresh()"
            [loading]="loading()"
            title="Rafraîchir la corbeille"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de filtres -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher dans la corbeille...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearchChange($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <select
            [value]="filterModule()"
            (change)="onModuleChange($event)"
            class="filter-select"
            aria-label="Filtrer par module"
          >
            <option value="">Tous les modules</option>
            <option value="Organisation">Organisation</option>
            <option value="Paroisse">Paroisse</option>
            <option value="Membre">Membre</option>
            <option value="Activite">Activité</option>
            <option value="InscriptionAnnuelle">Inscription Catéchèse</option>
          </select>
        </div>
      </app-filter-bar>

      <!-- Erreur API -->
      @if (hasError()) {
        <app-error-state
          title="Impossible de charger la corbeille"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des suppressions -->
        <app-table
          [columns]="columns"
          [data]="trashItems()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucun élément dans la corbeille"
          emptySubtitle="Toutes les entités supprimées ont été purgées ou restaurées."
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

      <!-- Actions de ligne -->
      <ng-template #rowActionsTpl let-item>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-icon-btn action-preview"
            (click)="openPreviewModal(item)"
            title="Aperçu des dépendances"
            aria-label="Aperçu"
          >
            <i class="bi bi-info-circle"></i>
          </button>

          <button
            type="button"
            class="action-icon-btn action-restore"
            (click)="promptRestore(item)"
            title="Restaurer l'élément"
            aria-label="Restaurer"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>

          <button
            type="button"
            class="action-icon-btn action-force-delete"
            (click)="promptForceDelete(item)"
            title="Suppression définitive protégée"
            aria-label="Supprimer définitivement"
          >
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </ng-template>

      <!-- Modal d'aperçu avant restauration -->
      <app-modal
        [isOpen]="previewModalOpen()"
        title="Aperçu de l'élément supprimé"
        (close)="closePreviewModal()"
      >
        @if (previewLoading()) {
          <div class="modal-loading">
            <i class="bi bi-arrow-repeat spin"></i>
            <span>Chargement des dépendances...</span>
          </div>
        } @else if (previewDetail()) {
          <div class="preview-content">
            <div class="detail-card">
              <div class="detail-item">
                <span class="detail-label">Élément / Nom</span>
                <span class="detail-value highlight">{{ previewDetail()?.nom || previewDetail()?.element || selectedItem?.element }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Module d'origine</span>
                <span class="badge-module">{{ previewDetail()?.module || selectedItem?.module }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Supprimé par</span>
                <span class="detail-value">{{ previewDetail()?.supprime_par || selectedItem?.supprime_par }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date de suppression</span>
                <span class="detail-value">{{ formatDate(previewDetail()?.date_suppression || selectedItem?.date_suppression) }}</span>
              </div>
            </div>

            <!-- Dépendances -->
            <div class="dependencies-section">
              <h4 class="dep-title">
                <i class="bi bi-diagram-2 me-1"></i>
                <span>Entités rattachées & dépendances</span>
              </h4>
              <div class="dep-grid">
                @for (entry of getDependancesEntries(); track entry.key) {
                  <div class="dep-pill">
                    <span class="dep-count">{{ entry.value }}</span>
                    <span class="dep-label">{{ entry.key }}</span>
                  </div>
                }
                @if (getDependancesEntries().length === 0) {
                  <span class="no-dep-text">Aucune dépendance active bloquante répertoriée.</span>
                }
              </div>
            </div>
          </div>
        }

        <div modal-footer class="modal-footer-actions">
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            (btnClick)="closePreviewModal()"
          >
            Fermer
          </app-btn>

          <app-btn
            [variant]="'danger'"
            [size]="'md'"
            [loading]="actionLoading()"
            (btnClick)="onPreviewForceDelete()"
          >
            <i class="bi bi-trash3"></i>
            <span>Supprimer définitivement</span>
          </app-btn>

          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            [loading]="actionLoading()"
            (btnClick)="onPreviewRestore()"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Restaurer</span>
          </app-btn>
        </div>
      </app-modal>

      <!-- Dialogue de Confirmation (Restauration & Suppression définitive) -->
      <app-confirm-dialog
        [isOpen]="confirmDialogOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [variant]="confirmVariant()"
        [confirmText]="confirmActionLabel()"
        [loading]="actionLoading()"
        (confirmed)="executeConfirmAction()"
        (cancelled)="closeConfirmDialog()"
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
    .action-preview:hover {
      color: var(--primary-600, #0284c7);
      border-color: var(--primary-300, #93c5fd);
    }
    .action-restore:hover {
      color: var(--success-600, #059669);
      border-color: var(--success-300, #6ee7b7);
    }
    .action-force-delete:hover {
      color: var(--danger-600, #dc2626);
      border-color: var(--danger-300, #fca5a5);
    }
    /* Modal styles */
    .preview-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .detail-card {
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .detail-label {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
    }
    .detail-value {
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      font-weight: 600;
      text-align: right;
    }
    .detail-value.highlight {
      color: var(--primary-700, #0369a1);
    }
    .badge-module {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm, 6px);
      background: rgba(2, 132, 199, 0.1);
      color: var(--primary-700, #0369a1);
    }
    .dependencies-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .dep-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .dep-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .dep-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.65rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-sm, 6px);
    }
    .dep-count {
      font-weight: 700;
      font-size: 0.875rem;
      color: #1d4ed8;
    }
    .dep-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #1e3a8a;
      text-transform: capitalize;
    }
    .no-dep-text {
      font-size: 0.8125rem;
      color: var(--text-muted, #94a3b8);
      font-style: italic;
    }
    .modal-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
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
export class TrashListPageComponent implements OnInit {
  private readonly trashService = inject(TrashService);
  private readonly toast = inject(ToastService);

  public readonly rowActionsTpl = viewChild<TemplateRef<any>>('rowActionsTpl');

  // State signals
  protected readonly trashItems = signal<TrashItem[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Filters
  protected readonly filterModule = signal<string>('');
  protected readonly searchTerm = signal<string>('');

  // Pagination
  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 25,
    total: 0,
    lastPage: 1,
  });

  // Preview Modal
  protected readonly previewModalOpen = signal<boolean>(false);
  protected readonly previewLoading = signal<boolean>(false);
  protected readonly previewDetail = signal<TrashDetail | null>(null);
  protected selectedItem: TrashItem | null = null;

  // Confirmation Dialog
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private confirmAction: 'restore' | 'force_delete' = 'restore';

  protected readonly columns: TableColumn<TrashItem>[] = [
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      width: '180px',
      formatter: (val) => String(val || '—'),
    },
    {
      key: 'element',
      label: 'Élément Supprimé',
      sortable: true,
      formatter: (val) => String(val || '—'),
    },
    {
      key: 'supprime_par',
      label: 'Supprimé par',
      formatter: (val) => String(val || 'Système / Anonyme'),
    },
    {
      key: 'date_suppression',
      label: 'Date de suppression',
      width: '180px',
      formatter: (val) => this.formatDate(val),
    },
  ];

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.trashService
      .getTrashItems({
        module: this.filterModule() || undefined,
        search: this.searchTerm() || undefined,
        page: this.paginationMeta().currentPage,
        per_page: this.paginationMeta().perPage,
      })
      .subscribe({
        next: (res) => {
          this.trashItems.set(res.data);
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
            err?.message || 'Erreur lors du chargement des éléments supprimés.'
          );
          this.loading.set(false);
        },
      });
  }

  protected hasActiveFilters(): boolean {
    return this.filterModule() !== '' || this.searchTerm() !== '';
  }

  protected onSearchChange(search: string): void {
    this.searchTerm.set(search);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onModuleChange(event: Event): void {
    this.filterModule.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.filterModule.set('');
    this.searchTerm.set('');
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

  // Preview Modal Handlers
  protected openPreviewModal(item: TrashItem): void {
    this.selectedItem = item;
    this.previewModalOpen.set(true);
    this.previewLoading.set(true);
    this.previewDetail.set(null);

    const targetUuid = item.uuid || item.id;
    this.trashService.getTrashDetail(targetUuid).subscribe({
      next: (detail) => {
        this.previewDetail.set(detail);
        this.previewLoading.set(false);
      },
      error: () => {
        // Fallback on item if detail endpoint doesn't have extra relations
        this.previewLoading.set(false);
      },
    });
  }

  protected closePreviewModal(): void {
    this.previewModalOpen.set(false);
    this.selectedItem = null;
    this.previewDetail.set(null);
  }

  protected getDependancesEntries(): { key: string; value: any }[] {
    const deps =
      this.previewDetail()?.dependances ||
      this.previewDetail()?.apercu_restauration?.dependances;
    if (!deps) return [];
    return Object.entries(deps).map(([key, value]) => ({ key, value }));
  }

  protected onPreviewRestore(): void {
    if (!this.selectedItem) return;
    this.closePreviewModal();
    this.promptRestore(this.selectedItem);
  }

  protected onPreviewForceDelete(): void {
    if (!this.selectedItem) return;
    this.closePreviewModal();
    this.promptForceDelete(this.selectedItem);
  }

  // Action Dialogs
  protected promptRestore(item: TrashItem): void {
    this.selectedItem = item;
    this.confirmAction = 'restore';
    this.confirmTitle.set('Restaurer l’élément');
    this.confirmMessage.set(
      `Voulez-vous restaurer [${item.element}] (${item.module}) ? L'entité sera réactivée dans son module d'origine.`
    );
    this.confirmVariant.set('info');
    this.confirmActionLabel.set('Restaurer');
    this.confirmDialogOpen.set(true);
  }

  protected promptForceDelete(item: TrashItem): void {
    this.selectedItem = item;
    this.confirmAction = 'force_delete';
    this.confirmTitle.set('Suppression définitive irréversible');
    this.confirmMessage.set(
      `ATTENTION : Vous êtes sur le point de supprimer DÉFINITIVEMENT [${item.element}] (${item.module}). Cette opération ne pourra pas être annulée. Si l'élément possède des dépendances actives, le système bloquera l'opération (code 422).`
    );
    this.confirmVariant.set('danger');
    this.confirmActionLabel.set('Supprimer définitivement');
    this.confirmDialogOpen.set(true);
  }

  protected executeConfirmAction(): void {
    if (!this.selectedItem) return;
    const targetUuid = this.selectedItem.uuid || this.selectedItem.id;
    this.actionLoading.set(true);

    if (this.confirmAction === 'restore') {
      this.trashService.restoreItem(targetUuid).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success(
            'Élément restauré',
            res?.message || `[${this.selectedItem?.element}] a été restauré avec succès.`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Erreur lors de la restauration',
            err?.message || 'Impossible de restaurer cet élément.'
          );
        },
      });
    } else {
      this.trashService.forceDeleteItem(targetUuid).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success(
            'Suppression définitive effectuée',
            res?.message || `L'élément a été définitivement supprimé.`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Suppression bloquée',
            err?.message || 'Impossible de supprimer définitivement cet élément car des dépendances sont toujours actives.'
          );
        },
      });
    }
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? String(dateStr)
        : d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return String(dateStr);
    }
  }
}
