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
import { ParticipantDetailModalComponent } from '../components/participant-detail-modal.component';
import { PaiementDetailModalComponent } from '../../caisse/components/paiement-detail-modal/paiement-detail-modal.component';
import { InscriptionFormModalComponent } from '../../pelerinages/components/inscription-form-modal/inscription-form-modal.component';
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  CampagnePelerinage,
  InscriptionPelerinage,
  TarifPelerinage,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-participants-page',
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
    ParticipantDetailModalComponent,
    PaiementDetailModalComponent,
    InscriptionFormModalComponent,
  ],
  template: `
    <div class="participants-page-container">
      <app-page-header
        title="Registre des Participants"
        subtitle="Suivi individuel, fiches complètes, paiements et présences des pèlerins"
        badge="Participants"
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
            icon="file-earmark-excel"
            [disabled]="filteredParticipants().length === 0"
            (btnClick)="exportExcel()"
          >
            Exporter en Excel
          </app-btn>

          <app-btn
            variant="primary"
            icon="person-plus"
            (btnClick)="openInscriptionModal()"
          >
            Nouvelle inscription
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
              {{ c.nom }} — {{ c.destination }} ({{ c.total_inscrits || 0 }}/{{ c.capacite || 0 }} inscrits)
            </option>
          }
        </select>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Total des inscrits"
          [value]="totalParticipants()"
          subtitle="Dossiers enregistrés"
          icon="bi bi-people"
          theme="primary"
        />

        <app-stat-card
          title="Inscriptions confirmées"
          [value]="totalConfirmes()"
          subtitle="Validées avec acompte/solde"
          icon="bi bi-patch-check"
          theme="success"
        />

        <app-stat-card
          title="Soldés intégralement"
          [value]="totalSoldes()"
          subtitle="Frais payés à 100%"
          icon="bi bi-wallet2"
          theme="accent"
        />

        <app-stat-card
          title="Impayés / En attente"
          [value]="totalImpayes()"
          subtitle="Acomptes ou reliquats dus"
          icon="bi bi-exclamation-circle"
          theme="warning"
        />
      </div>

      <!-- Filtres et recherche -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par nom, prénoms, référence, téléphone..."
          [hasActiveFilters]="hasActiveFilters()"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        >
          <div class="filters-wrap">
            <select
              [value]="selectedStatutFilter()"
              (change)="onStatutFilterChange($event)"
              class="filter-select"
              aria-label="Filtre de statut"
            >
              <option value="tous">Tous les participants</option>
              <option value="paye">Payé intégralement</option>
              <option value="impaye">Impayé / Acompte partiel</option>
              <option value="confirmee">Inscription confirmée</option>
              <option value="annulee">Inscription annulée</option>
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
            (action)="loadInscriptions()"
          />
        </div>
      }

      <!-- Tableau des participants -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="filteredParticipants()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun participant trouvé"
            emptySubtitle="Aucun dossier ne correspond à vos filtres pour cette campagne."
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
            (click)="openDetailModal(p)"
            title="Consulter la fiche complète"
            aria-label="Fiche"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="action-btn action-pay"
            (click)="openPaiementModal(p)"
            title="Gérer les règlements et versements"
            aria-label="Règlements"
          >
            <i class="bi bi-cash-coin"></i>
          </button>

          @if (p.statut_inscription !== 'annulee') {
            <button
              type="button"
              class="action-btn action-cancel"
              (click)="openCancelConfirm(p)"
              title="Annuler cette inscription"
              aria-label="Annuler"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          }
        </div>
      </ng-template>

      <!-- Modal de consultation détaillée -->
      <app-participant-detail-modal
        [isOpen]="isDetailModalOpen()"
        [participant]="selectedParticipant()"
        [campagneId]="selectedCampagneId()"
        (close)="closeDetailModal()"
        (updated)="onParticipantUpdated($event)"
      />

      <!-- Modal de versement / encaissement caisse -->
      <app-paiement-detail-modal
        [isOpen]="isPaiementModalOpen()"
        [campagneId]="selectedCampagneId()"
        [campagneNom]="currentCampagneNom()"
        [inscription]="selectedInscriptionForPaiement()"
        (close)="isPaiementModalOpen.set(false)"
        (paymentChanged)="onPaymentRecorded()"
      />

      <!-- Modal d'inscription directe d'un participant -->
      @if (selectedCampagneId()) {
        <app-inscription-form-modal
          [isOpen]="isInscriptionModalOpen()"
          [campagneId]="selectedCampagneId()"
          [tarifs]="campagneTarifs()"
          (close)="closeInscriptionModal()"
          (saved)="onInscriptionSaved($event)"
        />
      }

      <!-- Dialogue d'annulation -->
      <app-confirm-dialog
        [isOpen]="isCancelConfirmOpen()"
        title="Annuler l'inscription"
        [message]="cancelConfirmMessage()"
        confirmText="Confirmer l'annulation"
        cancelText="Conserver l'inscription"
        variant="danger"
        [loading]="isCancelling()"
        (confirmed)="confirmCancelInscription()"
        (cancelled)="isCancelConfirmOpen.set(false)"
      />
    </div>
  `,
  styles: [`
    .participants-page-container {
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
    .action-pay:hover {
      border-color: #10b981;
      color: #059669;
    }
    .action-cancel:hover {
      border-color: var(--danger-300, #fca5a5);
      color: var(--danger-600, #dc2626);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantsPageComponent implements OnInit {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly campagnes = signal<CampagnePelerinage[]>([]);
  public readonly selectedCampagneId = signal<string>('');
  public readonly participants = signal<InscriptionPelerinage[]>([]);
  public readonly totalItems = signal<number>(0);
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(20);

  public readonly searchQuery = signal<string>('');
  public readonly selectedStatutFilter = signal<string>('tous');

  public readonly isDetailModalOpen = signal<boolean>(false);
  public readonly selectedParticipant = signal<InscriptionPelerinage | null>(null);

  public readonly isPaiementModalOpen = signal<boolean>(false);
  public readonly selectedInscriptionForPaiement = signal<any | null>(null);

  public readonly isInscriptionModalOpen = signal<boolean>(false);
  public readonly campagneTarifs = signal<TarifPelerinage[]>([]);

  public readonly isCancelConfirmOpen = signal<boolean>(false);
  public readonly selectedParticipantForCancel = signal<InscriptionPelerinage | null>(null);
  public readonly isCancelling = signal<boolean>(false);

  public readonly currentCampagne = computed(() => {
    return this.campagnes().find((c) => String(c.id) === this.selectedCampagneId()) || null;
  });

  public readonly currentCampagneNom = computed(() => {
    const c = this.currentCampagne();
    return c?.nom || '';
  });

  public readonly totalParticipants = computed(() => this.participants().length);
  public readonly totalConfirmes = computed(
    () => this.participants().filter((p) => p.statut_inscription === 'payee' || p.statut_inscription === 'partiellement_payee').length
  );
  public readonly totalSoldes = computed(
    () => this.participants().filter((p) => (p.montant_paye || 0) >= (p.montant || 0)).length
  );
  public readonly totalImpayes = computed(
    () => this.participants().filter((p) => (p.montant_paye || 0) < (p.montant || 0)).length
  );

  public readonly hasActiveFilters = computed(
    () => this.searchQuery().length > 0 || this.selectedStatutFilter() !== 'tous'
  );

  public readonly filteredParticipants = computed(() => {
    let list = this.participants();
    const filter = this.selectedStatutFilter();

    if (filter === 'paye') {
      list = list.filter((p) => (p.montant_paye || 0) >= (p.montant || 0));
    } else if (filter === 'impaye') {
      list = list.filter((p) => (p.montant_paye || 0) < (p.montant || 0));
    } else if (filter === 'confirmee') {
      list = list.filter((p) => p.statut_inscription === 'payee' || p.statut_inscription === 'partiellement_payee');
    } else if (filter === 'annulee') {
      list = list.filter((p) => p.statut_inscription === 'annulee');
    }

    return list;
  });

  public readonly cancelConfirmMessage = computed(() => {
    const p = this.selectedParticipantForCancel();
    return p
      ? `Êtes-vous sûr de vouloir annuler l'inscription de "${p.nom_complet || (p.nom + ' ' + p.prenoms)}" ?`
      : '';
  });

  public readonly columns: TableColumn<InscriptionPelerinage>[] = [
    {
      key: 'reference',
      label: 'Réf. Dossier',
      width: '120px',
      formatter: (val) => val || '—',
    },
    {
      key: 'nom_complet',
      label: 'Participant',
      sortable: true,
      formatter: (val, row) => val || `${row.nom} ${row.prenoms}`,
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      formatter: (val) => val || '—',
    },
    {
      key: 'tarif',
      label: 'Catégorie tarif',
      formatter: (_, row) => row.tarif?.libelle || 'Tarif standard',
    },
    {
      key: 'montant',
      label: 'Montant facturé',
      align: 'right',
      formatter: (val) => `${formatCfa(val || 0)} F`,
    },
    {
      key: 'montant_paye',
      label: 'Total versé',
      align: 'right',
      formatter: (val, row) => {
        const paye = val || 0;
        const total = row.montant || 0;
        const reste = Math.max(0, total - paye);
        return `${formatCfa(paye)} F (${reste === 0 ? 'Soldé' : 'Reste ' + formatCfa(reste) + ' F'})`;
      },
    },
    {
      key: 'statut_inscription',
      label: 'Statut',
      align: 'center',
      formatter: (val) => (val === 'payee' ? 'Soldé' : val === 'partiellement_payee' ? 'Acompte' : val === 'annulee' ? 'Annulé' : 'En attente'),
    },
    {
      key: 'statut_participation',
      label: 'Présence',
      align: 'center',
      formatter: (val) => {
        if (val === 'presente') return 'Présent(e)';
        if (val === 'absente') return 'Absent(e)';
        return 'Prévu(e)';
      },
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
          this.loadInscriptions();
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

  public loadInscriptions(): void {
    const cid = this.selectedCampagneId();
    if (!cid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pelerinageService
      .getInscriptions(cid, {
        search: this.searchQuery().trim() || undefined,
        page: this.currentPage(),
        per_page: this.perPage(),
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.participants.set(data);
          this.totalItems.set(meta.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Impossible de charger les participants.');
        },
      });
  }

  public onCampagneChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCampagneId.set(val);
    this.currentPage.set(1);
    this.loadInscriptions();
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.loadInscriptions();
  }

  public onStatutFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatutFilter.set(val);
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('tous');
    this.currentPage.set(1);
    this.loadInscriptions();
  }

  public onPageChange(evt: PageChangeEvent): void {
    this.currentPage.set(evt.page);
    this.perPage.set(evt.perPage);
    this.loadInscriptions();
  }

  public refreshData(): void {
    this.loadInscriptions();
    this.toast.info('Actualisation', 'Rechargement des participants...');
  }

  public openDetailModal(p: InscriptionPelerinage): void {
    this.selectedParticipant.set(p);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedParticipant.set(null);
  }

  public onParticipantUpdated(updated: InscriptionPelerinage): void {
    this.selectedParticipant.set(updated);
    this.loadInscriptions();
  }

  public openPaiementModal(p: InscriptionPelerinage): void {
    this.selectedInscriptionForPaiement.set({
      id: p.id,
      reference: p.reference,
      nom: p.nom,
      prenoms: p.prenoms,
      nom_complet: p.nom_complet || `${p.nom} ${p.prenoms}`,
      montant_total: p.montant,
      montant_paye: p.montant_paye,
    });
    this.isPaiementModalOpen.set(true);
  }

  public onPaymentRecorded(): void {
    this.loadInscriptions();
  }

  public openCancelConfirm(p: InscriptionPelerinage): void {
    this.selectedParticipantForCancel.set(p);
    this.isCancelConfirmOpen.set(true);
  }

  public confirmCancelInscription(): void {
    const p = this.selectedParticipantForCancel();
    const cid = this.selectedCampagneId();
    if (!p || !cid) return;

    this.isCancelling.set(true);
    this.pelerinageService.annulerInscription(cid, p.id).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.isCancelConfirmOpen.set(false);
        this.toast.success('Inscription annulée', "Le dossier du participant a été marqué comme annulé.");
        this.loadInscriptions();
      },
      error: () => {
        this.isCancelling.set(false);
        this.toast.error('Erreur', "Impossible d'annuler cette inscription.");
      },
    });
  }

  public openInscriptionModal(): void {
    const cid = this.selectedCampagneId();
    if (!cid) {
      this.toast.warning(
        'Campagne requise',
        'Veuillez sélectionner une campagne de pèlerinage pour enregistrer une inscription.'
      );
      return;
    }

    this.pelerinageService.getTarifs(cid).subscribe({
      next: (tarifs) => {
        this.campagneTarifs.set(tarifs || []);
        this.isInscriptionModalOpen.set(true);
      },
      error: () => {
        this.campagneTarifs.set([]);
        this.isInscriptionModalOpen.set(true);
      },
    });
  }

  public closeInscriptionModal(): void {
    this.isInscriptionModalOpen.set(false);
  }

  public onInscriptionSaved(saved: InscriptionPelerinage): void {
    this.toast.success(
      'Inscription enregistrée',
      `Le participant ${saved.nom_complet || (saved.nom + ' ' + saved.prenoms)} a été inscrit avec succès.`
    );
    this.isInscriptionModalOpen.set(false);
    this.loadInscriptions();
    this.loadCampagnes();
  }

  public exportExcel(): void {
    const list = this.filteredParticipants();
    if (!list || list.length === 0) {
      this.toast.warning('Aucune donnée', 'La liste des participants à exporter est vide.');
      return;
    }

    const headers = [
      'Référence Dossier',
      'Nom',
      'Prénoms',
      'Genre',
      'Téléphone',
      'Type Participant',
      'Tarif / Formule',
      'Montant Facturé (FCFA)',
      'Total Versé (FCFA)',
      'Reste à Payer (FCFA)',
      'Statut Inscription',
      'Présence Pèlerinage',
      'Date Inscription',
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((p) => {
      const montant = p.montant || 0;
      const paye = p.montant_paye || 0;
      const reste = Math.max(0, montant - paye);
      const statut =
        p.statut_inscription === 'payee'
          ? 'Soldé'
          : p.statut_inscription === 'partiellement_payee'
          ? 'Acompte'
          : p.statut_inscription === 'annulee'
          ? 'Annulé'
          : 'En attente';
      const presence =
        p.statut_participation === 'presente'
          ? 'Présent(e)'
          : p.statut_participation === 'absente'
          ? 'Absent(e)'
          : 'Prévu(e)';

      return [
        escapeCsv(p.reference || ''),
        escapeCsv(p.nom || ''),
        escapeCsv(p.prenoms || ''),
        escapeCsv(p.sexe || ''),
        escapeCsv(p.telephone || ''),
        escapeCsv(p.type_participant || ''),
        escapeCsv(p.tarif?.libelle || 'Standard'),
        escapeCsv(montant),
        escapeCsv(paye),
        escapeCsv(reste),
        escapeCsv(statut),
        escapeCsv(presence),
        escapeCsv(p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const campagneNom = (this.currentCampagneNom() || 'participants').toLowerCase().replace(/[^a-z0-9]/gi, '_');
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${campagneNom}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success('Export réussi', `${list.length} participant(s) exporté(s) avec succès.`);
  }
}
