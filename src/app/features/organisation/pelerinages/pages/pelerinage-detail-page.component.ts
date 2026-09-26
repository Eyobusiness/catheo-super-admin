import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CampagneStatusBadgeComponent } from '../components/campagne-status-badge/campagne-status-badge.component';
import { InscriptionStatusBadgeComponent } from '../components/inscription-status-badge/inscription-status-badge.component';
import { InscriptionFormModalComponent } from '../components/inscription-form-modal/inscription-form-modal.component';
import { PaiementFormModalComponent } from '../components/paiement-form-modal/paiement-form-modal.component';
import { TarifFormModalComponent } from '../components/tarif-form-modal/tarif-form-modal.component';
import { PelerinageService } from '../services/pelerinage.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ExportService } from '../../exports/services/export.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';
import {
  CampagnePelerinage,
  CampagneStatistiques,
  InscriptionFilters,
  InscriptionPelerinage,
  InscriptionStatut,
  PaiementFilters,
  PaiementPelerinage,
  ParticipantType,
  ParticipationStatut,
  TarifPelerinage,
} from '../models/pelerinage.model';

@Component({
  selector: 'app-pelerinage-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    TableComponent,
    PaginationComponent,
    FilterBarComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    InscriptionFormModalComponent,
    PaiementFormModalComponent,
    TarifFormModalComponent,
  ],
  template: `
    <div class="pelerinage-detail-container">
      @if (campagne(); as c) {
        <!-- En-tête de page -->
        <app-page-header
          [title]="c.nom"
          [subtitle]="pageSubtitle()"
          [badge]="c.code"
        >
          <div page-actions class="header-actions">
            <app-btn
              variant="secondary"
              icon="arrow-left"
              (btnClick)="goBack()"
            >
              Retour à la liste
            </app-btn>

            <app-btn
              variant="secondary"
              icon="arrow-clockwise"
              [loading]="isLoading()"
              (btnClick)="refreshAll()"
            >
              Actualiser
            </app-btn>

            <app-btn
              variant="outline"
              icon="file-earmark-arrow-down"
              [loading]="isExporting()"
              (btnClick)="exportParticipants()"
            >
              Exporter CSV
            </app-btn>


          </div>
        </app-page-header>

        <!-- KPIs financiers et capacité -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <app-stat-card
            title="Capacité & Inscriptions"
            [value]="capaciteDisplay()"
            [subtitle]="capaciteSubtitle()"
            icon="bi bi-people-fill"
            [theme]="c.est_complete ? 'warning' : 'primary'"
          />
          <app-stat-card
            title="Total Attendu"
            [value]="(stats()?.montant_attendu || 0) + ' F'"
            subtitle="Engagements financiers"
            icon="bi bi-wallet2"
            theme="info"
          />
          <app-stat-card
            title="Total Encaissé"
            [value]="(stats()?.montant_collecte || 0) + ' F'"
            subtitle="Règlements perçus"
            icon="bi bi-check-circle-fill"
            theme="success"
          />
          <app-stat-card
            title="Solde Restant Dû"
            [value]="(stats()?.solde_restant || 0) + ' F'"
            subtitle="Montant restant à recouvrer"
            icon="bi bi-hourglass-split"
            [theme]="(stats()?.solde_restant || 0) > 0 ? 'warning' : 'success'"
          />
        </div>

        <!-- Navigation par Onglets -->
        <div class="tabs-nav-bar mt-6">
          <button
            type="button"
            class="tab-nav-btn"
            [class.is-active]="activeTab() === 'inscriptions'"
            (click)="setTab('inscriptions')"
          >
            <i class="bi bi-person-badge mr-2"></i>
            Participants ({{ totalInscriptions() }})
          </button>
          <button
            type="button"
            class="tab-nav-btn"
            [class.is-active]="activeTab() === 'tarifs'"
            (click)="setTab('tarifs')"
          >
            <i class="bi bi-tags mr-2"></i>
            Forfaits & Tarifs ({{ tarifs().length }})
          </button>
          <button
            type="button"
            class="tab-nav-btn"
            [class.is-active]="activeTab() === 'paiements'"
            (click)="setTab('paiements')"
          >
            <i class="bi bi-receipt mr-2"></i>
            Journal des Paiements ({{ totalPaiements() }})
          </button>
        </div>

        <!-- ONGLET 1 : INSCRIPTIONS / PÈLERINS -->
        @if (activeTab() === 'inscriptions') {
          <div class="tab-content mt-4">
            <!-- En-tête de l'onglet Participants -->
            <div class="flex justify-between items-center mb-4">
              <p class="text-muted text-sm">
                Liste des pèlerins inscrits à cette campagne avec leur statut de paiement et de présence.
              </p>
              @if (canInscrire() && c.statut === 'ouverte') {
                <app-btn
                  variant="primary"
                  icon="person-plus"
                  (btnClick)="openInscriptionModal()"
                >
                  Inscrire un pèlerin
                </app-btn>
              }
            </div>

            <!-- Barre de filtre des inscriptions -->
            <app-filter-bar
              searchPlaceholder="Rechercher par nom, référence, téléphone..."
              [hasActiveFilters]="hasActiveInscriptionFilters()"
              (searchChange)="onSearchInscriptionChange($event)"
              (resetFilters)="onResetInscriptionFilters()"
            >
              <div class="filters-wrap">
                <select
                  [value]="insStatutFilter()"
                  (change)="onInsStatutChange($event)"
                  class="filter-select"
                  aria-label="Filtrer par statut de paiement"
                >
                  <option value="tous">Tous les paiements</option>
                  <option value="en_attente">En attente</option>
                  <option value="partiellement_payee">Partiellement payée</option>
                  <option value="payee">Payée (Soldée)</option>
                  <option value="annulee">Annulée</option>
                </select>

                <select
                  [value]="insPresenceFilter()"
                  (change)="onInsPresenceChange($event)"
                  class="filter-select"
                  aria-label="Filtrer par présence"
                >
                  <option value="tous">Toutes les présences</option>
                  <option value="prevue">Prévue</option>
                  <option value="presente">Présent(e)</option>
                  <option value="absente">Absent(e)</option>
                </select>

                <select
                  [value]="insTypeFilter()"
                  (change)="onInsTypeChange($event)"
                  class="filter-select"
                  aria-label="Filtrer par type de participant"
                >
                  <option value="tous">Tous les profils</option>
                  <option value="EXTERNE">Externe</option>
                  <option value="CATECHUMENE">Catéchumène</option>
                </select>
              </div>
            </app-filter-bar>

            <!-- Table des Inscriptions -->
            <div class="mt-4">
              <app-table
                [columns]="inscriptionColumns"
                [data]="inscriptions()"
                [loading]="isInscriptionsLoading()"
                [hasActions]="true"
                [rowActionsTemplate]="insRowActionsTpl"
                emptyMessage="Aucun pèlerin inscrit"
                emptySubtitle="Aucune inscription ne correspond aux critères sélectionnés."
              />

              @if (totalInscriptions() > 0) {
                <div class="mt-4">
                  <app-pagination
                    [currentPage]="insPage()"
                    [perPage]="insPerPage()"
                    [total]="totalInscriptions()"
                    (pageChange)="onInsPageChange($event)"
                  />
                </div>
              }
            </div>
          </div>
        }

        <!-- ONGLET 2 : FORFAITS & TARIFS -->
        @if (activeTab() === 'tarifs') {
          <div class="tab-content mt-4">
            <div class="flex justify-between items-center mb-4">
              <p class="text-muted text-sm">
                Configurez les différents tarifs applicables à cette campagne (ex : tarif standard, tarif couple, tarif enfant).
              </p>
              @if (canUpdate()) {
                <app-btn variant="primary" icon="plus" (btnClick)="openTarifModal()">
                  Nouveau Forfait
                </app-btn>
              }
            </div>

            <app-table
              [columns]="tarifColumns"
              [data]="tarifs()"
              [loading]="isTarifsLoading()"
              [hasActions]="canUpdate()"
              [rowActionsTemplate]="tarifRowActionsTpl"
              emptyMessage="Aucun tarif configuré"
              emptySubtitle="Veuillez ajouter au moins un tarif pour ouvrir les inscriptions."
            />
          </div>
        }

        <!-- ONGLET 3 : JOURNAL DES PAIEMENTS -->
        @if (activeTab() === 'paiements') {
          <div class="tab-content mt-4">
            <app-table
              [columns]="paiementColumns"
              [data]="paiements()"
              [loading]="isPaiementsLoading()"
              [hasActions]="canPayer()"
              [rowActionsTemplate]="paiementRowActionsTpl"
              emptyMessage="Aucun paiement enregistré"
              emptySubtitle="Les versements perçus apparaîtront ici."
            />

            @if (totalPaiements() > 0) {
              <div class="mt-4">
                <app-pagination
                  [currentPage]="paiementPage()"
                  [perPage]="paiementPerPage()"
                  [total]="totalPaiements()"
                  (pageChange)="onPaiementPageChange($event)"
                />
              </div>
            }
          </div>
        }

        <!-- Templates d'actions Inscriptions -->
        <ng-template #insRowActionsTpl let-ins>
          <div class="row-actions-group">
            <!-- Enregistrer un paiement -->
            @if (canPayer() && ins.statut_inscription !== 'annulee' && ins.reste_a_payer > 0) {
              <button
                type="button"
                class="action-btn action-pay"
                (click)="openPaiementModal(ins)"
                title="Enregistrer un versement"
                aria-label="Payer"
              >
                <i class="bi bi-cash-coin"></i>
              </button>
            }

            <!-- Pointer la présence -->
            @if (canUpdate() && ins.statut_inscription !== 'annulee') {
              @if (ins.statut_participation !== 'presente') {
                <button
                  type="button"
                  class="action-btn action-check"
                  (click)="setParticipation(ins, 'presente')"
                  title="Pointer présent(e)"
                  aria-label="Présent"
                >
                  <i class="bi bi-check-circle"></i>
                </button>
              }
              @if (ins.statut_participation !== 'absente') {
                <button
                  type="button"
                  class="action-btn action-absent"
                  (click)="setParticipation(ins, 'absente')"
                  title="Pointer absent(e)"
                  aria-label="Absent"
                >
                  <i class="bi bi-x-circle"></i>
                </button>
              }
            }

            <!-- Annuler inscription -->
            @if (canUpdate() && ins.statut_inscription !== 'annulee') {
              <button
                type="button"
                class="action-btn action-cancel"
                (click)="confirmAnnulerInscription(ins)"
                title="Annuler l'inscription"
                aria-label="Annuler"
              >
                <i class="bi bi-slash-circle"></i>
              </button>
            }
          </div>
        </ng-template>

        <!-- Templates d'actions Tarifs -->
        <ng-template #tarifRowActionsTpl let-tarif>
          <div class="row-actions-group">
            <button
              type="button"
              class="action-btn action-edit"
              (click)="openEditTarifModal(tarif)"
              title="Modifier ce tarif"
              aria-label="Modifier"
            >
              <i class="bi bi-pencil"></i>
            </button>
            <button
              type="button"
              class="action-btn action-delete"
              (click)="confirmDeleteTarif(tarif)"
              title="Supprimer ce tarif"
              aria-label="Supprimer"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </ng-template>

        <!-- Templates d'actions Paiements -->
        <ng-template #paiementRowActionsTpl let-p>
          <div class="row-actions-group">
            @if (canPayer() && p.statut === 'valide') {
              <button
                type="button"
                class="action-btn action-cancel"
                (click)="confirmAnnulerPaiement(p)"
                title="Annuler ce versement"
                aria-label="Annuler"
              >
                <i class="bi bi-slash-circle"></i>
              </button>
            }
          </div>
        </ng-template>

        <!-- Modales Connectées -->
        <app-inscription-form-modal
          #insModal
          [isOpen]="isInscriptionModalOpen()"
          [campagneId]="c.id"
          [tarifs]="tarifs()"
          (close)="closeInscriptionModal()"
          (saved)="onInscriptionSaved($event)"
        />

        <app-paiement-form-modal
          #paiementModal
          [isOpen]="isPaiementModalOpen()"
          [campagneId]="c.id"
          [inscription]="selectedInscriptionForPaiement()"
          (close)="closePaiementModal()"
          (saved)="onPaiementSaved($event)"
        />

        <app-tarif-form-modal
          #tarifModal
          [isOpen]="isTarifModalOpen()"
          [campagneId]="c.id"
          [tarif]="selectedTarifForEdit()"
          (close)="closeTarifModal()"
          (saved)="onTarifSaved($event)"
        />

        <app-confirm-dialog
          [isOpen]="isConfirmDialogOpen()"
          [title]="confirmTitle()"
          [message]="confirmMessage()"
          [confirmText]="confirmButtonText()"
          [variant]="confirmVariant()"
          (confirmed)="executeConfirmedAction()"
          (cancelled)="closeConfirmDialog()"
        />
      } @else if (errorMessage()) {
        <app-error-state
          title="Campagne introuvable"
          [message]="errorMessage()!"
          actionText="Retour aux pèlerinages"
          (action)="goBack()"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .pelerinage-detail-container {
      padding: var(--spacing-6, 1.5rem);
      max-width: 1400px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tabs-nav-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color, #e2e8f0);
    }
    .tab-nav-btn {
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all var(--transition-fast);
    }
    .tab-nav-btn:hover {
      color: var(--color-primary, #6366f1);
    }
    .tab-nav-btn.is-active {
      color: var(--color-primary, #6366f1);
      border-bottom-color: var(--color-primary, #6366f1);
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
      gap: 0.25rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid transparent;
      background: transparent;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      color: var(--text-muted, #64748b);
    }
    .action-pay:hover {
      background: var(--success-50, #f0fdf4);
      color: var(--success-600, #16a34a);
    }
    .action-check:hover {
      background: var(--info-50, #eff6ff);
      color: var(--info-600, #2563eb);
    }
    .action-absent:hover, .action-cancel:hover, .action-delete:hover {
      background: var(--danger-50, #fef2f2);
      color: var(--danger-600, #dc2626);
    }
    .action-edit:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--neutral-800, #1e293b);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PelerinageDetailPageComponent implements OnInit {
  @ViewChild('insModal') insModal?: InscriptionFormModalComponent;
  @ViewChild('paiementModal') paiementModal?: PaiementFormModalComponent;
  @ViewChild('tarifModal') tarifModal?: TarifFormModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pelerinageService = inject(PelerinageService);
  private readonly permissionService = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);

  public readonly activeTab = signal<'inscriptions' | 'tarifs' | 'paiements'>('inscriptions');
  public readonly isExporting = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  // Données
  public readonly campagne = signal<CampagnePelerinage | null>(null);
  public readonly stats = signal<CampagneStatistiques | null>(null);
  public readonly tarifs = signal<TarifPelerinage[]>([]);

  // Inscriptions
  public readonly isInscriptionsLoading = signal<boolean>(false);
  public readonly inscriptions = signal<InscriptionPelerinage[]>([]);
  public readonly totalInscriptions = signal<number>(0);
  public readonly insPage = signal<number>(1);
  public readonly insPerPage = signal<number>(15);
  public readonly insSearch = signal<string>('');
  public readonly insStatutFilter = signal<InscriptionStatut | 'tous'>('tous');
  public readonly insPresenceFilter = signal<ParticipationStatut | 'tous'>('tous');
  public readonly insTypeFilter = signal<ParticipantType | 'tous'>('tous');

  // Paiements
  public readonly isPaiementsLoading = signal<boolean>(false);
  public readonly paiements = signal<PaiementPelerinage[]>([]);
  public readonly totalPaiements = signal<number>(0);
  public readonly paiementPage = signal<number>(1);
  public readonly paiementPerPage = signal<number>(15);

  // Modales
  public readonly isInscriptionModalOpen = signal<boolean>(false);
  public readonly isPaiementModalOpen = signal<boolean>(false);
  public readonly selectedInscriptionForPaiement = signal<InscriptionPelerinage | null>(null);

  public readonly isTarifModalOpen = signal<boolean>(false);
  public readonly isTarifsLoading = signal<boolean>(false);
  public readonly selectedTarifForEdit = signal<TarifPelerinage | null>(null);

  // Confirm dialog
  public readonly isConfirmDialogOpen = signal<boolean>(false);
  public readonly confirmTitle = signal<string>('');
  public readonly confirmMessage = signal<string>('');
  public readonly confirmButtonText = signal<string>('Confirmer');
  public readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('danger');
  private pendingAction: (() => void) | null = null;

  // Permissions
  public readonly canUpdate = computed(() =>
    this.permissionService.hasPermission('pelerinages.update')
  );
  public readonly canInscrire = computed(() =>
    this.permissionService.hasPermission('pelerinages.create')
  );
  public readonly canPayer = computed(() =>
    this.permissionService.hasPermission('pelerinages.paiements')
  );

  public readonly pageSubtitle = computed(() => {
    const c = this.campagne();
    if (!c) return '';
    return `Sanctuaire : ${c.destination} • Du ${c.date_depart} au ${c.date_fin}`;
  });

  public readonly capaciteDisplay = computed(() => {
    const c = this.campagne();
    if (!c) return '—';
    const occ = this.stats()?.places_occupees ?? c.places_occupees ?? 0;
    return c.capacite ? `${occ} / ${c.capacite}` : `${occ} pèlerins`;
  });

  public readonly capaciteSubtitle = computed(() => {
    const c = this.campagne();
    if (!c) return '';
    if (c.est_complete) return 'Capacité maximale atteinte';
    const rest = this.stats()?.places_restantes;
    return rest !== null && rest !== undefined ? `${rest} places restantes` : 'Places illimitées';
  });

  public readonly hasActiveInscriptionFilters = computed(() => {
    return (
      this.insSearch().trim().length > 0 ||
      this.insStatutFilter() !== 'tous' ||
      this.insPresenceFilter() !== 'tous' ||
      this.insTypeFilter() !== 'tous'
    );
  });

  // Colonnes Inscriptions
  public readonly inscriptionColumns: TableColumn<InscriptionPelerinage>[] = [
    {
      key: 'reference',
      label: 'Réf. Inscription',
      width: '130px',
      formatter: (_val, row) => row.reference,
    },
    {
      key: 'nom_complet',
      label: 'Pèlerin',
      formatter: (_val, row) => row.nom_complet,
    },
    {
      key: 'type_participant',
      label: 'Profil',
      width: '110px',
      formatter: (_val, row) =>
        row.type_participant === 'CATECHUMENE' ? 'Catéchumène' : 'Externe',
    },
    {
      key: 'tarif',
      label: 'Forfait & Montant',
      formatter: (_val, row) => `${row.tarif?.libelle || 'Forfait'} (${row.montant} F)`,
    },
    {
      key: 'paye_reste',
      label: 'Payé / Reste',
      width: '150px',
      formatter: (_val, row) => `${row.montant_paye} F / ${row.reste_a_payer} F`,
    },
    {
      key: 'statut_inscription',
      label: 'Statut Paiement',
      width: '130px',
      align: 'center',
      formatter: (_val, row) => row.statut_inscription,
    },
    {
      key: 'statut_participation',
      label: 'Présence',
      width: '110px',
      align: 'center',
      formatter: (_val, row) => row.statut_participation,
    },
  ];

  // Colonnes Tarifs
  public readonly tarifColumns: TableColumn<TarifPelerinage>[] = [
    {
      key: 'code',
      label: 'Code',
      width: '110px',
      formatter: (_val, row) => row.code || '—',
    },
    {
      key: 'libelle',
      label: 'Libellé du Forfait',
      formatter: (_val, row) => row.libelle,
    },
    {
      key: 'montant',
      label: 'Montant (FCFA)',
      width: '140px',
      align: 'right',
      formatter: (_val, row) => `${row.montant} ${row.devise || 'FCFA'}`,
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '100px',
      align: 'center',
      formatter: (_val, row) => (row.statut === 'actif' ? 'Actif' : 'Inactif'),
    },
    {
      key: 'description',
      label: 'Prestations incluses',
      formatter: (_val, row) => row.description || '—',
    },
  ];

  // Colonnes Paiements
  public readonly paiementColumns: TableColumn<PaiementPelerinage>[] = [
    {
      key: 'reference',
      label: 'Réf. Paiement',
      width: '140px',
      formatter: (_val, row) => row.reference,
    },
    {
      key: 'date_paiement',
      label: 'Date',
      width: '120px',
      formatter: (_val, row) => row.date_paiement?.substring(0, 10) || '—',
    },
    {
      key: 'participant',
      label: 'Participant',
      formatter: (_val, row) =>
        row.inscription
          ? `${row.inscription.nom_complet} (${row.inscription.reference})`
          : '—',
    },
    {
      key: 'montant',
      label: 'Montant versé',
      width: '130px',
      align: 'right',
      formatter: (_val, row) => `${row.montant} FCFA`,
    },
    {
      key: 'mode_paiement',
      label: 'Mode',
      width: '130px',
      formatter: (_val, row) => row.mode_paiement,
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '100px',
      align: 'center',
      formatter: (_val, row) => (row.statut === 'valide' ? 'Validé' : 'Annulé'),
    },
  ];

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampagne(id);
    }
  }

  public setTab(tab: 'inscriptions' | 'tarifs' | 'paiements'): void {
    this.activeTab.set(tab);
    if (tab === 'inscriptions') this.loadInscriptions();
    if (tab === 'tarifs') this.loadTarifs();
    if (tab === 'paiements') this.loadPaiements();
  }

  public refreshAll(): void {
    const c = this.campagne();
    if (c) {
      this.loadCampagne(c.id);
    }
  }

  public exportParticipants(): void {
    const camp = this.campagne();
    if (!camp) return;

    this.isExporting.set(true);
    this.exportService.exportPelerinageParticipantsCsv(camp.id).subscribe({
      next: (blob) => {
        this.isExporting.set(false);
        const filename = `participants-pelerinage-${camp.code || camp.id}-${new Date().toISOString().slice(0, 10)}.csv`;
        this.exportService.downloadBlob(blob, filename);
        this.toast.success('Export réussi', 'La liste des participants a été exportée.');
      },
      error: () => {
        this.isExporting.set(false);
        this.toast.error('Erreur', "Échec de l'exportation des participants");
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/organisation/pelerinages']);
  }

  private loadCampagne(idOrUuid: number | string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pelerinageService.getCampagne(idOrUuid).subscribe({
      next: (res) => {
        this.campagne.set(res.data);
        this.stats.set(res.stats || null);
        this.tarifs.set(res.data.tarifs || []);
        this.isLoading.set(false);
        this.loadInscriptions();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 404
            ? 'Campagne de pèlerinage introuvable.'
            : 'Impossible de charger la campagne.'
        );
      },
    });
  }

  // Inscriptions
  public loadInscriptions(): void {
    const c = this.campagne();
    if (!c) return;

    this.isInscriptionsLoading.set(true);
    const filters: InscriptionFilters = {
      page: this.insPage(),
      per_page: this.insPerPage(),
      search: this.insSearch().trim() || undefined,
      statut_inscription: this.insStatutFilter(),
      statut_participation: this.insPresenceFilter(),
      type_participant: this.insTypeFilter(),
    };

    this.pelerinageService.getInscriptions(c.id, filters).subscribe({
      next: (res) => {
        this.inscriptions.set(res.data);
        this.totalInscriptions.set(res.meta.total);
        this.isInscriptionsLoading.set(false);
      },
      error: () => this.isInscriptionsLoading.set(false),
    });
  }

  public onSearchInscriptionChange(query: string): void {
    this.insSearch.set(query);
    this.insPage.set(1);
    this.loadInscriptions();
  }

  public onInsStatutChange(event: Event): void {
    this.insStatutFilter.set(
      (event.target as HTMLSelectElement).value as InscriptionStatut | 'tous'
    );
    this.insPage.set(1);
    this.loadInscriptions();
  }

  public onInsPresenceChange(event: Event): void {
    this.insPresenceFilter.set(
      (event.target as HTMLSelectElement).value as ParticipationStatut | 'tous'
    );
    this.insPage.set(1);
    this.loadInscriptions();
  }

  public onInsTypeChange(event: Event): void {
    this.insTypeFilter.set(
      (event.target as HTMLSelectElement).value as ParticipantType | 'tous'
    );
    this.insPage.set(1);
    this.loadInscriptions();
  }

  public onResetInscriptionFilters(): void {
    this.insSearch.set('');
    this.insStatutFilter.set('tous');
    this.insPresenceFilter.set('tous');
    this.insTypeFilter.set('tous');
    this.insPage.set(1);
    this.loadInscriptions();
  }

  public onInsPageChange(event: PageChangeEvent): void {
    this.insPage.set(event.page);
    this.insPerPage.set(event.perPage);
    this.loadInscriptions();
  }

  // Tarifs
  public loadTarifs(): void {
    const c = this.campagne();
    if (!c) return;

    this.isTarifsLoading.set(true);
    this.pelerinageService.getTarifs(c.id).subscribe({
      next: (data) => {
        this.tarifs.set(data);
        this.isTarifsLoading.set(false);
      },
      error: () => this.isTarifsLoading.set(false),
    });
  }

  // Paiements
  public loadPaiements(): void {
    const c = this.campagne();
    if (!c) return;

    this.isPaiementsLoading.set(true);
    const filters: PaiementFilters = {
      page: this.paiementPage(),
      per_page: this.paiementPerPage(),
    };

    this.pelerinageService.getCampagnePaiements(c.id, filters).subscribe({
      next: (res) => {
        this.paiements.set(res.data);
        this.totalPaiements.set(res.meta.total);
        this.isPaiementsLoading.set(false);
      },
      error: () => this.isPaiementsLoading.set(false),
    });
  }

  public onPaiementPageChange(event: PageChangeEvent): void {
    this.paiementPage.set(event.page);
    this.paiementPerPage.set(event.perPage);
    this.loadPaiements();
  }

  // Actions Inscriptions : Participation
  public setParticipation(
    inscription: InscriptionPelerinage,
    statut: ParticipationStatut
  ): void {
    const c = this.campagne();
    if (!c) return;

    this.pelerinageService.updateParticipation(c.id, inscription.id, statut).subscribe({
      next: () => {
        this.toast.success('Pointage enregistré', `Présence mise à jour pour ${inscription.nom_complet}.`);
        this.loadInscriptions();
      },
      error: (err) => {
        this.toast.error('Erreur', err?.error?.message || 'Erreur lors du pointage.');
      },
    });
  }

  // Actions Inscriptions : Annulation
  public confirmAnnulerInscription(inscription: InscriptionPelerinage): void {
    this.confirmTitle.set("Annuler l'inscription");
    this.confirmMessage.set(
      `Confirmez-vous l'annulation de l'inscription de "${inscription.nom_complet}" (Réf: ${inscription.reference}) ?`
    );
    this.confirmButtonText.set("Annuler l'inscription");
    this.confirmVariant.set('danger');
    this.pendingAction = () => {
      const c = this.campagne()!;
      this.pelerinageService.annulerInscription(c.id, inscription.id).subscribe({
        next: () => {
          this.toast.success('Inscription annulée', `L'inscription de ${inscription.nom_complet} a été annulée.`);
          this.refreshAll();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || "Erreur lors de l'annulation.");
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  // Modales : Inscription
  public openInscriptionModal(): void {
    this.isInscriptionModalOpen.set(true);
    setTimeout(() => this.insModal?.resetForm(), 0);
  }

  public closeInscriptionModal(): void {
    this.isInscriptionModalOpen.set(false);
  }

  public onInscriptionSaved(_ins: InscriptionPelerinage): void {
    this.closeInscriptionModal();
    this.refreshAll();
  }

  // Modales : Paiement
  public openPaiementModal(inscription: InscriptionPelerinage): void {
    this.selectedInscriptionForPaiement.set(inscription);
    this.isPaiementModalOpen.set(true);
    setTimeout(() => this.paiementModal?.updateMaxMontant(inscription.reste_a_payer), 0);
  }

  public closePaiementModal(): void {
    this.isPaiementModalOpen.set(false);
    this.selectedInscriptionForPaiement.set(null);
  }

  public onPaiementSaved(_res: any): void {
    this.closePaiementModal();
    this.refreshAll();
  }

  // Modales : Tarifs
  public openTarifModal(): void {
    this.selectedTarifForEdit.set(null);
    this.isTarifModalOpen.set(true);
    setTimeout(() => this.tarifModal?.updateFormValues(null), 0);
  }

  public openEditTarifModal(tarif: TarifPelerinage): void {
    this.selectedTarifForEdit.set(tarif);
    this.isTarifModalOpen.set(true);
    setTimeout(() => this.tarifModal?.updateFormValues(tarif), 0);
  }

  public closeTarifModal(): void {
    this.isTarifModalOpen.set(false);
    this.selectedTarifForEdit.set(null);
  }

  public onTarifSaved(_tarif: TarifPelerinage): void {
    this.closeTarifModal();
    this.loadTarifs();
  }

  public confirmDeleteTarif(tarif: TarifPelerinage): void {
    this.confirmTitle.set('Supprimer le forfait');
    this.confirmMessage.set(
      `Confirmez-vous la suppression du tarif "${tarif.libelle}" (${tarif.montant} FCFA) ?`
    );
    this.confirmButtonText.set('Supprimer');
    this.confirmVariant.set('danger');
    this.pendingAction = () => {
      const c = this.campagne()!;
      this.pelerinageService.deleteTarif(c.id, tarif.id).subscribe({
        next: () => {
          this.toast.success('Tarif supprimé', `Le forfait "${tarif.libelle}" a été supprimé.`);
          this.loadTarifs();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || 'Erreur lors de la suppression.');
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  // Annuler Paiement
  public confirmAnnulerPaiement(paiement: PaiementPelerinage): void {
    this.confirmTitle.set('Annuler le versement');
    this.confirmMessage.set(
      `Confirmez-vous l'annulation du paiement de ${paiement.montant} FCFA (Réf: ${paiement.reference}) ? Le solde de l'inscription sera réajusté.`
    );
    this.confirmButtonText.set('Annuler le versement');
    this.confirmVariant.set('danger');
    this.pendingAction = () => {
      const c = this.campagne()!;
      this.pelerinageService.annulerPaiement(c.id, paiement.id).subscribe({
        next: () => {
          this.toast.success('Paiement annulé', 'Le paiement a été annulé avec succès.');
          this.refreshAll();
        },
        error: (err) => {
          this.toast.error('Erreur', err?.error?.message || "Erreur lors de l'annulation du paiement.");
        },
      });
    };
    this.isConfirmDialogOpen.set(true);
  }

  public executeConfirmedAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.closeConfirmDialog();
  }

  public closeConfirmDialog(): void {
    this.isConfirmDialogOpen.set(false);
    this.pendingAction = null;
  }
}
