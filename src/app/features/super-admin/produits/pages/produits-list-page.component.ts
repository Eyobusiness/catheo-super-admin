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
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent, PaginationState } from '../../../../shared/models/pagination.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ProduitService } from '../services/produit.service';
import { Produit, ProduitFilterParams, ProduitStatut } from '../models/produit.model';

@Component({
  selector: 'app-produits-list-page',
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
        title="Produits SaaS"
        subtitle="Catalogue des modules et applications déployables (CATHEO, OPPE, OPPJ, OPPA)"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Produits' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToCreate()"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Nouveau Produit</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- 4 Cartes Synthèse Produits F26.5 -->
      <div class="produits-cards-grid">
        <div class="prod-summary-card catheo" (click)="filterByCode('CATHEO')">
          <div class="card-head">
            <span class="badge-code catheo">CATHEO</span>
            <span class="status-indicator active">Actif</span>
          </div>
          <h4 class="card-prod-title">Module Paroissial Central</h4>
          <p class="card-prod-desc">Gestion des registres, sacrements, quêtes, dîmes et comptabilité paroissiale.</p>
          <div class="card-bottom">
            <span class="btn-link">Formules tarifaires <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>

        <div class="prod-summary-card oppe" (click)="filterByCode('OPPE')">
          <div class="card-head">
            <span class="badge-code oppe">OPPE</span>
            <span class="status-indicator active">Actif</span>
          </div>
          <h4 class="card-prod-title">Office Paroissial de la Pastorale des Enfants</h4>
          <p class="card-prod-desc">Mouvements CV-AV, catéchèse des enfants, activités et encadrement.</p>
          <div class="card-bottom">
            <span class="btn-link">Formules tarifaires <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>

        <div class="prod-summary-card oppj" (click)="filterByCode('OPPJ')">
          <div class="card-head">
            <span class="badge-code oppj">OPPJ</span>
            <span class="status-indicator active">Actif</span>
          </div>
          <h4 class="card-prod-title">Office Paroissial de la Pastorale des Jeunes</h4>
          <p class="card-prod-desc">Groupes JEC, scouts, guides, pèlerinages et mouvements jeunes.</p>
          <div class="card-bottom">
            <span class="btn-link">Formules tarifaires <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>

        <div class="prod-summary-card oppa" (click)="filterByCode('OPPA')">
          <div class="card-head">
            <span class="badge-code oppa">OPPA</span>
            <span class="status-indicator active">Actif</span>
          </div>
          <h4 class="card-prod-title">Office Paroissial de la Pastorale des Adultes</h4>
          <p class="card-prod-desc">Fraternités, AFC, chorales, CEB et mouvements d'adultes chrétiens.</p>
          <div class="card-bottom">
            <span class="btn-link">Formules tarifaires <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>
      </div>

      <!-- Barre de filtres & recherche -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher par nom, code...'"
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
          title="Impossible de charger les produits"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des données -->
        <app-table
          [columns]="columns"
          [data]="produits()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucun produit trouvé"
          emptySubtitle="Aucun produit ne correspond à vos critères de recherche."
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
      <ng-template #rowActionsTpl let-produit>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-icon-btn action-view"
            (click)="navigateToDetail(produit.id)"
            title="Consulter le produit et ses formules"
            aria-label="Détails du produit"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="action-icon-btn action-edit"
            (click)="navigateToEdit(produit.id)"
            title="Modifier le produit"
            aria-label="Modifier le produit"
          >
            <i class="bi bi-pencil"></i>
          </button>

          @if (produit.statut === 'actif') {
            <button
              type="button"
              class="action-icon-btn action-deactivate"
              (click)="promptStatusChange(produit, 'inactif')"
              title="Désactiver le produit"
              aria-label="Désactiver le produit"
            >
              <i class="bi bi-pause-circle"></i>
            </button>
          } @else {
            <button
              type="button"
              class="action-icon-btn action-activate"
              (click)="promptStatusChange(produit, 'actif')"
              title="Activer le produit"
              aria-label="Activer le produit"
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
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .produits-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .prod-summary-card {
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .prod-summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    }
    .prod-summary-card.catheo:hover { border-color: #0284c7; }
    .prod-summary-card.oppe:hover { border-color: #2563eb; }
    .prod-summary-card.oppj:hover { border-color: #9333ea; }
    .prod-summary-card.oppa:hover { border-color: #16a34a; }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-code {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      letter-spacing: 0.03em;
    }
    .badge-code.catheo { background: #e0f2fe; color: #0369a1; }
    .badge-code.oppe { background: #dbeafe; color: #1d4ed8; }
    .badge-code.oppj { background: #f3e8ff; color: #7e22ce; }
    .badge-code.oppa { background: #dcfce7; color: #15803d; }
    .status-indicator.active {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }
    .card-prod-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .card-prod-desc {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
      line-height: 1.4;
      flex: 1;
    }
    .card-bottom {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--neutral-100, #f1f5f9);
    }
    .btn-link {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-600, #0284c7);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-link i {
      transition: transform var(--transition-fast, 150ms ease);
    }
    .prod-summary-card:hover .btn-link i {
      transform: translateX(3px);
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly produitService = inject(ProduitService);
  private readonly toast = inject(ToastService);

  public readonly rowActionsTpl = viewChild<TemplateRef<any>>('rowActionsTpl');

  // State signals
  protected readonly produits = signal<Produit[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Filters
  protected readonly searchTerm = signal<string>('');
  protected readonly filterStatut = signal<ProduitStatut | 'tous'>('tous');

  // Pagination
  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // Confirmation modal
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private targetProduit: Produit | null = null;
  private targetStatus: ProduitStatut = 'actif';

  protected readonly columns: TableColumn<Produit>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'nom',
      label: 'Nom du Produit',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      formatter: (val) => val || '—',
    },
    {
      key: 'formules_count',
      label: 'Formules',
      width: '130px',
      formatter: (val) => {
        const count = Number(val) || 0;
        return `${count} formule(s)`;
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '120px',
      formatter: (val) => (val === 'actif' ? '● Actif' : '● Inactif'),
    },
  ];

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const params: ProduitFilterParams = {
      search: this.searchTerm().trim() || undefined,
      statut: this.filterStatut() !== 'tous' ? this.filterStatut() : undefined,
      page: this.paginationMeta().currentPage,
      per_page: this.paginationMeta().perPage,
    };

    this.produitService.getProduits(params).subscribe({
      next: (res) => {
        this.produits.set(res.data);
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
          err?.message || 'Une erreur est survenue lors de la récupération des produits.'
        );
        this.loading.set(false);
      },
    });
  }

  protected hasActiveFilters(): boolean {
    return this.searchTerm().trim().length > 0 || this.filterStatut() !== 'tous';
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onStatutFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ProduitStatut | 'tous';
    this.filterStatut.set(val);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.searchTerm.set('');
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
    this.router.navigate(['/super-admin/produits/nouveau']);
  }

  public navigateToDetail(id: string): void {
    this.router.navigate(['/super-admin/produits', id]);
  }

  public navigateToEdit(id: string): void {
    this.router.navigate(['/super-admin/produits', id, 'modifier']);
  }

  protected filterByCode(code: string): void {
    this.router.navigate(['/super-admin/formules'], {
      queryParams: { produit: code },
    });
  }

  protected promptStatusChange(produit: Produit, newStatus: ProduitStatut): void {
    this.targetProduit = produit;
    this.targetStatus = newStatus;

    if (newStatus === 'inactif') {
      this.confirmTitle.set('Désactiver le produit');
      this.confirmMessage.set(
        `Êtes-vous sûr de vouloir désactiver le produit « ${produit.nom} » (${produit.code}) ? Les paroisses ne pourront plus souscrire à de nouveaux abonnements sur ce produit.`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Désactiver');
    } else {
      this.confirmTitle.set('Activer le produit');
      this.confirmMessage.set(
        `Voulez-vous activer le produit « ${produit.nom} » (${produit.code}) pour le rendre disponible aux souscriptions ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    }

    this.confirmDialogOpen.set(true);
  }

  protected executeStatusChange(): void {
    if (!this.targetProduit) return;

    this.actionLoading.set(true);
    this.produitService.toggleStatus(this.targetProduit.id).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.confirmDialogOpen.set(false);
        this.toast.success(
          'Statut mis à jour',
          `Le produit « ${updated.nom} » est désormais ${updated.statut}.`
        );
        this.refresh();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.confirmDialogOpen.set(false);
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors du changement de statut du produit.'
        );
      },
    });
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
    this.targetProduit = null;
  }
}

