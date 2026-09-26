import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { SuperAdminOrganisationService } from '../services/super-admin-organisation.service';
import {
  SuperAdminOrganisation,
  OrganisationType,
  OrganisationStatut,
  OrganisationMode,
  OrganisationsFilterParams,
} from '../models/super-admin-organisation.model';
import { FirstResponsableModalComponent } from '../components/first-responsable-modal/first-responsable-modal.component';
import { OrganisationCreateModalComponent } from '../components/organisation-create-modal/organisation-create-modal.component';

@Component({
  selector: 'app-organisations-list-page',
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
    FirstResponsableModalComponent,
    OrganisationCreateModalComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Organisations & Espaces Métier"
        subtitle="Supervision multi-tenant des espaces OPPE, OPPJ et OPPA rattachés aux paroisses"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Organisations' }
        ]"
      >
        <div page-actions class="d-flex gap-2">
          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="openCreateModal()"
          >
            <i class="bi bi-plus-lg me-1"></i>
            <span>Nouvelle organisation</span>
          </app-btn>

          <app-btn
            [variant]="'ghost'"
            [size]="'md'"
            (btnClick)="refresh()"
            [loading]="loading()"
            title="Rafraîchir les données"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de Filtres -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher par nom, code ou paroisse...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearchChange($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <!-- Filtre Mode -->
          <select
            [value]="filterMode()"
            (change)="onModeFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par mode d'organisation"
          >
            <option value="tous">Tous les modes (Liée / Indépendante)</option>
            <option value="liee">Liée à une paroisse</option>
            <option value="independant">Indépendante</option>
          </select>

          <!-- Filtre Type d'organisation -->
          <select
            [value]="filterType()"
            (change)="onTypeFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par type d'organisation"
          >
            <option value="tous">Tous les types (OPPE, OPPJ, OPPA)</option>
            <option value="OPPE">OPPE · Office Paroissial de la Pastorale des Enfants</option>
            <option value="OPPJ">OPPJ · Office Paroissial de la Pastorale des Jeunes</option>
            <option value="OPPA">OPPA · Office Paroissial de la Pastorale des Adultes</option>
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
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </app-filter-bar>


      <!-- Erreur API -->
      @if (hasError()) {
        <app-error-state
          title="Impossible de charger les organisations"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des organisations -->
        <app-table
          [columns]="columns"
          [data]="organisations()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucune organisation trouvée"
          emptySubtitle="Aucun espace organisationnel ne correspond aux critères sélectionnés."
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
      <ng-template #rowActionsTpl let-org>
        <div class="table-actions">
          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="openResponsableModal(org)"
            [title]="org.responsable_nom ? 'Réassigner le responsable' : 'Créer le premier responsable'"
          >
            <i class="bi bi-person-plus"></i>
          </app-btn>

          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="navigateToDetail(org.id)"
            title="Consulter la fiche détaillée"
          >
            <i class="bi bi-eye me-1"></i>
            <span>Détail</span>
          </app-btn>
        </div>
      </ng-template>

      <!-- Modale de création d'organisation autonome -->
      <app-organisation-create-modal
        [isOpen]="isCreateModalOpen()"
        (close)="closeCreateModal()"
        (created)="onOrganisationCreated()"
      />

      <!-- Modale de provisionnement premier responsable -->
      @if (selectedOrgForResponsable()) {
        <app-first-responsable-modal
          [isOpen]="isResponsableModalOpen()"
          [organisation]="selectedOrgForResponsable()!"
          (close)="closeResponsableModal()"
          (responsableCreated)="onResponsableCreated()"
        />
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }
    .d-flex {
      display: flex;
    }
    .gap-2 {
      gap: 0.5rem;
    }
    .me-1 {
      margin-right: 0.25rem;
    }
    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .filter-select {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      color: #1e293b;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md, 0.375rem);
      outline: none;
    }
    .table-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.375rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly orgService = inject(SuperAdminOrganisationService);

  protected readonly organisations = signal<SuperAdminOrganisation[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly perPage = signal<number>(15);
  protected readonly totalItems = signal<number>(0);

  // Filters
  protected readonly filterSearch = signal<string>('');
  protected readonly filterType = signal<OrganisationType | 'tous'>('tous');
  protected readonly filterStatut = signal<OrganisationStatut | 'tous'>('tous');
  protected readonly filterMode = signal<OrganisationMode | 'tous'>('tous');

  // Modale création autonome organisation
  protected readonly isCreateModalOpen = signal<boolean>(false);

  // Modale premier responsable
  protected readonly isResponsableModalOpen = signal<boolean>(false);
  protected readonly selectedOrgForResponsable = signal<SuperAdminOrganisation | null>(null);

  protected readonly hasActiveFilters = computed<boolean>(() => {
    return (
      !!this.filterSearch() ||
      this.filterType() !== 'tous' ||
      this.filterStatut() !== 'tous' ||
      this.filterMode() !== 'tous'
    );
  });

  protected readonly columns: TableColumn<SuperAdminOrganisation>[] = [
    {
      key: 'nom',
      label: 'Organisation',
      sortable: true,
      width: '220px',
      formatter: (v, row) => `${v || row.code} (${row.code})`,
    },
    {
      key: 'type_organisation',
      label: 'Type',
      sortable: true,
      width: '130px',
      formatter: (v) => {
        switch (v) {
          case 'OPPE':
            return 'OPPE · Office Paroissial de la Pastorale des Enfants';
          case 'OPPJ':
            return 'OPPJ · Office Paroissial de la Pastorale des Jeunes';
          case 'OPPA':
            return 'OPPA · Office Paroissial de la Pastorale des Adultes';
          default:
            return String(v || '-');
        }
      },
    },
    {
      key: 'mode',
      label: 'Mode',
      width: '130px',
      align: 'center',
      formatter: (v, row) => {
        const mode = row.mode || (row.paroisse || row.paroisse_configuration_id || row.paroisse_id ? 'liee' : 'independant');
        return mode === 'independant' ? '🟣 Indépendante' : '🟢 Liée';
      },
    },
    {
      key: 'paroisse',
      label: 'Paroisse propriétaire',
      width: '200px',
      formatter: (_, row) => {
        const p = row.paroisse;
        if (!p) return 'Aucune (Indépendante)';
        const nom = p?.nom_paroisse || p?.nom || '-';
        const loc = p?.diocese || p?.ville;
        return loc ? `${nom} (${loc})` : nom;
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '100px',
      align: 'center',
      formatter: (v) => {
        switch (v) {
          case 'actif':
            return 'Actif';
          case 'inactif':
            return 'Inactif';
          case 'suspendu':
            return 'Suspendu';
          default:
            return String(v || '-');
        }
      },
    },
    {
      key: 'responsable',
      label: 'Responsable',
      width: '180px',
      formatter: (_, row) =>
        row.responsable_nom || row.responsable?.nom || 'Non assigné',
    },
    {
      key: 'users_count',
      label: 'Comptes',
      align: 'center',
      width: '90px',
      formatter: (v, row) =>
        String(v ?? row.statistiques?.total_utilisateurs ?? row.utilisateurs?.length ?? 0),
    },
  ];

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const params: OrganisationsFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
    };

    if (this.filterSearch()) {
      params.search = this.filterSearch();
    }
    if (this.filterType() !== 'tous') {
      params.type_organisation = this.filterType() as OrganisationType;
    }
    if (this.filterStatut() !== 'tous') {
      params.statut = this.filterStatut() as OrganisationStatut;
    }
    if (this.filterMode() !== 'tous') {
      params.mode = this.filterMode() as OrganisationMode;
    }

    this.orgService.getOrganisations(params).subscribe({
      next: (res) => {
        this.organisations.set(res.data);
        this.totalItems.set(res.meta.total);
        this.currentPage.set(res.meta.current_page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.hasError.set(true);
        if (err.status === 403) {
          this.errorMessage.set('Accès refusé. Privilèges Super Admin requis.');
        } else {
          this.errorMessage.set(
            err.error?.message ||
              'Une erreur est survenue lors de la récupération des organisations.'
          );
        }
      },
    });
  }

  public onSearchChange(search: string): void {
    this.filterSearch.set(search.trim());
    this.currentPage.set(1);
    this.refresh();
  }

  public onModeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterMode.set(select.value as OrganisationMode | 'tous');
    this.currentPage.set(1);
    this.refresh();
  }

  public onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterType.set(select.value as OrganisationType | 'tous');
    this.currentPage.set(1);
    this.refresh();
  }

  public onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatut.set(select.value as OrganisationStatut | 'tous');
    this.currentPage.set(1);
    this.refresh();
  }

  public onResetFilters(): void {
    this.filterSearch.set('');
    this.filterType.set('tous');
    this.filterStatut.set('tous');
    this.filterMode.set('tous');
    this.currentPage.set(1);
    this.refresh();
  }


  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.refresh();
  }

  public navigateToDetail(id: number | string): void {
    this.router.navigate(['/super-admin/organisations', id]);
  }

  public openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  public closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  public onOrganisationCreated(): void {
    this.refresh();
  }

  public openResponsableModal(org: SuperAdminOrganisation): void {
    this.selectedOrgForResponsable.set(org);
    this.isResponsableModalOpen.set(true);
  }

  public closeResponsableModal(): void {
    this.isResponsableModalOpen.set(false);
    this.selectedOrgForResponsable.set(null);
  }

  public onResponsableCreated(): void {
    this.refresh();
  }
}
