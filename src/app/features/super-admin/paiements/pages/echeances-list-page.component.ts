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
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { ToastService } from '../../../../core/services/toast.service';
import { EcheanceService } from '../services/echeance.service';
import {
  EcheanceAbonnement,
  EcheanceFilterParams,
  EcheanceStatut,
} from '../models/echeance.model';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { EcheanceStatusBadgeComponent } from '../../abonnements/components/echeance-status-badge/echeance-status-badge.component';

@Component({
  selector: 'app-echeances-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
        title="Échéances d'Abonnement"
        subtitle="Suivi des calendriers de facturation, détection des retards et enregistrement des encaissements"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Paiements', path: '/super-admin/paiements' },
          { label: 'Échéances' }
        ]"
      >
        <div page-actions class="d-flex gap-2">
          <app-btn
            [variant]="'outline'"
            [size]="'md'"
            (btnClick)="navigateToAbonnements()"
          >
            <i class="bi bi-credit-card-2-front me-1"></i>
            <span>Abonnements</span>
          </app-btn>

          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToPaiements()"
          >
            <i class="bi bi-cash-stack me-1"></i>
            <span>Historique des paiements</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de Filtres -->
      <app-filter-bar
        [searchPlaceholder]="'Filtrer les échéances...'"
        [hasActiveFilters]="hasActiveFilters()"
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
            <option value="en_retard">En retard</option>
            <option value="annulee">Annulée</option>
          </select>

          <!-- Toggle Retard Uniquement -->
          <label class="checkbox-filter-label">
            <input
              type="checkbox"
              [checked]="filterEnRetard()"
              (change)="onRetardToggleChange($event)"
              class="checkbox-input"
            />
            <span>Retards uniquement</span>
          </label>

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
          title="Impossible de charger les échéances"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des échéances -->
        <app-table
          [columns]="columns"
          [data]="echeances()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucune échéance trouvée"
          emptySubtitle="Aucune échéance ne correspond à vos filtres actuels."
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
      <ng-template #rowActionsTpl let-ech>
        <div class="table-actions">
          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="navigateToDetail(ech.id)"
            title="Consulter le détail de l'échéance"
          >
            <i class="bi bi-eye"></i>
          </app-btn>

          @if (ech.solde_restant > 0 && ech.statut !== 'annulee') {
            <app-btn
              [variant]="'ghost'"
              [size]="'sm'"
              (btnClick)="navigateToEncaisser(ech.id)"
              title="Enregistrer un versement pour cette échéance"
              class="text-success"
            >
              <i class="bi bi-cash-coin"></i>
            </app-btn>
          }

          @if (!ech.facture) {
            <app-btn
              [variant]="'ghost'"
              [size]="'sm'"
              (btnClick)="openGenererFactureModal(ech)"
              title="Générer la facture officielle"
              class="text-primary"
            >
              <i class="bi bi-receipt"></i>
            </app-btn>
          }
        </div>
      </ng-template>

      <!-- Dialogue Génération Facture -->
      @if (echeanceToInvoice()) {
        <app-confirm-dialog
          [isOpen]="isInvoiceDialogOpen()"
          title="Générer la facture officielle"
          [message]="getInvoiceDialogMessage()"
          confirmLabel="Générer la facture"
          cancelLabel="Annuler"
          variant="info"
          [loading]="actionLoading()"
          (confirmed)="confirmGenererFacture()"
          (cancelled)="closeInvoiceDialog()"
        />
      }
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
      gap: 1rem;
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

    .checkbox-filter-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #334155;
      cursor: pointer;
      user-select: none;
    }

    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
    }

    .text-success { color: #047857; }
    .text-primary { color: #0284c7; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcheancesListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly echeanceService = inject(EcheanceService);
  private readonly toast = inject(ToastService);
  private readonly cfaPipe = inject(CurrencyCfaPipe);

  protected readonly echeances = signal<EcheanceAbonnement[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly actionLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly perPage = signal<number>(15);
  protected readonly totalItems = signal<number>(0);

  // Filters
  protected readonly filterStatut = signal<EcheanceStatut | 'tous'>('tous');
  protected readonly filterEnRetard = signal<boolean>(false);

  protected readonly hasActiveFilters = computed<boolean>(() => {
    return this.filterStatut() !== 'tous' || this.filterEnRetard();
  });

  // Facture Modal
  protected readonly isInvoiceDialogOpen = signal<boolean>(false);
  protected readonly echeanceToInvoice = signal<EcheanceAbonnement | null>(null);

  protected readonly columns: TableColumn<EcheanceAbonnement>[] = [
    {
      key: 'reference',
      label: 'Réf. Échéance',
      sortable: true,
      width: '130px',
    },
    {
      key: 'paroisse',
      label: 'Paroisse',
      width: '180px',
      formatter: (_, row) =>
        row.abonnement?.paroisse?.nom_paroisse ||
        row.abonnement?.paroisse_nom ||
        '-',
    },
    {
      key: 'produit',
      label: 'Produit / Formule',
      width: '160px',
      formatter: (_, row) => {
        const prod =
          row.abonnement?.formule?.produit?.nom ||
          row.abonnement?.produit_nom ||
          '';
        const form =
          row.abonnement?.formule?.nom ||
          row.abonnement?.formule_nom ||
          '';
        return prod && form ? `${prod} (${form})` : prod || form || '-';
      },
    },
    {
      key: 'periode',
      label: 'Période',
      width: '170px',
      formatter: (_, row) => {
        if (!row.periode_debut || !row.periode_fin) return '-';
        const d1 = new Date(row.periode_debut).toLocaleDateString('fr-FR');
        const d2 = new Date(row.periode_fin).toLocaleDateString('fr-FR');
        return `${d1} - ${d2}`;
      },
    },
    {
      key: 'date_echeance',
      label: 'Date limite',
      sortable: true,
      width: '110px',
      formatter: (v) => {
        if (!v) return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
      },
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      width: '120px',
      formatter: (v) => this.cfaPipe.transform(v, 'XOF'),
    },
    {
      key: 'montant_paye',
      label: 'Payé',
      align: 'right',
      width: '120px',
      formatter: (v) => this.cfaPipe.transform(v, 'XOF'),
    },
    {
      key: 'solde_restant',
      label: 'Solde restant',
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
          case 'en_retard':
            return 'En retard';
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

    const params: EcheanceFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
    };

    if (this.filterStatut() !== 'tous') {
      params.statut = this.filterStatut();
    }
    if (this.filterEnRetard()) {
      params.en_retard = true;
    }

    this.echeanceService.getEcheances(params).subscribe({
      next: (res) => {
        this.echeances.set(res.data);
        this.currentPage.set(res.meta.current_page);
        this.perPage.set(res.meta.per_page);
        this.totalItems.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des échéances.'
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

  public onStatutFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as EcheanceStatut | 'tous';
    this.filterStatut.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onRetardToggleChange(event: Event): void {
    const val = (event.target as HTMLInputElement).checked;
    this.filterEnRetard.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onResetFilters(): void {
    this.filterStatut.set('tous');
    this.filterEnRetard.set(false);
    this.currentPage.set(1);
    this.refresh();
  }

  public navigateToAbonnements(): void {
    this.router.navigate(['/super-admin/abonnements']);
  }

  public navigateToPaiements(): void {
    this.router.navigate(['/super-admin/paiements']);
  }

  public navigateToDetail(id: string | number): void {
    this.router.navigate(['/super-admin/echeances', id]);
  }

  public navigateToEncaisser(echeanceId: string | number): void {
    this.router.navigate(['/super-admin/paiements/nouveau'], {
      queryParams: { echeance_id: echeanceId },
    });
  }

  public openGenererFactureModal(ech: EcheanceAbonnement): void {
    this.echeanceToInvoice.set(ech);
    this.isInvoiceDialogOpen.set(true);
  }

  public closeInvoiceDialog(): void {
    this.isInvoiceDialogOpen.set(false);
    this.echeanceToInvoice.set(null);
  }

  public getInvoiceDialogMessage(): string {
    const ech = this.echeanceToInvoice();
    if (!ech) return '';
    return `Voulez-vous générer la facture pour l'échéance ${ech.reference} (${this.cfaPipe.transform(ech.montant, 'XOF')}) avec un taux de TVA de 18% ?`;
  }

  public confirmGenererFacture(): void {
    const ech = this.echeanceToInvoice();
    if (!ech || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.echeanceService
      .genererFacture(ech.id, {
        taux_tva: 18,
        description: `Facture générée pour échéance ${ech.reference}`,
      })
      .subscribe({
        next: (facture) => {
          this.toast.success(
            'Facture générée',
            `La facture ${facture.reference} a été générée avec succès.`
          );
          this.actionLoading.set(false);
          this.closeInvoiceDialog();
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Erreur de facturation',
            err?.message || 'Erreur lors de la génération de la facture.'
          );
        },
      });
  }
}
