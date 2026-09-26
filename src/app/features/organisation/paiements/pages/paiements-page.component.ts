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
import { RecuModalComponent } from '../components/recu-modal.component';
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  CampagnePelerinage,
  PaiementPelerinage,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-paiements-page',
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
    RecuModalComponent,
  ],
  template: `
    <div class="paiements-page-container">
      <app-page-header
        title="Journal des Règlements & Paiements"
        subtitle="Traçabilité certifiée des encaissements, reçus de caisse et justificatifs"
        badge="Finances"
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
            variant="secondary"
            icon="printer"
            (btnClick)="printJournal()"
          >
            Imprimer le journal
          </app-btn>
        </div>
      </app-page-header>

      <!-- Sélecteur de Campagne -->
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
              {{ c.nom }} — {{ c.destination }}
            </option>
          }
        </select>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Total encaissé"
          [value]="formatAmount(totalEncaisse())"
          subtitle="Recettes nettes enregistrées"
          icon="bi bi-cash-coin"
          theme="success"
        />

        <app-stat-card
          title="Nombre de versements"
          [value]="totalPaiements()"
          subtitle="Transactions validées"
          icon="bi bi-receipt"
          theme="primary"
        />

        <app-stat-card
          title="Versement moyen"
          [value]="formatAmount(paiementMoyen())"
          subtitle="Ticket moyen par reçu"
          icon="bi bi-calculator"
          theme="accent"
        />

        <app-stat-card
          title="Modes utilisés"
          [value]="modesCount()"
          subtitle="Espèces, Mobile Money, etc."
          icon="bi bi-credit-card-2-front"
          theme="warning"
        />
      </div>

      <!-- Filtres et recherche -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par référence reçu, nom participant..."
          [hasActiveFilters]="hasActiveFilters()"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        >
          <div class="filters-wrap">
            <select
              [value]="selectedModeFilter()"
              (change)="onModeFilterChange($event)"
              class="filter-select"
              aria-label="Mode de paiement"
            >
              <option value="tous">Tous les modes</option>
              <option value="especes">Espèces</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement bancaire</option>
            </select>
          </div>
        </app-filter-bar>
      </div>

      <!-- Erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadPaiements()"
          />
        </div>
      }

      <!-- Tableau des paiements -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="filteredPaiements()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun paiement trouvé"
            emptySubtitle="Aucun encaissement ne correspond aux critères sélectionnés."
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

      <ng-template #rowActionsTpl let-p>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-btn action-view"
            (click)="openRecuModal(p)"
            title="Consulter le reçu officiel"
            aria-label="Reçu"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="action-btn action-print"
            (click)="openRecuModalAndPrint(p)"
            title="Imprimer / Télécharger le reçu"
            aria-label="Imprimer"
          >
            <i class="bi bi-printer"></i>
          </button>
        </div>
      </ng-template>

      <!-- Modal Reçu officiel -->
      <app-recu-modal
        [isOpen]="isRecuModalOpen()"
        [paiement]="selectedPaiementForRecu()"
        [campagneNom]="currentCampagneNom()"
        (close)="isRecuModalOpen.set(false)"
      />
    </div>
  `,
  styles: [`
    .paiements-page-container {
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
      max-width: 500px;
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
    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-select {
      height: 38px;
      padding: 0 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background: var(--bg-surface, #ffffff);
      font-size: 0.85rem;
      color: var(--text-primary, #0f172a);
      outline: none;
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
    .action-view:hover {
      border-color: var(--primary-400, #60a5fa);
      color: var(--primary-600, #2563eb);
    }
    .action-print:hover {
      border-color: #10b981;
      color: #059669;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementsPageComponent implements OnInit {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly campagnes = signal<CampagnePelerinage[]>([]);
  public readonly selectedCampagneId = signal<string>('');
  public readonly paiements = signal<PaiementPelerinage[]>([]);
  public readonly totalItems = signal<number>(0);
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(20);

  public readonly searchQuery = signal<string>('');
  public readonly selectedModeFilter = signal<string>('tous');

  public readonly isRecuModalOpen = signal<boolean>(false);
  public readonly selectedPaiementForRecu = signal<PaiementPelerinage | null>(null);

  public readonly currentCampagne = computed(() => {
    return this.campagnes().find((c) => String(c.id) === this.selectedCampagneId()) || null;
  });

  public readonly currentCampagneNom = computed(() => {
    const c = this.currentCampagne();
    return c?.nom || '';
  });

  public readonly totalEncaisse = computed(() => {
    return this.paiements().reduce((acc, p) => acc + (p.montant || 0), 0);
  });

  public readonly totalPaiements = computed(() => this.paiements().length);

  public readonly paiementMoyen = computed(() => {
    const count = this.totalPaiements();
    return count > 0 ? Math.round(this.totalEncaisse() / count) : 0;
  });

  public readonly modesCount = computed(() => {
    const set = new Set(this.paiements().map((p) => p.mode_paiement));
    return `${set.size} mode(s)`;
  });

  public readonly hasActiveFilters = computed(
    () => this.searchQuery().length > 0 || this.selectedModeFilter() !== 'tous'
  );

  public readonly filteredPaiements = computed(() => {
    let list = this.paiements();
    const mode = this.selectedModeFilter();
    if (mode !== 'tous') {
      list = list.filter((p) => p.mode_paiement === mode);
    }
    return list;
  });

  public readonly columns: TableColumn<PaiementPelerinage>[] = [
    {
      key: 'reference_recu',
      label: 'Réf. Reçu',
      width: '140px',
      formatter: (val, row) => val || row.reference || '—',
    },
    {
      key: 'participant',
      label: 'Participant / Pèlerin',
      sortable: true,
      formatter: (_, row) =>
        row.inscription
          ? `${row.inscription.nom} ${row.inscription.prenoms}`
          : 'Pèlerin',
    },
    {
      key: 'montant',
      label: 'Montant versé',
      align: 'right',
      sortable: true,
      formatter: (val) => `+${formatCfa(val || 0)} F`,
    },
    {
      key: 'mode_paiement',
      label: 'Mode de règlement',
      align: 'center',
      formatter: (val) => (val ? String(val).toUpperCase() : 'ESPÈCES'),
    },
    {
      key: 'date_paiement',
      label: 'Date & Heure',
      sortable: true,
      formatter: (val) => (val ? new Date(val).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '—'),
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      formatter: () => 'Validé',
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
          this.loadPaiements();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossible de charger les campagnes.');
      },
    });
  }

  public loadPaiements(): void {
    const cid = this.selectedCampagneId();
    if (!cid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pelerinageService
      .getCampagnePaiements(cid, {
        search: this.searchQuery().trim() || undefined,
        page: this.currentPage(),
        per_page: this.perPage(),
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.paiements.set(data);
          this.totalItems.set(meta.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Impossible de charger les paiements.');
        },
      });
  }

  public onCampagneChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCampagneId.set(val);
    this.currentPage.set(1);
    this.loadPaiements();
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.loadPaiements();
  }

  public onModeFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedModeFilter.set(val);
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedModeFilter.set('tous');
    this.currentPage.set(1);
    this.loadPaiements();
  }

  public onPageChange(evt: PageChangeEvent): void {
    this.currentPage.set(evt.page);
    this.perPage.set(evt.perPage);
    this.loadPaiements();
  }

  public refreshData(): void {
    this.loadPaiements();
    this.toast.info('Actualisation', 'Rechargement des paiements...');
  }

  public openRecuModal(p: PaiementPelerinage): void {
    this.selectedPaiementForRecu.set(p);
    this.isRecuModalOpen.set(true);
  }

  public openRecuModalAndPrint(p: PaiementPelerinage): void {
    this.selectedPaiementForRecu.set(p);
    this.isRecuModalOpen.set(true);
    setTimeout(() => {
      window.print();
    }, 400);
  }

  public printJournal(): void {
    window.print();
  }

  public formatAmount(val: number): string {
    return formatCfa(val);
  }
}
