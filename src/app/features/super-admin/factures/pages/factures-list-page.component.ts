import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { FactureService } from '../services/facture.service';
import {
  Facture,
  FactureFilterParams,
  FactureStatut,
} from '../models/facture.model';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { FactureStatusBadgeComponent } from '../components/facture-status-badge/facture-status-badge.component';

@Component({
  selector: 'app-factures-list-page',
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
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Facturation "
        subtitle="Historique des factures émises, calcul de la TVA et documents comptables"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Factures' }
        ]"
      >
        <div page-actions class="d-flex gap-2">
          <app-btn
            [variant]="'outline'"
            [size]="'md'"
            (btnClick)="navigateToEcheances()"
          >
            <i class="bi bi-calendar-check me-1"></i>
            <span>Échéances</span>
          </app-btn>

          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToPaiements()"
          >
            <i class="bi bi-cash-stack me-1"></i>
            <span>Paiements</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de Filtres -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher par référence, description ou paroisse...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearchChange($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <!-- Filtre Statut -->
          <select
            [value]="filterStatut()"
            (change)="onStatutFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par statut"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>

          <!-- Filtre Date Début -->
          <div class="date-filter-group">
            <label class="date-label" for="date-debut-facture">Du :</label>
            <input
              id="date-debut-facture"
              type="date"
              [value]="filterDateDebut()"
              (change)="onDateDebutChange($event)"
              class="filter-date-input"
            />
          </div>

          <!-- Filtre Date Fin -->
          <div class="date-filter-group">
            <label class="date-label" for="date-fin-facture">Au :</label>
            <input
              id="date-fin-facture"
              type="date"
              [value]="filterDateFin()"
              (change)="onDateFinChange($event)"
              class="filter-date-input"
            />
          </div>

          <!-- Bouton Actualiser -->
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
          title="Impossible de charger les factures"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des factures -->
        <app-table
          [columns]="columns"
          [data]="factures()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucune facture trouvée"
          emptySubtitle="Aucune pièce comptable ne correspond à vos critères de recherche."
        />

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
      <ng-template #rowActionsTpl let-f>
        <div class="table-actions">
          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="navigateToDetail(f.id)"
            title="Consulter et imprimer la facture"
          >
            <i class="bi bi-receipt"></i>
          </app-btn>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }

    .d-flex { display: flex; }
    .gap-2 { gap: 0.5rem; }

    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .filter-select, .filter-date-input {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      color: #1e293b;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md, 0.375rem);
      outline: none;
    }

    .date-filter-group {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .date-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturesListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly factureService = inject(FactureService);
  private readonly cfaPipe = inject(CurrencyCfaPipe);

  protected readonly factures = signal<Facture[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly perPage = signal<number>(15);
  protected readonly totalItems = signal<number>(0);

  // Filters
  protected readonly filterSearch = signal<string>('');
  protected readonly filterStatut = signal<FactureStatut | 'tous'>('tous');
  protected readonly filterDateDebut = signal<string>('');
  protected readonly filterDateFin = signal<string>('');

  protected readonly hasActiveFilters = computed<boolean>(() => {
    return (
      !!this.filterSearch() ||
      this.filterStatut() !== 'tous' ||
      !!this.filterDateDebut() ||
      !!this.filterDateFin()
    );
  });

  protected readonly columns: TableColumn<Facture>[] = [
    {
      key: 'reference',
      label: 'Réf. Facture',
      sortable: true,
      width: '140px',
    },
    {
      key: 'date_facture',
      label: 'Émission',
      sortable: true,
      width: '110px',
      formatter: (v) => {
        if (!v) return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
      },
    },
    {
      key: 'date_echeance',
      label: 'Échéance',
      sortable: true,
      width: '110px',
      formatter: (v) => {
        if (!v) return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
      },
    },
    {
      key: 'paroisse',
      label: 'Paroisse',
      width: '190px',
      formatter: (_, row) =>
        row.echeance?.abonnement?.paroisse?.nom_paroisse ||
        row.echeance?.abonnement?.paroisse_nom ||
        '-',
    },
    {
      key: 'montant_ht',
      label: 'Montant HT',
      align: 'right',
      width: '120px',
      formatter: (v) => this.cfaPipe.transform(v, 'XOF'),
    },
    {
      key: 'taux_tva',
      label: 'TVA',
      align: 'center',
      width: '70px',
      formatter: (v) => `${v}%`,
    },
    {
      key: 'montant_ttc',
      label: 'Total TTC',
      align: 'right',
      width: '130px',
      formatter: (v) => this.cfaPipe.transform(v, 'XOF'),
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '110px',
      align: 'center',
      formatter: (v) => {
        switch (v) {
          case 'payee':
            return 'Payée';
          case 'en_attente':
            return 'En attente';
          case 'annulee':
            return 'Annulée';
          default:
            return String(v || '-');
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

    const params: FactureFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
    };

    if (this.filterSearch()) {
      params.search = this.filterSearch();
    }
    if (this.filterStatut() !== 'tous') {
      params.statut = this.filterStatut();
    }
    if (this.filterDateDebut()) {
      params.date_debut = this.filterDateDebut();
    }
    if (this.filterDateFin()) {
      params.date_fin = this.filterDateFin();
    }

    this.factureService.getFactures(params).subscribe({
      next: (res) => {
        this.factures.set(res.data);
        this.currentPage.set(res.meta.current_page);
        this.perPage.set(res.meta.per_page);
        this.totalItems.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des factures.'
        );
        this.loading.set(false);
      },
    });
  }

  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.refresh();
  }

  public onSearchChange(term: string): void {
    this.filterSearch.set(term);
    this.currentPage.set(1);
    this.refresh();
  }

  public onStatutFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as FactureStatut | 'tous';
    this.filterStatut.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onDateDebutChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterDateDebut.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onDateFinChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterDateFin.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onResetFilters(): void {
    this.filterSearch.set('');
    this.filterStatut.set('tous');
    this.filterDateDebut.set('');
    this.filterDateFin.set('');
    this.currentPage.set(1);
    this.refresh();
  }

  public navigateToEcheances(): void {
    this.router.navigate(['/super-admin/echeances']);
  }

  public navigateToPaiements(): void {
    this.router.navigate(['/super-admin/paiements']);
  }

  public navigateToDetail(id: string | number): void {
    this.router.navigate(['/super-admin/factures', id]);
  }
}
