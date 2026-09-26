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
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CatechumeneDetailModalComponent } from '../components/catechumene-detail-modal/catechumene-detail-modal.component';
import { CatheoPopulationService } from '../services/catheo-population.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ExportService } from '../../exports/services/export.service';
import { PrintService } from '../../../../core/services/print.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import {
  CatechumeneItem,
  CatheoPopulationFilterParams,
  CatheoStatusSummary,
  SectionCode,
} from '../models/catheo-population.model';

@Component({
  selector: 'app-catheo-population-page',
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
    CardComponent,
    CatechumeneDetailModalComponent,
  ],
  template: `
    <div class="catheo-population-page-container">
      <!-- En-tête de page officiel CATHEO -->
      <app-page-header
        [title]="pageTitle()"
        [subtitle]="pageSubtitle()"
        [badge]="organisationBadge()"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="refreshAll()"
          >
            Actualiser
          </app-btn>

          @if (isCatheoConnected() && totalItems() > 0) {
            <app-btn
              variant="outline"
              icon="file-earmark-arrow-down"
              [loading]="isExporting()"
              (btnClick)="exportCsv()"
            >
              Exporter CSV
            </app-btn>

            <app-btn
              variant="outline"
              icon="printer"
              (btnClick)="printPopulation()"
            >
              Imprimer
            </app-btn>
          }
        </div>
      </app-page-header>

      <!-- ÉTAT AUTONOME : Si non connecté à CATHEO -->
      @if (summaryLoaded() && !isCatheoConnected()) {
        <div class="mt-6">
          <app-card>
            <div class="autonomous-notice">
              <div class="notice-icon">
                <i class="bi bi-cloud-slash"></i>
              </div>
              <div class="notice-content">
                <h3 class="notice-title">Population CATHEO indisponible</h3>
                <p class="notice-desc">
                  {{ catheoSummary()?.message || "La connexion avec le système central CATHEO n'est pas activée pour cette organisation. Aucun catéchumène ne peut être affiché en mode autonome." }}
                </p>
                <div class="notice-info">
                  <span class="info-badge">Mode Autonome</span>
                  <span class="info-text">
                    Organisation : {{ organisationNom() }} ({{ typeOrganisation() }})
                  </span>
                </div>
              </div>
            </div>
          </app-card>
        </div>
      }

      <!-- MODE CONNECTÉ : Synthèse, Filtres et Table -->
      @if (!summaryLoaded() || isCatheoConnected()) {
        <!-- Synthèse Pastorale (KPIs adaptés selon le type d'organisation) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <!-- Total Général de la cohorte -->
          <app-stat-card
            [title]="kpiTotalLabel()"
            [value]="kpiTotalValue()"
            [subtitle]="kpiTotalSubtitle()"
            icon="bi bi-people-fill"
            theme="primary"
          />

          <!-- KPI Secondaire 1 (ex: Primaire pour OPPE, Année active pour OPPJ/OPPA) -->
          <app-stat-card
            [title]="kpiSec1Label()"
            [value]="kpiSec1Value()"
            [subtitle]="kpiSec1Subtitle()"
            [icon]="kpiSec1Icon()"
            [theme]="kpiSec1Theme()"
          />

          <!-- KPI Secondaire 2 (ex: Collège pour OPPE, Niveaux pour OPPJ/OPPA) -->
          <app-stat-card
            [title]="kpiSec2Label()"
            [value]="kpiSec2Value()"
            [subtitle]="kpiSec2Subtitle()"
            [icon]="kpiSec2Icon()"
            [theme]="kpiSec2Theme()"
          />
        </div>

        <!-- Barre de recherche et filtres de population -->
        <div class="mt-6">
          <app-filter-bar
            searchPlaceholder="Rechercher par nom, prénom, matricule..."
            [hasActiveFilters]="hasActiveFilters()"
            (searchChange)="onSearchChange($event)"
            (resetFilters)="onResetFilters()"
          >
            <div class="filters-wrap">
              <!-- Filtre Genre -->
              <select
                [value]="selectedSexe()"
                (change)="onSexeChange($event)"
                class="filter-select"
                aria-label="Filtrer par genre"
              >
                <option value="tous">Tous les genres</option>
                <option value="M">Garçons / Hommes (M)</option>
                <option value="F">Filles / Femmes (F)</option>
              </select>

              <!-- Filtre Niveau (si disponible dans les métadonnées CATHEO) -->
              @if (availableNiveaux().length > 0) {
                <select
                  [value]="selectedNiveauId()"
                  (change)="onNiveauChange($event)"
                  class="filter-select"
                  aria-label="Filtrer par niveau"
                >
                  <option value="">Tous les niveaux</option>
                  @for (n of availableNiveaux(); track n.niveau_id) {
                    <option [value]="n.niveau_id">{{ n.niveau }} ({{ n.total }})</option>
                  }
                </select>
              }

              <!-- Filtre Classe (si disponible dans les métadonnées CATHEO) -->
              @if (availableClasses().length > 0) {
                <select
                  [value]="selectedClasseId()"
                  (change)="onClasseChange($event)"
                  class="filter-select"
                  aria-label="Filtrer par classe"
                >
                  <option value="">Toutes les classes</option>
                  @for (c of availableClasses(); track c.classe_id) {
                    <option [value]="c.classe_id">{{ c.classe }} ({{ c.total }})</option>
                  }
                </select>
              }
            </div>
          </app-filter-bar>
        </div>

        <!-- État d'erreur -->
        @if (errorMessage() && !isLoading()) {
          <div class="mt-6">
            <app-error-state
              title="Erreur de chargement de la population"
              [message]="errorMessage()!"
              actionText="Réessayer"
              (action)="loadPopulation()"
            />
          </div>
        }

        <!-- Tableau des Catéchumènes -->
        @if (!errorMessage()) {
          <div class="mt-4 catheo-printable-document">
            <div class="print-document-header">
              <div class="print-org-name">{{ organisationNom() }}</div>
              <div class="print-parish-name">{{ paroisseNom() }}</div>
              <div class="print-doc-title">LISTE DE LA POPULATION CATHEO</div>
              <div class="print-doc-subtitle">{{ pageTitle() }} · Année catéchétique {{ activeAnneeCatechese() }}</div>
            </div>

            <app-table
              [columns]="columns"
              [data]="items()"
              [loading]="isLoading()"
              [hasActions]="true"
              [rowActionsTemplate]="rowActionsTpl"
              emptyMessage="Aucun catéchumène trouvé"
              emptySubtitle="Aucun catéchumène ne correspond à vos critères pour l'année catéchétique active."
            />

            <!-- Pagination officielle -->
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

        <!-- Actions de chaque ligne : CONSULTATION UNIQUEMENT -->
        <ng-template #rowActionsTpl let-row>
          <div class="row-actions-group">
            <button
              type="button"
              class="action-btn action-view"
              (click)="openDetailModal(row)"
              title="Consulter la fiche détaillée"
              aria-label="Voir la fiche"
            >
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </ng-template>

        <!-- Modal de Consultation Détaillée (Lecture Seule) -->
        <app-catechumene-detail-modal
          [isOpen]="isDetailModalOpen()"
          [item]="selectedItem()"
          (close)="closeDetailModal()"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .catheo-population-page-container {
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
      flex-wrap: wrap;
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
      gap: 0.375rem;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
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
      border-color: var(--color-primary-light, #e0e7ff);
    }

    /* Écran Mode Autonome */
    .autonomous-notice {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.5rem;
    }

    .notice-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg, 12px);
      background-color: var(--warning-50, #fffbeb);
      color: var(--warning-600, #d97706);
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .notice-content {
      flex: 1;
    }

    .notice-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      margin: 0 0 0.5rem 0;
    }

    .notice-desc {
      font-size: 0.9375rem;
      color: var(--text-muted, #64748b);
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .notice-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .info-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--warning-100, #fef3c7);
      color: var(--warning-800, #92400e);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .info-text {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }

    @media (max-width: 640px) {
      .catheo-population-page-container {
        padding: 1rem;
      }
      .filters-wrap {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }
      .filter-select {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatheoPopulationPageComponent implements OnInit {
  private readonly populationService = inject(CatheoPopulationService);
  private readonly orgContextService = inject(OrganisationContextService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);
  private readonly printService = inject(PrintService);

  // État Réactif (Signals)
  public readonly isExporting = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly summaryLoaded = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  // Données
  public readonly items = signal<CatechumeneItem[]>([]);
  public readonly catheoSummary = signal<CatheoStatusSummary | null>(null);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(15);
  public readonly totalItems = signal<number>(0);

  // Filtres
  public readonly searchQuery = signal<string>('');
  public readonly selectedSexe = signal<'M' | 'F' | 'tous'>('tous');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');

  // Modal Détail
  public readonly isDetailModalOpen = signal<boolean>(false);
  public readonly selectedItem = signal<CatechumeneItem | null>(null);

  // Contexte Organisation
  public readonly organisationNom = computed(() => {
    return this.orgContextService.context()?.nom || "Organisation";
  });

  public readonly paroisseNom = computed(() => {
    return this.orgContextService.paroisse()?.nom_paroisse || 'Paroisse';
  });

  public readonly typeOrganisation = computed(() => {
    return this.orgContextService.typeOrganisation() || 'OPPE';
  });

  public readonly isCatheoConnected = computed(() => {
    const summary = this.catheoSummary();
    if (!summary) return true; // Valeur par défaut avant chargement
    return summary.catheo_connecte !== false;
  });

  public readonly activeAnneeCatechese = computed(() => {
    return this.catheoSummary()?.annee_catechese || 'Active';
  });

  // Badge du Header
  public readonly organisationBadge = computed(() => {
    const type = this.typeOrganisation();
    switch (type) {
      case 'OPPE':
        return 'OPPE — Enfants (Primaire & Collège)';
      case 'OPPJ':
        return 'OPPJ — Jeunes';
      case 'OPPA':
        return 'OPPA — Adultes';
      default:
        return type;
    }
  });

  // Titre & Sous-titre officiels
  public readonly pageTitle = computed(() => {
    const type = this.typeOrganisation();
    if (type === 'OPPE') return 'Population CATHEO — Enfants';
    if (type === 'OPPJ') return 'Population CATHEO — Jeunes';
    if (type === 'OPPA') return 'Population CATHEO — Adultes';
    return 'Population CATHEO';
  });

  public readonly pageSubtitle = computed(() => {
    const annee = this.activeAnneeCatechese();
    const paroisse = this.paroisseNom();
    return `${paroisse} • Année catéchétique active : ${annee}`;
  });

  // Filtres actifs
  public readonly hasActiveFilters = computed(() => {
    return (
      this.searchQuery().trim().length > 0 ||
      this.selectedSexe() !== 'tous' ||
      this.selectedNiveauId() !== '' ||
      this.selectedClasseId() !== ''
    );
  });

  // Options de filtres dynamiques (issus du dashboard/summary)
  public readonly availableNiveaux = computed(() => {
    return this.catheoSummary()?.repartition_niveaux || [];
  });

  public readonly availableClasses = computed(() => {
    return this.catheoSummary()?.repartition_classes || [];
  });

  // KPIs dynamiques
  public readonly kpiTotalLabel = computed(() => {
    const type = this.typeOrganisation();
    if (type === 'OPPE') return 'Total Enfants';
    if (type === 'OPPJ') return 'Total Jeunes';
    if (type === 'OPPA') return 'Total Adultes';
    return 'Total Population';
  });

  public readonly kpiTotalValue = computed(() => {
    const summary = this.catheoSummary();
    if (summary?.total_population !== undefined) return summary.total_population;
    return this.totalItems();
  });

  public readonly kpiTotalSubtitle = computed(() => {
    return `Année ${this.activeAnneeCatechese()}`;
  });

  // KPI Secondaire 1
  public readonly kpiSec1Label = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'Primaire (SEC-ENFANTS-PRI)';
    return 'Année Catéchétique';
  });

  public readonly kpiSec1Value = computed(() => {
    if (this.typeOrganisation() === 'OPPE') {
      return this.catheoSummary()?.total_primaire ?? 0;
    }
    return this.activeAnneeCatechese();
  });

  public readonly kpiSec1Subtitle = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'Effectif cycle primaire';
    return 'Session pastorale active';
  });

  public readonly kpiSec1Icon = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'bi bi-backpack-fill';
    return 'bi bi-calendar-check-fill';
  });

  public readonly kpiSec1Theme = computed((): 'primary' | 'success' | 'warning' | 'info' => {
    if (this.typeOrganisation() === 'OPPE') return 'success';
    return 'info';
  });

  // KPI Secondaire 2
  public readonly kpiSec2Label = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'Collège (SEC-ENFANTS-COL)';
    return 'Niveaux Déployés';
  });

  public readonly kpiSec2Value = computed(() => {
    if (this.typeOrganisation() === 'OPPE') {
      return this.catheoSummary()?.total_college ?? 0;
    }
    return this.availableNiveaux().length || (this.typeOrganisation() === 'OPPJ' ? 5 : 4);
  });

  public readonly kpiSec2Subtitle = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'Effectif cycle collège';
    return 'Paliers de formation catéchétique';
  });

  public readonly kpiSec2Icon = computed(() => {
    if (this.typeOrganisation() === 'OPPE') return 'bi bi-mortarboard-fill';
    return 'bi bi-layers-fill';
  });

  public readonly kpiSec2Theme = computed((): 'primary' | 'success' | 'warning' | 'info' => {
    if (this.typeOrganisation() === 'OPPE') return 'warning';
    return 'primary';
  });

  // Configuration des Colonnes du Tableau
  public readonly columns: TableColumn<CatechumeneItem>[] = [
    {
      key: 'matricule',
      label: 'Matricule',
      sortable: false,
      width: '130px',
      formatter: (_val, row) => row.catechumene?.matricule || row.code_inscription || '—',
    },
    {
      key: 'nom_complet',
      label: 'Nom & Prénoms',
      sortable: false,
      formatter: (_val, row) =>
        row.catechumene?.nom_complet ||
        (row.catechumene ? `${row.catechumene.nom} ${row.catechumene.prenoms}`.trim() : '—'),
    },
    {
      key: 'sexe',
      label: 'Genre',
      sortable: false,
      width: '90px',
      align: 'center',
      formatter: (_val, row) => {
        const s = row.catechumene?.sexe;
        return s === 'M' ? 'M' : s === 'F' ? 'F' : '—';
      },
    },
    {
      key: 'section',
      label: 'Section Pastorale',
      sortable: false,
      width: '180px',
      formatter: (_val, row) => row.section?.nom || row.section?.code || '—',
    },
    {
      key: 'niveau',
      label: 'Niveau',
      sortable: false,
      width: '130px',
      formatter: (_val, row) => row.niveau?.nom || '—',
    },
    {
      key: 'classe',
      label: 'Classe',
      sortable: false,
      width: '140px',
      formatter: (_val, row) => row.classe?.nom || 'Non assigné',
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: false,
      width: '110px',
      align: 'center',
      formatter: (_val, row) => row.statut_inscription || 'Inscrit',
    },
  ];

  public ngOnInit(): void {
    this.refreshAll();
  }

  public refreshAll(): void {
    this.loadSummary();
    this.loadPopulation();
  }

  public loadSummary(): void {
    this.populationService.getCatheoSummary().subscribe({
      next: (summary) => {
        this.catheoSummary.set(summary);
        this.summaryLoaded.set(true);
      },
      error: () => {
        this.summaryLoaded.set(true);
        // Si le dashboard échoue, on continue avec le mode nominal
      },
    });
  }

  public loadPopulation(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params: CatheoPopulationFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchQuery().trim() || undefined,
      sexe: this.selectedSexe(),
      niveau_id: this.selectedNiveauId() || undefined,
      classe_id: this.selectedClasseId() || undefined,
    };

    this.populationService.getPopulation(params).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.totalItems.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 403) {
          this.errorMessage.set(
            "Accès refusé : votre organisation n'a pas l'autorisation de consulter cette population catéchétique."
          );
        } else if (err?.status === 401) {
          this.errorMessage.set('Session expirée. Veuillez vous reconnecter.');
        } else {
          this.errorMessage.set(
            'Impossible de charger la population CATHEO. Veuillez vérifier votre connexion ou réessayer.'
          );
        }
      },
    });
  }

  // Gestion des Filtres
  public onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadPopulation();
  }

  public onSexeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'M' | 'F' | 'tous';
    this.selectedSexe.set(val);
    this.currentPage.set(1);
    this.loadPopulation();
  }

  public onNiveauChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedNiveauId.set(val);
    this.currentPage.set(1);
    this.loadPopulation();
  }

  public onClasseChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedClasseId.set(val);
    this.currentPage.set(1);
    this.loadPopulation();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedSexe.set('tous');
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.currentPage.set(1);
    this.loadPopulation();
  }

  // Pagination
  public onPageChange(event: PageChangeEvent): void {
    this.currentPage.set(event.page);
    this.perPage.set(event.perPage);
    this.loadPopulation();
  }

  // Consultation Détaillée
  public openDetailModal(item: CatechumeneItem): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedItem.set(null);
  }

  public exportCsv(): void {
    const list = this.items();
    if (list.length === 0) {
      this.toast.info('Information', 'Aucune donnée à exporter.');
      return;
    }
    const orgCode = this.typeOrganisation();
    this.exportService.exportCatheoPopulationCsv(list, orgCode);
    this.toast.success('Export réussi', 'Export de la population généré avec succès.');
  }

  public printPopulation(): void {
    const title = `${this.pageTitle()} - ${this.organisationNom()}`;
    this.printService.printDocument(title);
  }
}
