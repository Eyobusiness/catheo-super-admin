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
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MembreDetailModalComponent } from '../components/membre-detail-modal/membre-detail-modal.component';
import { MembreFormModalComponent } from '../components/membre-form-modal/membre-form-modal.component';
import { MembreService } from '../services/membre.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ExportService } from '../../exports/services/export.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { PaginatedMeta } from '../../../../core/models/api.models';
import {
  Membre,
  MembreFilterParams,
  MembreStatut,
  MembreSexe,
} from '../models/membre.model';

@Component({
  selector: 'app-membres-list-page',
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
    MembreDetailModalComponent,
    MembreFormModalComponent,
  ],
  template: `
    <div class="membres-page-container">
      <!-- En-tête de page -->
      <app-page-header
        title="Membres de l'Organisation"
        [subtitle]="pageSubtitle()"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="loadMembres()"
          >
            Actualiser
          </app-btn>

          <app-btn
            variant="outline"
            icon="file-earmark-arrow-down"
            [loading]="isExporting()"
            (btnClick)="exportCsv()"
          >
            Exporter CSV
          </app-btn>

          @if (canManageMembres()) {
            <app-btn
              variant="primary"
              icon="plus-lg"
              (btnClick)="openCreateModal()"
            >
              Nouveau Membre
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- Cartes de synthèse (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <app-stat-card
          title="Total Membres"
          [value]="totalItems()"
          subtitle="Effectif total de l'organisation"
          icon="bi bi-people-fill"
          theme="primary"
        />
        <app-stat-card
          title="Membres Actifs"
          [value]="actifsCount()"
          subtitle="En activité pastorale"
          icon="bi bi-check-circle-fill"
          theme="success"
        />
        <app-stat-card
          title="Inactifs / Suspendus"
          [value]="inactifsCount()"
          subtitle="Indisponibles ou suspendus"
          icon="bi bi-pause-circle-fill"
          theme="warning"
        />
      </div>

      <!-- Barre de Recherche et Filtres -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par nom, téléphone, email, quartier..."
          [hasActiveFilters]="hasActiveFilters()"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        >
          <div class="filters-wrap">
            <!-- Filtre Statut -->
            <select
              [value]="selectedStatut()"
              (change)="onStatutChange($event)"
              class="filter-select"
              aria-label="Filtrer par statut"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>

            <!-- Filtre Sexe -->
            <select
              [value]="selectedSexe()"
              (change)="onSexeChange($event)"
              class="filter-select"
              aria-label="Filtrer par genre"
            >
              <option value="tous">Tous les genres</option>
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
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
            (action)="loadMembres()"
          />
        </div>
      }

      <!-- Tableau des membres -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="membres()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun membre trouvé"
            emptySubtitle="Aucun membre de l'organisation ne correspond à vos critères."
          />

          <!-- Pagination -->
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

      <!-- Actions de chaque ligne du tableau -->
      <ng-template #rowActionsTpl let-m>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-btn action-view"
            (click)="openDetailModal(m)"
            title="Consulter la fiche complète"
            aria-label="Voir la fiche"
          >
            <i class="bi bi-eye"></i>
          </button>

          @if (canManageMembres()) {
            <button
              type="button"
              class="action-btn action-edit"
              (click)="openEditModal(m)"
              title="Modifier ce membre"
              aria-label="Modifier"
            >
              <i class="bi bi-pencil"></i>
            </button>

            <button
              type="button"
              class="action-btn action-delete"
              (click)="openDeleteConfirm(m)"
              title="Supprimer ce membre"
              aria-label="Supprimer"
            >
              <i class="bi bi-trash"></i>
            </button>
          }
        </div>
      </ng-template>

      <!-- Modal de Consultation Détaillée -->
      <app-membre-detail-modal
        [isOpen]="isDetailModalOpen()"
        [membre]="selectedMembre()"
        [canManage]="canManageMembres()"
        (close)="closeDetailModal()"
        (edit)="onDetailEditRequested($event)"
      />

      <!-- Modal de Formulaire (Création / Modification) -->
      <app-membre-form-modal
        [isOpen]="isFormModalOpen()"
        [membre]="selectedMembreForEdit()"
        (close)="closeFormModal()"
        (saved)="onMembreSaved()"
      />

      <!-- Dialogue de Confirmation de Suppression -->
      <app-confirm-dialog
        [isOpen]="isDeleteConfirmOpen()"
        title="Supprimer le membre"
        [message]="deleteConfirmMessage()"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="danger"
        [loading]="isDeleting()"
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="closeDeleteConfirm()"
      />
    </div>
  `,
  styles: [`
    .membres-page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filter-select {
      height: 38px;
      padding: 0 2rem 0 0.875rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background-color: var(--bg-surface, #ffffff);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      cursor: pointer;
      outline: none;
      transition: border-color var(--transition-fast, 150ms);
    }

    .filter-select:focus {
      border-color: var(--primary-500, #3b82f6);
    }

    .row-actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid transparent;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms);
    }

    .action-view {
      color: var(--primary-600, #2563eb);
    }

    .action-view:hover {
      background: var(--primary-50, #eff6ff);
      border-color: var(--primary-200, #bfdbfe);
    }

    .action-edit {
      color: var(--neutral-700, #334155);
    }

    .action-edit:hover {
      background: var(--neutral-100, #f1f5f9);
      border-color: var(--neutral-300, #cbd5e1);
    }

    .action-delete {
      color: var(--danger-600, #dc2626);
    }

    .action-delete:hover {
      background: var(--danger-50, #fef2f2);
      border-color: var(--danger-200, #fecaca);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembresListPageComponent implements OnInit {
  private readonly membreService = inject(MembreService);
  private readonly contextService = inject(OrganisationContextService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);

  public readonly isExporting = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly membres = signal<Membre[]>([]);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(15);
  public readonly totalItems = signal<number>(0);

  // Filtres
  public readonly searchQuery = signal<string>('');
  public readonly selectedStatut = signal<MembreStatut | 'tous'>('tous');
  public readonly selectedSexe = signal<MembreSexe | 'tous'>('tous');

  // Modales
  public readonly isDetailModalOpen = signal<boolean>(false);
  public readonly selectedMembre = signal<Membre | null>(null);

  public readonly isFormModalOpen = signal<boolean>(false);
  public readonly selectedMembreForEdit = signal<Membre | null>(null);

  public readonly isDeleteConfirmOpen = signal<boolean>(false);
  public readonly membreToDelete = signal<Membre | null>(null);
  public readonly isDeleting = signal<boolean>(false);

  // Contexte & Permissions
  public readonly orgContext = this.contextService.context;
  public readonly typeOrganisation = this.contextService.typeOrganisation;

  public readonly canManageMembres = computed(() => {
    return this.permissionService.hasPermission('membres.manage');
  });

  public readonly canViewMembres = computed(() => {
    return this.permissionService.hasAnyPermission(['membres.view', 'membres.manage']);
  });

  public readonly pageSubtitle = computed(() => {
    const org = this.orgContext();
    const parish = org?.paroisse?.nom_paroisse || 'Paroisse';
    return `${org?.nom || 'Organisation Pastorale'} · ${parish}`;
  });

  public readonly hasActiveFilters = computed(() => {
    return (
      this.searchQuery().trim() !== '' ||
      this.selectedStatut() !== 'tous' ||
      this.selectedSexe() !== 'tous'
    );
  });

  public readonly actifsCount = computed(() => {
    return this.membres().filter((m) => m.statut === 'actif').length;
  });

  public readonly inactifsCount = computed(() => {
    return this.membres().filter((m) => m.statut !== 'actif').length;
  });

  public readonly deleteConfirmMessage = computed(() => {
    const m = this.membreToDelete();
    if (!m) return 'Confirmez-vous la suppression de ce membre ?';
    return `Êtes-vous sûr de vouloir supprimer ${m.nom_complet} de l'organisation ? Cette action est irréversible.`;
  });

  public readonly columns: TableColumn<Membre>[] = [
    {
      key: 'nom_complet',
      label: 'Nom & Prénoms',
      sortable: true,
      formatter: (val, row) => row.nom_complet || `${row.nom} ${row.prenoms}`,
    },
    {
      key: 'sexe',
      label: 'Genre',
      align: 'center',
      width: '90px',
      formatter: (val) => (val === 'M' ? 'Masculin' : val === 'F' ? 'Féminin' : '—'),
    },
    {
      key: 'fonction',
      label: 'Fonction / Rôle',
      formatter: (val, row) => {
        const f = val || 'Membre';
        return row?.mandat ? `${f} (${row.mandat})` : f;
      },
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      formatter: (val) => val || '—',
    },
    {
      key: 'email',
      label: 'Email',
      formatter: (val) => val || '—',
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      width: '110px',
      formatter: (val) => {
        if (val === 'actif') return 'Actif';
        if (val === 'inactif') return 'Inactif';
        if (val === 'suspendu') return 'Suspendu';
        return val || '—';
      },
    },
  ];

  public ngOnInit(): void {
    this.loadMembres();
  }

  public loadMembres(): void {
    if (!this.canViewMembres()) {
      this.errorMessage.set("Vous ne disposez pas des permissions requises pour consulter la liste des membres.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: MembreFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchQuery().trim() || undefined,
      statut: this.selectedStatut() !== 'tous' ? this.selectedStatut() : undefined,
      sexe: this.selectedSexe() !== 'tous' ? this.selectedSexe() : undefined,
    };

    this.membreService.getMembres(params).subscribe({
      next: (response) => {
        this.membres.set(response.data);
        this.totalItems.set(response.meta.total);
        this.currentPage.set(response.meta.current_page);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Impossible de récupérer la liste des membres.';
        this.errorMessage.set(msg);
        this.toast.error('Erreur', msg);
      },
    });
  }

  public exportCsv(): void {
    this.isExporting.set(true);
    const filters: MembreFilterParams = {};
    if (this.searchQuery().trim()) filters.search = this.searchQuery().trim();
    if (this.selectedStatut() !== 'tous') filters.statut = this.selectedStatut() as MembreStatut;
    if (this.selectedSexe() !== 'tous') filters.sexe = this.selectedSexe() as MembreSexe;

    this.exportService.exportMembresCsv(filters).subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const filename = `membres-${new Date().toISOString().slice(0, 10)}.csv`;
        this.exportService.downloadBlob(blob, filename);
        this.toast.success('Export réussi', 'La liste des membres a été exportée.');
      },
      error: () => {
        this.isExporting.set(false);
        this.toast.error('Erreur', "Échec de l'exportation des membres");
      },
    });
  }

  public onSearchChange(term: string): void {
    this.searchQuery.set(term);
    this.currentPage.set(1);
    this.loadMembres();
  }

  public onStatutChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as MembreStatut | 'tous';
    this.selectedStatut.set(val);
    this.currentPage.set(1);
    this.loadMembres();
  }

  public onSexeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as MembreSexe | 'tous';
    this.selectedSexe.set(val);
    this.currentPage.set(1);
    this.loadMembres();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatut.set('tous');
    this.selectedSexe.set('tous');
    this.currentPage.set(1);
    this.loadMembres();
  }

  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.loadMembres();
  }

  // Détail
  public openDetailModal(m: Membre): void {
    this.selectedMembre.set(m);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedMembre.set(null);
  }

  public onDetailEditRequested(m: Membre): void {
    this.closeDetailModal();
    this.openEditModal(m);
  }

  // Création & Modification
  public openCreateModal(): void {
    this.selectedMembreForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  public openEditModal(m: Membre): void {
    this.selectedMembreForEdit.set(m);
    this.isFormModalOpen.set(true);
  }

  public closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedMembreForEdit.set(null);
  }

  public onMembreSaved(): void {
    this.closeFormModal();
    this.loadMembres();
  }

  // Suppression
  public openDeleteConfirm(m: Membre): void {
    this.membreToDelete.set(m);
    this.isDeleteConfirmOpen.set(true);
  }

  public closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.membreToDelete.set(null);
  }

  public onDeleteConfirmed(): void {
    const m = this.membreToDelete();
    if (!m) return;

    this.isDeleting.set(true);
    this.membreService.deleteMembre(m.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Membre supprimé', `${m.nom_complet} a été retiré de l'organisation.`);
        this.closeDeleteConfirm();
        this.loadMembres();
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || err.message || 'Impossible de supprimer ce membre.';
        this.toast.error('Erreur de suppression', msg);
      },
    });
  }
}
