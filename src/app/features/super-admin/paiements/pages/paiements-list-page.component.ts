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
import { PaiementService } from '../services/paiement.service';
import {
  ModePaiement,
  PaiementAbonnement,
  PaiementFilterParams,
  PaiementStatut,
} from '../models/paiement.model';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { PaiementStatusBadgeComponent } from '../components/paiement-status-badge/paiement-status-badge.component';

@Component({
  selector: 'app-paiements-list-page',
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
        title="Règlements & Paiements"
        subtitle="Suivi des encaissements d'abonnements, gestion des paiements partiels et complets"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Paiements' }
        ]"
      >
        <div page-actions class="d-flex gap-2">
          <app-btn
            [variant]="'outline'"
            [size]="'md'"
            (btnClick)="navigateToEcheances()"
          >
            <i class="bi bi-calendar-check me-1"></i>
            <span>Voir les échéances</span>
          </app-btn>

          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            (btnClick)="navigateToCreate()"
          >
            <i class="bi bi-plus-lg me-1"></i>
            <span>Nouveau Paiement</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de Filtres -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher...'"
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
            <option value="valide">Validé</option>
            <option value="en_attente">En attente</option>
            <option value="annule">Annulé</option>
            <option value="rembourse">Remboursé</option>
          </select>

          <!-- Filtre Mode de paiement -->
          <select
            [value]="filterMode()"
            (change)="onModeFilterChange($event)"
            class="filter-select"
            aria-label="Filtrer par mode de paiement"
          >
            <option value="tous">Tous les modes</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="especes">Espèces</option>
            <option value="virement">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="autre">Autre</option>
          </select>

          <!-- Filtre Date Début -->
          <div class="date-filter-group">
            <label class="date-label" for="date-debut-input">Du :</label>
            <input
              id="date-debut-input"
              type="date"
              [value]="filterDateDebut()"
              (change)="onDateDebutChange($event)"
              class="filter-date-input"
            />
          </div>

          <!-- Filtre Date Fin -->
          <div class="date-filter-group">
            <label class="date-label" for="date-fin-input">Au :</label>
            <input
              id="date-fin-input"
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
          title="Impossible de charger les paiements"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des paiements -->
        <app-table
          [columns]="columns"
          [data]="paiements()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucun paiement trouvé"
          emptySubtitle="Aucun encaissement ne correspond à vos critères de recherche."
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
      <ng-template #rowActionsTpl let-p>
        <div class="table-actions">
          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="navigateToDetail(p.id)"
            title="Consulter le détail du paiement"
          >
            <i class="bi bi-eye"></i>
          </app-btn>

          @if (p.statut === 'valide' || p.statut === 'en_attente') {
            <app-btn
              [variant]="'ghost'"
              [size]="'sm'"
              (btnClick)="openAnnulerModal(p)"
              title="Annuler ce paiement"
              class="text-danger"
            >
              <i class="bi bi-x-circle"></i>
            </app-btn>
          }

          @if (p.statut === 'valide') {
            <app-btn
              [variant]="'ghost'"
              [size]="'sm'"
              (btnClick)="openRembourserModal(p)"
              title="Rembourser ce paiement"
              class="text-warning"
            >
              <i class="bi bi-arrow-return-left"></i>
            </app-btn>
          }
        </div>
      </ng-template>

      <!-- Dialogue d'Annulation -->
      @if (paiementToCancel()) {
        <app-confirm-dialog
          [isOpen]="isCancelDialogOpen()"
          title="Annuler le paiement"
          [message]="getCancelDialogMessage()"
          confirmLabel="Confirmer l'annulation"
          cancelLabel="Retour"
          variant="danger"
          [loading]="actionLoading()"
          (confirmed)="confirmAnnulation()"
          (cancelled)="closeActionDialog()"
        />
      }

      <!-- Dialogue de Remboursement -->
      @if (paiementToRefund()) {
        <app-confirm-dialog
          [isOpen]="isRefundDialogOpen()"
          title="Rembourser le paiement"
          [message]="getRefundDialogMessage()"
          confirmLabel="Confirmer le remboursement"
          cancelLabel="Retour"
          variant="warning"
          [loading]="actionLoading()"
          (confirmed)="confirmRemboursement()"
          (cancelled)="closeActionDialog()"
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
      transition: border-color 0.15s ease-in-out;
    }

    .filter-select:focus, .filter-date-input:focus {
      border-color: var(--primary-500, #0ea5e9);
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

    .text-danger {
      color: #b91c1c;
    }

    .text-warning {
      color: #b45309;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly paiementService = inject(PaiementService);
  private readonly toast = inject(ToastService);
  private readonly cfaPipe = inject(CurrencyCfaPipe);

  protected readonly paiements = signal<PaiementAbonnement[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly actionLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly perPage = signal<number>(15);
  protected readonly totalItems = signal<number>(0);

  // Filters
  protected readonly filterStatut = signal<PaiementStatut | 'tous'>('tous');
  protected readonly filterMode = signal<ModePaiement | 'tous'>('tous');
  protected readonly filterDateDebut = signal<string>('');
  protected readonly filterDateFin = signal<string>('');

  protected readonly hasActiveFilters = computed<boolean>(() => {
    return (
      this.filterStatut() !== 'tous' ||
      this.filterMode() !== 'tous' ||
      !!this.filterDateDebut() ||
      !!this.filterDateFin()
    );
  });

  // Action Dialogs
  protected readonly isCancelDialogOpen = signal<boolean>(false);
  protected readonly isRefundDialogOpen = signal<boolean>(false);
  protected readonly paiementToCancel = signal<PaiementAbonnement | null>(null);
  protected readonly paiementToRefund = signal<PaiementAbonnement | null>(null);

  protected readonly columns: TableColumn<PaiementAbonnement>[] = [
    {
      key: 'reference',
      label: 'Réf. Paiement',
      sortable: true,
      width: '140px',
    },
    {
      key: 'date_paiement',
      label: 'Date',
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
      width: '180px',
      formatter: (_, row) =>
        row.echeance?.abonnement?.paroisse?.nom_paroisse ||
        row.echeance?.abonnement?.paroisse_nom ||
        '-',
    },
    {
      key: 'produit',
      label: 'Produit / Formule',
      width: '160px',
      formatter: (_, row) => {
        const prod =
          row.echeance?.abonnement?.formule?.produit?.nom ||
          row.echeance?.abonnement?.produit_nom ||
          '';
        const form =
          row.echeance?.abonnement?.formule?.nom ||
          row.echeance?.abonnement?.formule_nom ||
          '';
        return prod && form ? `${prod} (${form})` : prod || form || '-';
      },
    },
    {
      key: 'montant',
      label: 'Montant',
      align: 'right',
      width: '130px',
      formatter: (v) => this.cfaPipe.transform(v, 'XOF'),
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      width: '130px',
      formatter: (v) => {
        switch (v) {
          case 'mobile_money':
            return 'Mobile Money';
          case 'especes':
            return 'Espèces';
          case 'virement':
            return 'Virement';
          case 'cheque':
            return 'Chèque';
          case 'autre':
            return 'Autre';
          default:
            return String(v || '-');
        }
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '120px',
      align: 'center',
      formatter: (v) => {
        switch (v) {
          case 'valide':
            return 'Validé';
          case 'en_attente':
            return 'En attente';
          case 'annule':
            return 'Annulé';
          case 'rembourse':
            return 'Remboursé';
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

    const params: PaiementFilterParams = {
      page: this.currentPage(),
      per_page: this.perPage(),
    };

    if (this.filterStatut() !== 'tous') {
      params.statut = this.filterStatut();
    }
    if (this.filterMode() !== 'tous') {
      params.mode_paiement = this.filterMode();
    }
    if (this.filterDateDebut()) {
      params.date_debut = this.filterDateDebut();
    }
    if (this.filterDateFin()) {
      params.date_fin = this.filterDateFin();
    }

    this.paiementService.getPaiements(params).subscribe({
      next: (res) => {
        this.paiements.set(res.data);
        this.currentPage.set(res.meta.current_page);
        this.perPage.set(res.meta.per_page);
        this.totalItems.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des règlements.'
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
    const val = (event.target as HTMLSelectElement).value as PaiementStatut | 'tous';
    this.filterStatut.set(val);
    this.currentPage.set(1);
    this.refresh();
  }

  public onModeFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ModePaiement | 'tous';
    this.filterMode.set(val);
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
    this.filterStatut.set('tous');
    this.filterMode.set('tous');
    this.filterDateDebut.set('');
    this.filterDateFin.set('');
    this.currentPage.set(1);
    this.refresh();
  }

  public navigateToCreate(): void {
    this.router.navigate(['/super-admin/paiements/nouveau']);
  }

  public navigateToEcheances(): void {
    this.router.navigate(['/super-admin/echeances']);
  }

  public navigateToDetail(id: string | number): void {
    this.router.navigate(['/super-admin/paiements', id]);
  }

  public openAnnulerModal(paiement: PaiementAbonnement): void {
    this.paiementToCancel.set(paiement);
    this.isCancelDialogOpen.set(true);
  }

  public openRembourserModal(paiement: PaiementAbonnement): void {
    this.paiementToRefund.set(paiement);
    this.isRefundDialogOpen.set(true);
  }

  public closeActionDialog(): void {
    this.isCancelDialogOpen.set(false);
    this.isRefundDialogOpen.set(false);
    this.paiementToCancel.set(null);
    this.paiementToRefund.set(null);
  }

  public getCancelDialogMessage(): string {
    const p = this.paiementToCancel();
    if (!p) return '';
    return `Êtes-vous certain de vouloir annuler le paiement ${p.reference} d'un montant de ${this.cfaPipe.transform(p.montant, 'XOF')} ? Si l'échéance était soldée, elle sera automatiquement réouverte.`;
  }

  public getRefundDialogMessage(): string {
    const p = this.paiementToRefund();
    if (!p) return '';
    return `Êtes-vous certain de vouloir marquer comme remboursé le paiement ${p.reference} (${this.cfaPipe.transform(p.montant, 'XOF')}) ? L'échéance et la facture associées seront automatiquement réouvertes.`;
  }

  public confirmAnnulation(): void {
    const p = this.paiementToCancel();
    if (!p || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.paiementService
      .annulerPaiement(p.id, { observation: 'Annulé depuis le Super Admin' })
      .subscribe({
        next: () => {
          this.toast.success('Paiement annulé', `Le paiement ${p.reference} a été annulé avec succès.`);
          this.actionLoading.set(false);
          this.closeActionDialog();
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Erreur d’annulation',
            err?.message || 'Erreur lors de l’annulation du paiement.'
          );
        },
      });
  }

  public confirmRemboursement(): void {
    const p = this.paiementToRefund();
    if (!p || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.paiementService
      .rembourserPaiement(p.id, { observation: 'Remboursé depuis le Super Admin' })
      .subscribe({
        next: () => {
          this.toast.success('Paiement remboursé', `Le paiement ${p.reference} a été remboursé avec succès.`);
          this.actionLoading.set(false);
          this.closeActionDialog();
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(
            'Erreur de remboursement',
            err?.message || 'Erreur lors du remboursement du paiement.'
          );
        },
      });
  }
}
