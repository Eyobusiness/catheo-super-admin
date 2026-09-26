import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CampagneStatusBadgeComponent } from '../components/campagne-status-badge/campagne-status-badge.component';
import { CampagneFormModalComponent } from '../components/campagne-form-modal/campagne-form-modal.component';
import { PelerinageService } from '../services/pelerinage.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import {
  CampagneFilters,
  CampagnePelerinage,
  CampagneStatut,
} from '../models/pelerinage.model';

@Component({
  selector: 'app-pelerinages-list-page',
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
    ConfirmDialogComponent,
    CampagneFormModalComponent,
  ],
  template: `
    <div class="pelerinages-page-container">
      <!-- En-tête de page officiel -->
      <app-page-header
        title="Pèlerinages & Sanctuaires"
        [subtitle]="pageSubtitle()"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="loadCampagnes()"
          >
            Actualiser
          </app-btn>

          @if (canCreate()) {
            <app-btn
              variant="primary"
              icon="plus-lg"
              (btnClick)="openCreateModal()"
            >
              Nouvelle Campagne
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- Cartes de synthèse (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <app-stat-card
          title="Total Campagnes"
          [value]="totalItems()"
          subtitle="Campagnes organisées"
          icon="bi bi-geo-alt-fill"
          theme="primary"
        />
        <app-stat-card
          title="Campagnes Ouvertes"
          [value]="ouvertesCount()"
          subtitle="Inscriptions en cours"
          icon="bi bi-door-open-fill"
          theme="success"
        />
        <app-stat-card
          title="Clôturées / Terminées"
          [value]="termineesCount()"
          subtitle="Campagnes achevées"
          icon="bi bi-check2-circle"
          theme="info"
        />
      </div>

      <!-- Barre de recherche et filtres -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par nom, code, destination..."
          [hasActiveFilters]="hasActiveFilters()"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        >
          <div class="filters-wrap">
            <select
              [value]="selectedStatut()"
              (change)="onStatutChange($event)"
              class="filter-select"
              aria-label="Filtrer par statut"
            >
              <option value="tous">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="ouverte">Ouverte</option>
              <option value="cloturee">Clôturée</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
        </app-filter-bar>
      </div>

      <!-- État d'erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadCampagnes()"
          />
        </div>
      }

      <!-- Tableau des campagnes -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="campagnes()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucune campagne de pèlerinage"
            emptySubtitle="Aucune campagne ne correspond à vos critères de recherche."
          />

          @if (totalItems() > 0) {
            <div class="mt-4">
              <app-pagination
                [currentPage]="currentPage()"
                [perPage]="perPage()"
                [total]="totalItems()"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        </div>
      }

      <!-- Actions de chaque ligne -->
      <ng-template #rowActionsTpl let-c>
        <div class="row-actions-group">
          <!-- Consulter les détails -->
          <button
            type="button"
            class="action-btn action-view"
            (click)="navigateToDetail(c)"
            title="Consulter le pèlerinage"
            aria-label="Voir les détails"
          >
            <i class="bi bi-eye"></i>
          </button>

          <!-- Ouvrir les inscriptions -->
          @if (canUpdate() && c.statut === 'brouillon') {
            <button
              type="button"
              class="action-btn action-open"
              (click)="openCampagne(c)"
              title="Ouvrir aux inscriptions"
              aria-label="Ouvrir"
            >
              <i class="bi bi-door-open"></i>
            </button>
          }

          <!-- Clôturer la campagne -->
          @if (canUpdate() && c.statut === 'ouverte') {
            <button
              type="button"
              class="action-btn action-close"
              (click)="confirmCloture(c)"
              title="Clôturer les inscriptions"
              aria-label="Clôturer"
            >
              <i class="bi bi-lock"></i>
            </button>
          }

          <!-- Modifier -->
          @if (canUpdate() && (c.statut === 'brouillon' || c.statut === 'ouverte')) {
            <button
              type="button"
              class="action-btn action-edit"
              (click)="openEditModal(c)"
              title="Modifier la campagne"
              aria-label="Modifier"
            >
              <i class="bi bi-pencil"></i>
            </button>
          }

          <!-- Annuler la campagne -->
          @if (canUpdate() && (c.statut === 'brouillon' || c.statut === 'ouverte')) {
            <button
              type="button"
              class="action-btn action-cancel"
              (click)="confirmAnnulation(c)"
              title="Annuler la campagne"
              aria-label="Annuler"
            >
              <i class="bi bi-slash-circle"></i>
            </button>
          }

          <!-- Supprimer (Brouillon uniquement) -->
          @if (canDelete() && c.statut === 'brouillon') {
            <button
              type="button"
              class="action-btn action-delete"
              (click)="confirmDelete(c)"
              title="Supprimer la campagne"
              aria-label="Supprimer"
            >
              <i class="bi bi-trash"></i>
            </button>
          }
        </div>
      </ng-template>

      <!-- Modal de Création / Modification -->
      <app-campagne-form-modal
        #formModal
        [isOpen]="isFormModalOpen()"
        [campagne]="selectedCampagneForEdit()"
        (close)="closeFormModal()"
        (saved)="onCampagneSaved($event)"
      />

      <!-- Dialogue de Confirmation Général -->
      <app-confirm-dialog
        [isOpen]="isConfirmDialogOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [confirmText]="confirmButtonText()"
        [variant]="confirmVariant()"
        (confirmed)="executeConfirmedAction()"
        (cancelled)="closeConfirmDialog()"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .pelerinages-page-container {
      padding: var(--spacing-6, 1.5rem);
      max-width: 1400px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filter-select {
      height: 38px;
      padding: 0 2rem 0 0.875rem;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--text-color, #1e293b);
      background-color: var(--bg-surface, #ffffff);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 10px 10px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      appearance: none;
      cursor: pointer;
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .row-actions-group {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid transparent;
      background: transparent;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      color: var(--text-muted, #64748b);
    }
    .action-view:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--color-primary, #6366f1);
    }
    .action-open:hover {
      background: var(--success-50, #f0fdf4);
      color: var(--success-600, #16a34a);
    }
    .action-close:hover {
      background: var(--info-50, #eff6ff);
      color: var(--info-600, #2563eb);
    }
    .action-edit:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--neutral-800, #1e293b);
    }
    .action-cancel:hover, .action-delete:hover {
      background: var(--danger-50, #fef2f2);
      color: var(--danger-600, #dc2626);
    }
    @media (max-width: 640px) {
      .pelerinages-page-container {
        padding: 1rem;
      }
      .filters-wrap {
        width: 100%;
      }
      .filter-select {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PelerinagesListPageComponent implements OnInit {
  @ViewChild('formModal') formModal?: CampagneFormModalComponent;

  private readonly pelerinageService = inject(PelerinageService);
  private readonly orgContextService = inject(OrganisationContextService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Signaux d'état
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly campagnes = signal<CampagnePelerinage[]>([]);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(15);
  public readonly totalItems = signal<number>(0);

  // Filtres
  public readonly searchQuery = signal<string>('');
  public readonly selectedStatut = signal<CampagneStatut | 'tous'>('tous');

  // Modal Formulaire
  public readonly isFormModalOpen = signal<boolean>(false);
  public readonly selectedCampagneForEdit = signal<CampagnePelerinage | null>(null);

  // Modal Confirmation
  public readonly isConfirmDialogOpen = signal<boolean>(false);
  public readonly confirmTitle = signal<string>('');
  public readonly confirmMessage = signal<string>('');
  public readonly confirmButtonText = signal<string>('Confirmer');
  public readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('danger');
  private pendingAction: (() => void) | null = null;

  // Contexte
  public readonly typeOrganisation = computed(() =>
    this.orgContextService.typeOrganisation() || 'Organisation'
  );
  public readonly pageSubtitle = computed(() => {
    const org = this.orgContextService.context()?.nom || 'Organisation';
    const paroisse = this.orgContextService.paroisse()?.nom_paroisse || 'Paroisse';
    return `${org} • ${paroisse}`;
  });

  // Permissions RBAC
  public readonly canCreate = computed(() =>
    this.permissionService.hasPermission('pelerinages.create')
  );
  public readonly canUpdate = computed(() =>
    this.permissionService.hasPermission('pelerinages.update')
  );
  public readonly canDelete = computed(() =>
    this.permissionService.hasPermission('pelerinages.delete')
  );

  // KPIs
  public readonly ouvertesCount = computed(() =>
    this.campagnes().filter((c) => c.statut === 'ouverte').length
  );
  public readonly termineesCount = computed(() =>
    this.campagnes().filter((c) => c.statut === 'terminee' || c.statut === 'cloturee').length
  );

  public readonly hasActiveFilters = computed(
    () => this.searchQuery().trim().length > 0 || this.selectedStatut() !== 'tous'
  );

  // Colonnes de la table
  public readonly columns: TableColumn<CampagnePelerinage>[] = [
    {
      key: 'code',
      label: 'Code',
      width: '130px',
      formatter: (_val, row) => row.code,
    },
    {
      key: 'nom',
      label: 'Nom & Destination',
      formatter: (_val, row) => `${row.nom} (${row.destination})`,
    },
    {
      key: 'date_depart',
      label: 'Départ',
      width: '120px',
      formatter: (_val, row) => row.date_depart,
    },
    {
      key: 'date_fin',
      label: 'Fin',
      width: '120px',
      formatter: (_val, row) => row.date_fin,
    },
    {
      key: 'capacite',
      label: 'Inscrits / Capacité',
      width: '150px',
      align: 'center',
      formatter: (_val, row) => {
        const occ = row.places_occupees ?? row.total_inscrits ?? 0;
        return row.capacite ? `${occ} / ${row.capacite}` : `${occ} (Illimité)`;
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '120px',
      align: 'center',
      formatter: (_val, row) => row.statut,
    },
  ];

  public ngOnInit(): void {
    this.loadCampagnes();
  }

  public loadCampagnes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: CampagneFilters = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchQuery().trim() || undefined,
      statut: this.selectedStatut(),
    };

    this.pelerinageService.getCampagnes(filters).subscribe({
      next: (res) => {
        this.campagnes.set(res.data);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 403) {
          this.errorMessage.set(
            "Accès refusé : vous n'avez pas l'autorisation de consulter les pèlerinages."
          );
        } else if (err?.status === 401) {
          this.errorMessage.set('Session expirée. Veuillez vous reconnecter.');
        } else {
          this.errorMessage.set('Impossible de charger les campagnes de pèlerinage.');
        }
      },
    });
  }

  public onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadCampagnes();
  }

  public onStatutChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as CampagneStatut | 'tous';
    this.selectedStatut.set(val);
    this.currentPage.set(1);
    this.loadCampagnes();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatut.set('tous');
    this.currentPage.set(1);
    this.loadCampagnes();
  }

  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.loadCampagnes();
  }

  public navigateToDetail(campagne: CampagnePelerinage): void {
    this.router.navigate(['/organisation/pelerinages', campagne.id]);
  }

  // Création & Modification
  public openCreateModal(): void {
    this.selectedCampagneForEdit.set(null);
    this.isFormModalOpen.set(true);
    setTimeout(() => this.formModal?.updateFormValues(null), 0);
  }

  public openEditModal(campagne: CampagnePelerinage): void {
    this.selectedCampagneForEdit.set(campagne);
    this.isFormModalOpen.set(true);
    setTimeout(() => this.formModal?.updateFormValues(campagne), 0);
  }

  public closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedCampagneForEdit.set(null);
  }

  public onCampagneSaved(_campagne: CampagnePelerinage): void {
    this.closeFormModal();
    this.loadCampagnes();
  }

  // Cycle de vie : Ouvrir
  public openCampagne(campagne: CampagnePelerinage): void {
    this.confirmTitle.set('Ouvrir les inscriptions');
    this.confirmMessage.set(
      `Confirmez-vous l'ouverture des inscriptions pour la campagne "${campagne.nom}" ?`
    );
    this.confirmButtonText.set('Ouvrir la campagne');
    this.confirmVariant.set('info');
    this.pendingAction = () => {
      this.pelerinageService.ouvrirCampagne(campagne.id).subscribe({
        next: () => {
          this.toast.success('Campagne ouverte', 'Les inscriptions sont désormais ouvertes.');
          this.loadCampagnes();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || "Erreur lors de l'ouverture.");
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  // Cycle de vie : Clôturer
  public confirmCloture(campagne: CampagnePelerinage): void {
    this.confirmTitle.set('Clôturer la campagne');
    this.confirmMessage.set(
      `Êtes-vous sûr de vouloir clôturer la campagne "${campagne.nom}" ? Les inscriptions impayées restées en attente seront automatiquement annulées.`
    );
    this.confirmButtonText.set('Clôturer définitivement');
    this.confirmVariant.set('warning');
    this.pendingAction = () => {
      this.pelerinageService.cloturerCampagne(campagne.id).subscribe({
        next: (res) => {
          this.toast.success(
            'Campagne clôturée',
            `Campagne clôturée avec succès (${res.inscriptions_annulees} impayés annulés).`
          );
          this.loadCampagnes();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || 'Erreur lors de la clôture.');
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  // Cycle de vie : Annuler
  public confirmAnnulation(campagne: CampagnePelerinage): void {
    this.confirmTitle.set('Annuler la campagne');
    this.confirmMessage.set(
      `Attention : l'annulation de la campagne "${campagne.nom}" est une action majeure. Toutes les inscriptions non payées seront annulées. Confirmez-vous ?`
    );
    this.confirmButtonText.set('Annuler la campagne');
    this.confirmVariant.set('danger');
    this.pendingAction = () => {
      this.pelerinageService.annulerCampagne(campagne.id).subscribe({
        next: () => {
          this.toast.success('Campagne annulée', 'Campagne annulée avec succès.');
          this.loadCampagnes();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || "Erreur lors de l'annulation.");
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  // Cycle de vie : Supprimer (Brouillon)
  public confirmDelete(campagne: CampagnePelerinage): void {
    this.confirmTitle.set('Supprimer la campagne');
    this.confirmMessage.set(
      `Êtes-vous sûr de vouloir supprimer définitivement la campagne brouillon "${campagne.nom}" ? Cette action est irréversible.`
    );
    this.confirmButtonText.set('Supprimer');
    this.confirmVariant.set('danger');
    this.pendingAction = () => {
      this.pelerinageService.deleteCampagne(campagne.id).subscribe({
        next: () => {
          this.toast.success('Campagne supprimée', 'Campagne supprimée avec succès.');
          this.loadCampagnes();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || 'Erreur lors de la suppression.');
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  public executeConfirmedAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.closeConfirmDialog();
  }

  public closeConfirmDialog(): void {
    this.isConfirmDialogOpen.set(false);
    this.pendingAction = null;
  }
}
