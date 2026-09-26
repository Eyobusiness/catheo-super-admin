import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ActiviteDetailModalComponent } from '../components/activite-detail-modal/activite-detail-modal.component';
import { ActiviteFormModalComponent } from '../components/activite-form-modal/activite-form-modal.component';
import { ActiviteService } from '../services/activite.service';
import { MembreService } from '../../membres/services/membre.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ExportService } from '../../exports/services/export.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { Membre } from '../../membres/models/membre.model';
import {
  Activite,
  ActiviteFilterParams,
  ActiviteStatut,
} from '../models/activite.model';

@Component({
  selector: 'app-activites-list-page',
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
    ActiviteDetailModalComponent,
    ActiviteFormModalComponent,
  ],
  template: `
    <div class="activites-page-container">
      <!-- En-tête de page -->
      <app-page-header
        title="Activités Pastorales"
        [subtitle]="pageSubtitle()"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="loadActivites()"
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

          @if (canCreateActivite()) {
            <app-btn
              variant="primary"
              icon="plus-lg"
              (btnClick)="openCreateModal()"
            >
              Nouvelle Activité
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- Cartes de synthèse (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <app-stat-card
          title="Total Activités"
          [value]="totalItems()"
          subtitle="Toutes activités confondues"
          icon="bi bi-calendar-event"
          theme="primary"
        />
        <app-stat-card
          title="Planifiées / En cours"
          [value]="enCoursCount()"
          subtitle="En préparation ou actives"
          icon="bi bi-clock-history"
          theme="warning"
        />
        <app-stat-card
          title="Terminées"
          [value]="termineesCount()"
          subtitle="Activités achevées"
          icon="bi bi-check2-circle"
          theme="success"
        />
      </div>

      <!-- Barre de Recherche et Filtres -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par titre, code, lieu, description..."
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
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="brouillon">Brouillon</option>
              <option value="annulee">Annulée</option>
            </select>

            <!-- Filtre Type d'activité -->
            <select
              [value]="selectedType()"
              (change)="onTypeChange($event)"
              class="filter-select"
              aria-label="Filtrer par type"
            >
              <option value="tous">Tous les types</option>
              <option value="Récollection">Récollection / Retraite</option>
              <option value="Camp">Camp / Sortie</option>
              <option value="Formation">Formation</option>
              <option value="Célébration">Célébration</option>
              <option value="Pèlerinage">Pèlerinage</option>
              <option value="Autre">Autre</option>
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
            (action)="loadActivites()"
          />
        </div>
      }

      <!-- Tableau des activités -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="activites()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucune activité trouvée"
            emptySubtitle="Aucune activité pastorale ne correspond à vos critères de recherche."
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
      <ng-template #rowActionsTpl let-a>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-btn action-view"
            (click)="openDetailModal(a)"
            title="Consulter la fiche détaillée"
            aria-label="Détail"
          >
            <i class="bi bi-eye"></i>
          </button>

          @if (canEditActivite()) {
            <button
              type="button"
              class="action-btn action-edit"
              (click)="openEditModal(a)"
              title="Modifier cette activité"
              aria-label="Modifier"
            >
              <i class="bi bi-pencil"></i>
            </button>
          }

          @if (canDeleteActivite()) {
            <button
              type="button"
              class="action-btn action-delete"
              (click)="openDeleteConfirm(a)"
              title="Supprimer cette activité"
              aria-label="Supprimer"
            >
              <i class="bi bi-trash"></i>
            </button>
          }
        </div>
      </ng-template>

      <!-- Modal de Consultation Détaillée -->
      <app-activite-detail-modal
        [isOpen]="isDetailModalOpen()"
        [activite]="selectedActivite()"
        [canEdit]="canEditActivite()"
        (close)="closeDetailModal()"
        (edit)="onDetailEditRequested($event)"
      />

      <!-- Modal de Formulaire (Création / Modification) -->
      <app-activite-form-modal
        [isOpen]="isFormModalOpen()"
        [activite]="selectedActiviteForEdit()"
        [membres]="availableMembres()"
        (close)="closeFormModal()"
        (saved)="onActiviteSaved()"
      />

      <!-- Dialogue de Confirmation de Suppression -->
      <app-confirm-dialog
        [isOpen]="isDeleteConfirmOpen()"
        title="Supprimer l'activité"
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
    .activites-page-container {
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
      color: var(--text-secondary, #64748b);
    }

    .action-edit:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--text-primary, #0f172a);
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
export class ActivitesListPageComponent implements OnInit {
  private readonly activiteService = inject(ActiviteService);
  private readonly membreService = inject(MembreService);
  private readonly contextService = inject(OrganisationContextService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);
  private readonly datePipe = new DatePipe('fr-FR');

  // Données & État
  public readonly activites = signal<Activite[]>([]);
  public readonly totalItems = signal<number>(0);
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(15);
  public readonly isExporting = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  // Membres pour assignation de responsable
  public readonly availableMembres = signal<Membre[]>([]);

  // Filtres
  public readonly searchQuery = signal<string>('');
  public readonly selectedStatut = signal<ActiviteStatut | 'tous'>('tous');
  public readonly selectedType = signal<string>('tous');

  // Modaux
  public readonly selectedActivite = signal<Activite | null>(null);
  public readonly isDetailModalOpen = signal<boolean>(false);

  public readonly selectedActiviteForEdit = signal<Activite | null>(null);
  public readonly isFormModalOpen = signal<boolean>(false);

  public readonly isDeleteConfirmOpen = signal<boolean>(false);
  public readonly activiteToDelete = signal<Activite | null>(null);
  public readonly isDeleting = signal<boolean>(false);

  // Contexte & Permissions
  public readonly orgContext = this.contextService.context;
  public readonly typeOrganisation = this.contextService.typeOrganisation;

  public readonly canViewActivites = computed(() => {
    return this.permissionService.hasAnyPermission(['activites.view', 'activites.manage']);
  });

  public readonly canCreateActivite = computed(() => {
    return this.permissionService.hasAnyPermission(['activites.create', 'activites.manage']);
  });

  public readonly canEditActivite = computed(() => {
    return this.permissionService.hasAnyPermission(['activites.edit', 'activites.manage']);
  });

  public readonly canDeleteActivite = computed(() => {
    return this.permissionService.hasPermission('activites.manage');
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
      this.selectedType() !== 'tous'
    );
  });

  public readonly enCoursCount = computed(() => {
    return this.activites().filter(
      (a) => a.statut === 'planifiee' || a.statut === 'en_cours'
    ).length;
  });

  public readonly termineesCount = computed(() => {
    return this.activites().filter((a) => a.statut === 'terminee').length;
  });

  public readonly deleteConfirmMessage = computed(() => {
    const a = this.activiteToDelete();
    if (!a) return 'Confirmez-vous la suppression de cette activité ?';
    return `Êtes-vous sûr de vouloir supprimer l'activité "${a.titre}" ? Cette action est irréversible.`;
  });

  public readonly columns: TableColumn<Activite>[] = [
    {
      key: 'titre',
      label: 'Activité',
      sortable: true,
      formatter: (val, row) => (row.code ? `[${row.code}] ${row.titre}` : row.titre),
    },
    {
      key: 'type_activite',
      label: 'Type',
      width: '130px',
      formatter: (val) => val || 'Générale',
    },
    {
      key: 'date_debut',
      label: 'Date & Heure',
      sortable: true,
      width: '180px',
      formatter: (val) => {
        if (!val) return '—';
        try {
          const d = new Date(val);
          return isNaN(d.getTime()) ? val : d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return val;
        }
      },
    },
    {
      key: 'lieu',
      label: 'Lieu',
      formatter: (val) => val || '—',
    },
    {
      key: 'responsable',
      label: 'Responsable',
      formatter: (val, row) => row.responsable?.nom_complet || '—',
    },
    {
      key: 'taux_execution',
      label: 'Avancement',
      align: 'center',
      width: '110px',
      formatter: (val) => `${val ?? 0}%`,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      width: '120px',
      formatter: (val) => {
        switch (val) {
          case 'planifiee': return 'Planifiée';
          case 'en_cours': return 'En cours';
          case 'terminee': return 'Terminée';
          case 'annulee': return 'Annulée';
          case 'brouillon': return 'Brouillon';
          default: return val || '—';
        }
      },
    },
  ];

  public ngOnInit(): void {
    this.loadActivites();
    this.loadMembres();
  }

  public loadActivites(): void {
    if (!this.canViewActivites()) {
      this.errorMessage.set('Vous ne disposez pas des permissions requises pour consulter la liste des activités.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: ActiviteFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchQuery().trim() || undefined,
      statut: this.selectedStatut() !== 'tous' ? this.selectedStatut() : undefined,
      type_activite: this.selectedType() !== 'tous' ? this.selectedType() : undefined,
    };

    this.activiteService.getActivites(params).subscribe({
      next: (response) => {
        this.activites.set(response.data);
        this.totalItems.set(response.meta.total);
        this.currentPage.set(response.meta.current_page);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Impossible de récupérer la liste des activités.';
        this.errorMessage.set(msg);
        this.toast.error('Erreur', msg);
      },
    });
  }

  public exportCsv(): void {
    this.isExporting.set(true);
    const filters: ActiviteFilterParams = {};
    if (this.searchQuery().trim()) filters.search = this.searchQuery().trim();
    if (this.selectedStatut() !== 'tous') filters.statut = this.selectedStatut() as ActiviteStatut;
    if (this.selectedType() !== 'tous') filters.type_activite = this.selectedType();

    this.exportService.exportActivitesCsv(filters).subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const filename = `activites-${new Date().toISOString().slice(0, 10)}.csv`;
        this.exportService.downloadBlob(blob, filename);
        this.toast.success('Export réussi', 'La liste des activités a été exportée.');
      },
      error: () => {
        this.isExporting.set(false);
        this.toast.error('Erreur', "Échec de l'exportation des activités");
      },
    });
  }

  public loadMembres(): void {
    this.membreService.getMembres({ per_page: 100, statut: 'actif' }).subscribe({
      next: (res) => {
        this.availableMembres.set(res.data);
      },
      error: () => {
        // En cas d'erreur sur les membres, la liste reste vide sans bloquer la page
      },
    });
  }

  public onSearchChange(term: string): void {
    this.searchQuery.set(term);
    this.currentPage.set(1);
    this.loadActivites();
  }

  public onStatutChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ActiviteStatut | 'tous';
    this.selectedStatut.set(val);
    this.currentPage.set(1);
    this.loadActivites();
  }

  public onTypeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedType.set(val);
    this.currentPage.set(1);
    this.loadActivites();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatut.set('tous');
    this.selectedType.set('tous');
    this.currentPage.set(1);
    this.loadActivites();
  }

  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.loadActivites();
  }

  // Consultation Détaillée
  public openDetailModal(a: Activite): void {
    this.selectedActivite.set(a);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedActivite.set(null);
  }

  public onDetailEditRequested(a: Activite): void {
    this.closeDetailModal();
    this.openEditModal(a);
  }

  // Création & Modification
  public openCreateModal(): void {
    this.selectedActiviteForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  public openEditModal(a: Activite): void {
    this.selectedActiviteForEdit.set(a);
    this.isFormModalOpen.set(true);
  }

  public closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedActiviteForEdit.set(null);
  }

  public onActiviteSaved(): void {
    this.closeFormModal();
    this.loadActivites();
  }

  // Suppression
  public openDeleteConfirm(a: Activite): void {
    this.activiteToDelete.set(a);
    this.isDeleteConfirmOpen.set(true);
  }

  public closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.activiteToDelete.set(null);
  }

  public onDeleteConfirmed(): void {
    const a = this.activiteToDelete();
    if (!a) return;

    this.isDeleting.set(true);
    this.activiteService.deleteActivite(a.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Activité supprimée', `L'activité "${a.titre}" a été supprimée avec succès.`);
        this.closeDeleteConfirm();
        this.loadActivites();
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || err.message || 'Impossible de supprimer cette activité.';
        this.toast.error('Erreur de suppression', msg);
      },
    });
  }
}
