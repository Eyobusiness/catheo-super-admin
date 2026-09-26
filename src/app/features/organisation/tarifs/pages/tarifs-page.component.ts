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
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TarifModalComponent } from '../components/tarif-modal.component';
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  CampagnePelerinage,
  TarifPelerinage,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-tarifs-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    FilterBarComponent,
    TableComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    TarifModalComponent,
  ],
  template: `
    <div class="tarifs-page-container">
      <app-page-header
        title="Gestion des Tarifs"
        subtitle="Grille tarifaire des pèlerinages et voyages pastoraux par catégorie"
        badge="Tarifs"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="refreshData()"
          >
            Actualiser
          </app-btn>

          <app-btn
            variant="primary"
            icon="plus-lg"
            (btnClick)="openCreateModal()"
          >
            Nouveau tarif
          </app-btn>
        </div>
      </app-page-header>

      <!-- Sélection de la Campagne -->
      <div class="campagne-selector-card mt-6">
        <label for="campagneSelect" class="selector-label">
          <i class="bi bi-compass mr-1"></i> Campagne de pèlerinage :
        </label>
        <select
          id="campagneSelect"
          class="campagne-select"
          [value]="selectedCampagneId()"
          (change)="onCampagneChange($event)"
        >
          @for (c of campagnes(); track c.id) {
            <option [value]="c.id">
              {{ c.nom }} — {{ c.destination }} ({{ c.statut | uppercase }})
            </option>
          }
        </select>
      </div>

      <!-- KPI Cartes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Total des tarifs"
          [value]="totalTarifs()"
          subtitle="Grilles configurées"
          icon="bi bi-tags"
          theme="primary"
        />

        <app-stat-card
          title="Tarifs actifs"
          [value]="tarifsActifs()"
          subtitle="Ouverts aux inscriptions"
          icon="bi bi-check-circle"
          theme="success"
        />

        <app-stat-card
          title="Tarif minimum"
          [value]="formatAmount(montantMin())"
          subtitle="Prix plancher de la campagne"
          icon="bi bi-arrow-down-circle"
          theme="accent"
        />

        <app-stat-card
          title="Tarif maximum"
          [value]="formatAmount(montantMax())"
          subtitle="Prix plafond de la campagne"
          icon="bi bi-arrow-up-circle"
          theme="warning"
        />
      </div>

      <!-- Barre de recherche -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Filtrer par catégorie, description..."
          [hasActiveFilters]="searchQuery().length > 0"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        />
      </div>

      <!-- Erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadTarifs()"
          />
        </div>
      }

      <!-- Tableau des tarifs -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="filteredTarifs()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun tarif configuré"
            emptySubtitle="Créez votre première grille tarifaire pour cette campagne de pèlerinage."
          />
        </div>
      }

      <ng-template #rowActionsTpl let-t>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-btn action-edit"
            (click)="openEditModal(t)"
            title="Modifier ce tarif"
            aria-label="Modifier"
          >
            <i class="bi bi-pencil"></i>
          </button>

          <button
            type="button"
            class="action-btn"
            [class.action-deactivate]="t.statut === 'actif'"
            [class.action-activate]="t.statut !== 'actif'"
            (click)="toggleTarifStatus(t)"
            [title]="t.statut === 'actif' ? 'Désactiver ce tarif' : 'Activer ce tarif'"
            aria-label="Statut"
          >
            <i [class]="t.statut === 'actif' ? 'bi bi-slash-circle' : 'bi bi-check2-circle'"></i>
          </button>

          <button
            type="button"
            class="action-btn action-delete"
            (click)="openDeleteConfirm(t)"
            title="Supprimer ce tarif"
            aria-label="Supprimer"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </ng-template>

      <!-- Modal de création / édition -->
      <app-tarif-modal
        [isOpen]="isModalOpen()"
        [tarif]="selectedTarifForEdit()"
        [campagneId]="selectedCampagneId()"
        [campagnes]="campagnes()"
        (close)="closeModal()"
        (saved)="onTarifSaved()"
      />

      <!-- Dialogue de confirmation de suppression -->
      <app-confirm-dialog
        [isOpen]="isDeleteConfirmOpen()"
        title="Supprimer le tarif"
        [message]="deleteConfirmMessage()"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="danger"
        [loading]="isDeleting()"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteConfirm()"
      />
    </div>
  `,
  styles: [`
    .tarifs-page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .campagne-selector-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      box-shadow: var(--shadow-sm);
    }
    .selector-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      display: flex;
      align-items: center;
      white-space: nowrap;
    }
    .campagne-select {
      flex: 1;
      max-width: 480px;
      height: 40px;
      padding: 0 0.875rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background-color: var(--bg-surface, #ffffff);
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      cursor: pointer;
    }
    .campagne-select:focus {
      border-color: var(--primary-500, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .row-actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #ffffff);
      color: var(--text-secondary, #475569);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--text-primary, #0f172a);
    }
    .action-edit:hover {
      border-color: var(--primary-400, #60a5fa);
      color: var(--primary-600, #2563eb);
    }
    .action-deactivate:hover {
      border-color: #f59e0b;
      color: #d97706;
    }
    .action-activate:hover {
      border-color: #10b981;
      color: #059669;
    }
    .action-delete:hover {
      border-color: var(--danger-300, #fca5a5);
      color: var(--danger-600, #dc2626);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifsPageComponent implements OnInit {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly campagnes = signal<CampagnePelerinage[]>([]);
  public readonly selectedCampagneId = signal<string>('');
  public readonly tarifs = signal<TarifPelerinage[]>([]);
  public readonly searchQuery = signal<string>('');

  public readonly isModalOpen = signal<boolean>(false);
  public readonly selectedTarifForEdit = signal<TarifPelerinage | null>(null);

  public readonly isDeleteConfirmOpen = signal<boolean>(false);
  public readonly selectedTarifForDelete = signal<TarifPelerinage | null>(null);
  public readonly isDeleting = signal<boolean>(false);

  public readonly currentCampagneNom = computed(() => {
    const c = this.campagnes().find((x) => String(x.id) === this.selectedCampagneId());
    return c?.nom || '';
  });

  public readonly totalTarifs = computed(() => this.tarifs().length);
  public readonly tarifsActifs = computed(() => this.tarifs().filter((t) => t.statut === 'actif').length);

  public readonly montantMin = computed(() => {
    const list = this.tarifs();
    if (list.length === 0) return 0;
    return Math.min(...list.map((t) => t.montant));
  });

  public readonly montantMax = computed(() => {
    const list = this.tarifs();
    if (list.length === 0) return 0;
    return Math.max(...list.map((t) => t.montant));
  });

  public readonly filteredTarifs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.tarifs();
    return this.tarifs().filter(
      (t) =>
        (t.libelle || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  });

  public readonly deleteConfirmMessage = computed(() => {
    const t = this.selectedTarifForDelete();
    return t
      ? `Êtes-vous sûr de vouloir supprimer définitivement le tarif "${t.libelle}" ? Cette action est irréversible.`
      : '';
  });

  public readonly columns: TableColumn<TarifPelerinage>[] = [
    {
      key: 'libelle',
      label: 'Catégorie de tarif',
      sortable: true,
      formatter: (val) => val || 'Tarif standard',
    },
    {
      key: 'montant',
      label: 'Montant (FCFA)',
      sortable: true,
      align: 'right',
      formatter: (val) => `${formatCfa(val || 0)} F`,
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      formatter: (val) => (val === 'actif' ? 'Actif' : 'Inactif'),
    },
    {
      key: 'description',
      label: 'Description',
      formatter: (val) => val || '—',
    },
  ];

  public ngOnInit(): void {
    this.loadCampagnes();
  }

  public loadCampagnes(): void {
    this.isLoading.set(true);
    this.pelerinageService.getCampagnes().subscribe({
      next: ({ data }) => {
        this.campagnes.set(data);
        if (data.length > 0 && !this.selectedCampagneId()) {
          this.selectedCampagneId.set(String(data[0].id));
          this.loadTarifs();
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Impossible de charger les campagnes.');
      },
    });
  }

  public loadTarifs(): void {
    const cid = this.selectedCampagneId();
    if (!cid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pelerinageService.getTarifs(cid).subscribe({
      next: (list) => {
        this.tarifs.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Impossible de charger les tarifs.');
      },
    });
  }

  public onCampagneChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCampagneId.set(val);
    this.loadTarifs();
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
  }

  public refreshData(): void {
    this.loadTarifs();
    this.toast.info('Actualisation', 'Rechargement des tarifs...');
  }

  public openCreateModal(): void {
    if (!this.selectedCampagneId() && this.campagnes().length > 0) {
      this.selectedCampagneId.set(String(this.campagnes()[0].id));
    }
    this.selectedTarifForEdit.set(null);
    this.isModalOpen.set(true);
  }

  public openEditModal(tarif: TarifPelerinage): void {
    this.selectedTarifForEdit.set(tarif);
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedTarifForEdit.set(null);
  }

  public onTarifSaved(): void {
    this.closeModal();
    this.loadTarifs();
  }

  public toggleTarifStatus(tarif: TarifPelerinage): void {
    const cid = this.selectedCampagneId();
    const newStatus: 'actif' | 'inactif' = tarif.statut === 'actif' ? 'inactif' : 'actif';
    this.pelerinageService
      .updateTarif(cid, tarif.id, { statut: newStatus })
      .subscribe({
        next: (updated) => {
          this.toast.success(
            'Statut modifié',
            `Le tarif "${updated.libelle}" est désormais ${newStatus}.`
          );
          this.loadTarifs();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de modifier le statut du tarif.');
        },
      });
  }

  public openDeleteConfirm(tarif: TarifPelerinage): void {
    this.selectedTarifForDelete.set(tarif);
    this.isDeleteConfirmOpen.set(true);
  }

  public closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.selectedTarifForDelete.set(null);
  }

  public confirmDelete(): void {
    const t = this.selectedTarifForDelete();
    const cid = this.selectedCampagneId();
    if (!t || !cid) return;

    this.isDeleting.set(true);
    this.pelerinageService.deleteTarif(cid, t.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.toast.success('Supprimé', `Le tarif "${t.libelle}" a été supprimé.`);
        this.loadTarifs();
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || err.message || 'Impossible de supprimer ce tarif.';
        this.toast.error('Erreur de suppression', msg);
      },
    });
  }

  public formatAmount(val: number): string {
    return formatCfa(val);
  }
}
