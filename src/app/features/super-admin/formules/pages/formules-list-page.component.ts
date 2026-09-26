import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { FormuleService } from '../services/formule.service';
import { ProduitService } from '../../produits/services/produit.service';
import { Formule, FormuleFilterParams, FormuleStatut } from '../models/formule.model';
import { Produit } from '../../produits/models/produit.model';

@Component({
  selector: 'app-formules-list-page',
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
        title="Formules Tarifaires"
        subtitle="Gestion des formules de souscription et tarification par produit SaaS"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Formules' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToCreate()"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Nouvelle Formule</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de filtres réels -->
      <app-filter-bar
        [searchPlaceholder]="'Filtrer les formules...'"
        [hasActiveFilters]="hasActiveFilters()"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <!-- Filtre Produit -->
          <select
            [value]="filterProduitId()"
            (change)="onProduitFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par produit"
          >
            <option value="">Tous les produits</option>
            @for (p of produitsList(); track p.id) {
              <option [value]="p.id">{{ p.nom }} ({{ p.code }})</option>
            }
          </select>

          <!-- Filtre Gratuité -->
          <select
            [value]="filterGratuite()"
            (change)="onGratuiteFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par type de tarif"
          >
            <option value="tous">Toutes les offres</option>
            <option value="payante">Formules payantes</option>
            <option value="gratuite">Formules gratuites</option>
          </select>

          <!-- Filtre Statut -->
          <select
            [value]="filterStatut()"
            (change)="onStatutFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par statut"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
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
          title="Impossible de charger les formules"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des formules -->
        <app-table
          [columns]="columns"
          [data]="formules()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucune formule tarifaire trouvée"
          emptySubtitle="Aucune formule ne correspond à vos critères de recherche ou aucune formule n'a encore été créée."
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
      <ng-template #rowActionsTpl let-formule>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-icon-btn action-view"
            (click)="navigateToDetail(formule.id)"
            title="Consulter les détails de la formule"
            aria-label="Détails de la formule"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="action-icon-btn action-edit"
            (click)="navigateToEdit(formule.id)"
            title="Modifier la formule"
            aria-label="Modifier la formule"
          >
            <i class="bi bi-pencil"></i>
          </button>

          @if (formule.statut === 'actif') {
            <button
              type="button"
              class="action-icon-btn action-deactivate"
              (click)="promptStatusChange(formule, 'inactif')"
              title="Désactiver la formule"
              aria-label="Désactiver la formule"
            >
              <i class="bi bi-pause-circle"></i>
            </button>
          } @else {
            <button
              type="button"
              class="action-icon-btn action-activate"
              (click)="promptStatusChange(formule, 'actif')"
              title="Activer la formule"
              aria-label="Activer la formule"
            >
              <i class="bi bi-check-circle"></i>
            </button>
          }

          <button
            type="button"
            class="action-icon-btn action-delete"
            (click)="promptDelete(formule)"
            title="Supprimer la formule"
            aria-label="Supprimer la formule"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </ng-template>

      <!-- Confirmation Dialogue pour statut et suppression -->
      <app-confirm-dialog
        [isOpen]="confirmDialogOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [variant]="confirmVariant()"
        [confirmText]="confirmActionLabel()"
        [loading]="actionLoading()"
        (confirmed)="executeConfirmedAction()"
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
    .action-view:hover {
      color: var(--primary-600, #0284c7);
      border-color: var(--primary-300, #93c5fd);
    }
    .action-edit:hover {
      color: var(--info-600, #0284c7);
      border-color: var(--info-300, #7dd3fc);
    }
    .action-deactivate:hover {
      color: var(--warning-600, #d97706);
      border-color: var(--warning-300, #fcd34d);
    }
    .action-activate:hover {
      color: var(--success-600, #059669);
      border-color: var(--success-300, #6ee7b7);
    }
    .action-delete:hover {
      color: var(--danger-600, #dc2626);
      border-color: var(--danger-300, #fca5a5);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulesListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formuleService = inject(FormuleService);
  private readonly produitService = inject(ProduitService);
  private readonly toast = inject(ToastService);

  public readonly rowActionsTpl = viewChild<TemplateRef<any>>('rowActionsTpl');

  // State signals
  protected readonly formules = signal<Formule[]>([]);
  protected readonly produitsList = signal<Produit[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Filters
  protected readonly filterProduitCode = signal<string>('');
  protected readonly filterProduitId = signal<string>('');
  protected readonly filterStatut = signal<FormuleStatut | 'tous'>('tous');
  protected readonly filterGratuite = signal<'tous' | 'gratuite' | 'payante'>('tous');

  // Pagination
  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // Modal confirmation
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private confirmActionType: 'status' | 'delete' = 'status';
  private targetFormule: Formule | null = null;
  private targetStatus: FormuleStatut = 'actif';

  protected readonly columns: TableColumn<Formule>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '130px',
    },
    {
      key: 'nom',
      label: 'Nom de la Formule',
      sortable: true,
    },
    {
      key: 'produit',
      label: 'Produit',
      width: '140px',
      formatter: (val, row) => row.produit_nom || row.produit_code || row.produit?.nom || '—',
    },
    {
      key: 'montant',
      label: 'Tarification',
      width: '160px',
      formatter: (val, row) => {
        if (row.est_gratuite) {
          return 'Gratuit';
        }
        const montantNum = Number(val) || 0;
        return `${montantNum.toLocaleString('fr-FR')} ${row.devise || 'XOF'}`;
      },
    },
    {
      key: 'periodicite',
      label: 'Périodicité',
      width: '120px',
      formatter: (val) => {
        return val === 'annuelle' ? 'Annuelle' : 'Mensuelle';
      },
    },
    {
      key: 'ordre',
      label: 'Ordre',
      width: '80px',
      formatter: (val) => String(val !== undefined ? val : 0),
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '110px',
      formatter: (val) => (val === 'actif' ? '● Actif' : '● Inactif'),
    },
  ];

  public ngOnInit(): void {
    const qpProduit = this.route.snapshot.queryParamMap.get('produit');
    if (qpProduit) {
      this.filterProduitCode.set(qpProduit);
    }
    this.loadProduitsFilter();
    this.refresh();
  }

  private loadProduitsFilter(): void {
    this.produitService.getProduits({ all: true }).subscribe({
      next: (res) => this.produitsList.set(res.data),
      error: () => {},
    });
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const params: FormuleFilterParams = {
      produit: this.filterProduitCode() || undefined,
      produit_id: this.filterProduitId() || undefined,
      statut: this.filterStatut() !== 'tous' ? this.filterStatut() : undefined,
      est_gratuite:
        this.filterGratuite() === 'gratuite'
          ? true
          : this.filterGratuite() === 'payante'
          ? false
          : undefined,
      page: this.paginationMeta().currentPage,
      per_page: this.paginationMeta().perPage,
    };

    this.formuleService.getFormules(params).subscribe({
      next: (res) => {
        this.formules.set(res.data);
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
          err?.message || 'Une erreur est survenue lors de la récupération des formules.'
        );
        this.loading.set(false);
      },
    });
  }

  protected hasActiveFilters(): boolean {
    return (
      this.filterProduitId() !== '' ||
      this.filterStatut() !== 'tous' ||
      this.filterGratuite() !== 'tous'
    );
  }

  protected onProduitFilterChange(event: Event): void {
    this.filterProduitId.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onGratuiteFilterChange(event: Event): void {
    this.filterGratuite.set(
      (event.target as HTMLSelectElement).value as 'tous' | 'gratuite' | 'payante'
    );
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onStatutFilterChange(event: Event): void {
    this.filterStatut.set(
      (event.target as HTMLSelectElement).value as FormuleStatut | 'tous'
    );
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.filterProduitId.set('');
    this.filterStatut.set('tous');
    this.filterGratuite.set('tous');
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
    this.router.navigate(['/super-admin/formules/nouvelle']);
  }

  public navigateToDetail(id: number | string): void {
    this.router.navigate(['/super-admin/formules', id]);
  }

  public navigateToEdit(id: number | string): void {
    this.router.navigate(['/super-admin/formules', id, 'modifier']);
  }

  protected promptStatusChange(formule: Formule, newStatus: FormuleStatut): void {
    this.confirmActionType = 'status';
    this.targetFormule = formule;
    this.targetStatus = newStatus;

    if (newStatus === 'inactif') {
      this.confirmTitle.set('Désactiver la formule');
      this.confirmMessage.set(
        `Êtes-vous sûr de vouloir désactiver la formule « ${formule.nom} » (${formule.code}) ?`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Désactiver');
    } else {
      this.confirmTitle.set('Activer la formule');
      this.confirmMessage.set(
        `Voulez-vous activer la formule « ${formule.nom} » (${formule.code}) ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    }

    this.confirmDialogOpen.set(true);
  }

  protected promptDelete(formule: Formule): void {
    this.confirmActionType = 'delete';
    this.targetFormule = formule;
    this.confirmTitle.set('Supprimer la formule');
    this.confirmMessage.set(
      `Êtes-vous certain de vouloir supprimer la formule « ${formule.nom} » (${formule.code}) ? Cette action est irréversible.`
    );
    this.confirmVariant.set('danger');
    this.confirmActionLabel.set('Supprimer définitivement');
    this.confirmDialogOpen.set(true);
  }

  protected executeConfirmedAction(): void {
    if (!this.targetFormule) return;

    this.actionLoading.set(true);
    if (this.confirmActionType === 'status') {
      this.formuleService.toggleStatus(this.targetFormule.id).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success(
            'Statut mis à jour',
            `La formule « ${updated.nom} » est désormais ${updated.statut}.`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors du changement de statut de la formule.'
          );
        },
      });
    } else {
      this.formuleService.deleteFormule(this.targetFormule.id).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success('Suppression réussie', 'Formule supprimée avec succès.');
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors de la suppression de la formule.'
          );
        },
      });
    }
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
    this.targetFormule = null;
  }
}
