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
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent, PaginationState } from '../../../../shared/models/pagination.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ParoisseService } from '../services/paroisse.service';
import {
  Paroisse,
  ParoisseFilterParams,
  ParoisseStatut,
} from '../models/paroisse.model';

@Component({
  selector: 'app-paroisses-list-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    TableComponent,
    ButtonComponent,
    FilterBarComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Paroisses"
        subtitle="Supervision et gestion des paroisses connectées à la plateforme CATHEO"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Paroisses' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToCreate()"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Nouvelle Paroisse</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de filtres & recherche -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher par nom, code, ville, diocèse...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearch($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <select
            [value]="filterStatut()"
            (change)="onStatutFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par statut"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="inactif">Inactif</option>
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
          title="Impossible de charger les paroisses"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des données -->
        <app-table
          [columns]="columns"
          [data]="paroisses()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucune paroisse trouvée"
          emptySubtitle="Aucune paroisse ne correspond à vos critères de recherche."
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

      <!-- Template des Actions par ligne -->
      <ng-template #rowActionsTpl let-paroisse>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-icon-btn action-view"
            (click)="navigateToDetail(paroisse.id)"
            title="Consulter la fiche complète"
            aria-label="Détails de la paroisse"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="action-icon-btn action-edit"
            (click)="navigateToEdit(paroisse.id)"
            title="Modifier la paroisse"
            aria-label="Modifier la paroisse"
          >
            <i class="bi bi-pencil"></i>
          </button>

          @if (paroisse.statut === 'actif') {
            <button
              type="button"
              class="action-icon-btn action-suspend"
              (click)="promptStatusChange(paroisse, 'suspendu')"
              title="Suspendre la paroisse"
              aria-label="Suspendre la paroisse"
            >
              <i class="bi bi-pause-circle"></i>
            </button>
          } @else {
            <button
              type="button"
              class="action-icon-btn action-activate"
              (click)="promptStatusChange(paroisse, 'actif')"
              title="Activer la paroisse"
              aria-label="Activer la paroisse"
            >
              <i class="bi bi-check-circle"></i>
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
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .filter-controls {
      display: flex;
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
    /* Actions Group */
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
      transition: all var(--transition-fast);
      color: var(--text-secondary, #475569);
    }
    .action-icon-btn:hover {
      background-color: var(--neutral-100, #f1f5f9);
    }
    .action-view:hover {
      color: var(--primary-600, #0284c7);
      border-color: var(--primary-300, #93c5fd);
    }
    .action-edit:hover {
      color: var(--info-600, #0284c7);
      border-color: var(--info-300, #7dd3fc);
    }
    .action-suspend:hover {
      color: var(--warning-600, #d97706);
      border-color: var(--warning-300, #fcd34d);
    }
    .action-activate:hover {
      color: var(--success-600, #059669);
      border-color: var(--success-300, #6ee7b7);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoissesListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  protected readonly paroisses = signal<Paroisse[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected readonly filterSearch = signal<string>('');
  protected readonly filterStatut = signal<string>('tous');

  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // Confirmation modal state
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private targetParoisse: Paroisse | null = null;
  private targetStatus: ParoisseStatut = 'actif';

  protected readonly columns: TableColumn<Paroisse>[] = [
    {
      key: 'code_paroisse',
      label: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'nom_paroisse',
      label: 'Paroisse',
      sortable: true,
      formatter: (val, row) =>
        row.commune ? `${val} (${row.commune})` : String(val),
    },
    {
      key: 'diocese',
      label: 'Diocèse & Ville',
      sortable: true,
      formatter: (val, row) =>
        row.ville ? `${val} • ${row.ville}` : String(val),
    },
    {
      key: 'total_abonnements',
      label: 'Abonnements',
      width: '130px',
      formatter: (val, row) => {
        const count = val || 0;
        const activeModules = row.produits_souscrits?.length || 0;
        return `${count} souscription(s) • ${activeModules} actif(s)`;
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
          case 'suspendu':
            return '● Suspendu';
          case 'inactif':
            return '● Inactif';
          default:
            return String(val || '-');
        }
      },
    },
  ];

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const params: ParoisseFilterParams = {
      page: this.paginationMeta().currentPage,
      per_page: this.paginationMeta().perPage,
    };

    if (this.filterSearch()) {
      params.search = this.filterSearch();
    }
    if (this.filterStatut() && this.filterStatut() !== 'tous') {
      params.statut = this.filterStatut() as ParoisseStatut;
    }

    this.paroisseService.getParoisses(params).subscribe({
      next: ({ data, meta }) => {
        this.paroisses.set(data);
        this.paginationMeta.set({
          currentPage: meta.current_page,
          perPage: meta.per_page,
          total: meta.total,
          lastPage: meta.last_page,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement de la liste des paroisses.'
        );
        this.loading.set(false);
      },
    });
  }

  protected onSearch(term: string): void {
    this.filterSearch.set(term);
    this.paginationMeta.update((prev) => ({ ...prev, currentPage: 1 }));
    this.refresh();
  }

  protected onStatutFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filterStatut.set(target.value);
    this.paginationMeta.update((prev) => ({ ...prev, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.filterSearch.set('');
    this.filterStatut.set('tous');
    this.paginationMeta.update((prev) => ({ ...prev, currentPage: 1 }));
    this.refresh();
  }

  protected hasActiveFilters(): boolean {
    return !!this.filterSearch() || this.filterStatut() !== 'tous';
  }

  protected onPageChange(event: PageChangeEvent): void {
    this.paginationMeta.update((prev) => ({
      ...prev,
      currentPage: event.page,
      perPage: event.perPage,
    }));
    this.refresh();
  }

  protected navigateToCreate(): void {
    this.router.navigate(['/super-admin/paroisses/nouveau']);
  }

  protected navigateToDetail(id: string): void {
    this.router.navigate(['/super-admin/paroisses', id]);
  }

  protected navigateToEdit(id: string): void {
    this.router.navigate(['/super-admin/paroisses', id, 'modifier']);
  }

  protected promptStatusChange(paroisse: Paroisse, targetStatus: ParoisseStatut): void {
    this.targetParoisse = paroisse;
    this.targetStatus = targetStatus;

    if (targetStatus === 'suspendu') {
      this.confirmTitle.set('Suspendre la paroisse');
      this.confirmMessage.set(
        `Voulez-vous vraiment suspendre la paroisse "${paroisse.nom_paroisse}" ? Les accès aux modules de gestion pourront être restreints.`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Suspendre');
    } else {
      this.confirmTitle.set('Activer la paroisse');
      this.confirmMessage.set(
        `Voulez-vous réactiver la paroisse "${paroisse.nom_paroisse}" ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    }

    this.confirmDialogOpen.set(true);
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
    this.targetParoisse = null;
  }

  protected executeStatusChange(): void {
    if (!this.targetParoisse) return;

    this.actionLoading.set(true);
    const parishId = this.targetParoisse.id;
    const nextStatut = this.targetStatus;

    this.paroisseService.changeStatus(parishId, nextStatut).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeConfirmDialog();
        this.toast.success(
          'Statut mis à jour',
          `Le statut de la paroisse a été passé à "${nextStatut}".`
        );
        this.refresh();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toast.error(
          'Échec de la mise à jour',
          err?.message || 'Impossible de mettre à jour le statut.'
        );
      },
    });
  }
}
