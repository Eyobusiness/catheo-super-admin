import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { LoadingStateComponent } from '../../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent, ConfirmVariant } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { TextareaComponent } from '../../../../../shared/components/textarea/textarea.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { AbonnementService } from '../../services/abonnement.service';
import { Abonnement, AbonnementStatut } from '../../models/abonnement.model';
import { AbonnementStatusBadgeComponent } from '../../components/abonnement-status-badge/abonnement-status-badge.component';
import { EcheanceListComponent } from '../../components/echeance-list/echeance-list.component';

@Component({
  selector: 'app-abonnement-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    ModalComponent,
    TextareaComponent,
    AbonnementStatusBadgeComponent,
    EcheanceListComponent,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <app-loading-state message="Chargement des détails de l'abonnement..." />
      } @else if (hasError()) {
        <app-error-state
          [title]="errorTitle()"
          [message]="errorMessage()"
          (retry)="loadAbonnement()"
        />
      } @else if (abonnement()) {
        <!-- En-tête de page -->
        <app-page-header
          [title]="'Abonnement ' + abonnement()!.reference"
          [subtitle]="
            (abonnement()!.paroisse?.nom_paroisse || 'Paroisse inconnue') +
            ' — ' +
            (abonnement()!.formule?.produit?.nom || 'Module SaaS')
          "
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Abonnements', path: '/super-admin/abonnements' },
            { label: abonnement()!.reference }
          ]"
        >
          <div page-actions class="header-actions">
            <app-btn
              [variant]="'outline'"
              [size]="'sm'"
              (btnClick)="goBack()"
            >
              <i class="bi bi-arrow-left"></i>
              <span>Retour à la liste</span>
            </app-btn>

            @if (canActiver()) {
              <app-btn
                [variant]="'primary'"
                [size]="'sm'"
                [disabled]="actionLoading()"
                (btnClick)="openConfirmStatut('actif')"
              >
                <i class="bi bi-play-circle"></i>
                <span>Activer l'abonnement</span>
              </app-btn>
            }

            @if (canSuspendre()) {
              <app-btn
                [variant]="'outline'"
                [size]="'sm'"
                [disabled]="actionLoading()"
                (btnClick)="openConfirmStatut('suspendu')"
              >
                <i class="bi bi-pause-circle"></i>
                <span>Suspendre</span>
              </app-btn>
            }

            @if (canResilier()) {
              <app-btn
                [variant]="'danger'"
                [size]="'sm'"
                [disabled]="actionLoading()"
                (btnClick)="openResilierModal()"
              >
                <i class="bi bi-x-circle"></i>
                <span>Résilier</span>
              </app-btn>
            }
          </div>
        </app-page-header>

        <!-- Bandeau d'alerte si résilié -->
        @if (abonnement()!.statut === 'resilie') {
          <div class="resilie-banner" role="alert">
            <div class="banner-icon">
              <i class="bi bi-shield-x"></i>
            </div>
            <div class="banner-body">
              <strong>Cet abonnement a été résilié.</strong>
              <div class="banner-details">
                @if (abonnement()!.date_resiliation) {
                  <span>Date d'effet : {{ abonnement()!.date_resiliation | date: 'dd/MM/yyyy HH:mm' }}</span>
                }
                @if (abonnement()!.motif_resiliation) {
                  <span class="motif-text">Motif : {{ abonnement()!.motif_resiliation }}</span>
                }
              </div>
            </div>
          </div>
        }

        <div class="detail-grid">
          <!-- SECTION 1 : IDENTITÉ -->
          <app-card title="1. Identité de la souscription" class="grid-card">
            <div class="meta-list">
              <div class="meta-item">
                <span class="meta-label">Référence Contrat</span>
                <span class="meta-value font-mono font-bold highlight-ref">
                  {{ abonnement()!.reference }}
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Paroisse</span>
                <div class="meta-value font-bold">
                  {{ abonnement()!.paroisse?.nom_paroisse || '-' }}
                  @if (abonnement()!.paroisse?.code_paroisse) {
                    <span class="sub-code">({{ abonnement()!.paroisse?.code_paroisse }})</span>
                  }
                </div>
                @if (abonnement()!.paroisse?.diocese) {
                  <span class="meta-hint">Diocèse de {{ abonnement()!.paroisse?.diocese }}</span>
                }
              </div>

              <div class="meta-item">
                <span class="meta-label">Produit SaaS</span>
                <div class="meta-value">
                  <app-badge [variant]="'info'">
                    {{ abonnement()!.formule?.produit?.code || 'SaaS' }}
                  </app-badge>
                  <span class="ml-2 font-medium">
                    {{ abonnement()!.formule?.produit?.nom || '-' }}
                  </span>
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-label">Formule choisie</span>
                <div class="meta-value font-bold">
                  {{ abonnement()!.formule?.nom || '-' }}
                  @if (abonnement()!.formule?.est_gratuite) {
                    <app-badge [variant]="'success'" class="ml-2">Gratuite</app-badge>
                  }
                </div>
                @if (abonnement()!.formule?.periodicite) {
                  <span class="meta-hint">Périodicité : {{ abonnement()!.formule?.periodicite }}</span>
                }
              </div>
            </div>
          </app-card>

          <!-- SECTION 2 : CONDITIONS CONTRACTUELLES & FINANCIÈRES -->
          <app-card title="2. Conditions contractuelles" class="grid-card">
            <div class="meta-list">
              <div class="meta-item">
                <span class="meta-label">Statut actuel</span>
                <div class="meta-value">
                  <app-abonnement-status-badge [statut]="abonnement()!.statut" />
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-label">Montant contractuel (Snapshot)</span>
                <div class="meta-value font-mono font-bold amount-highlight">
                  {{ abonnement()!.montant_total | number }} {{ abonnement()!.devise }}
                </div>
                <span class="meta-hint">
                  Snapshot du prix de la formule au moment de la souscription (non modifiable)
                </span>
              </div>

              <div class="meta-item-row">
                <div class="meta-sub-item">
                  <span class="meta-label">Date de début</span>
                  <span class="meta-value font-medium">
                    {{ abonnement()!.date_debut | date: 'dd/MM/yyyy' }}
                  </span>
                </div>
                <div class="meta-sub-item">
                  <span class="meta-label">Date de fin</span>
                  <span class="meta-value font-medium">
                    {{ abonnement()!.date_fin ? (abonnement()!.date_fin | date: 'dd/MM/yyyy') : 'Indéterminée' }}
                  </span>
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-label">Renouvellement automatique</span>
                <span class="meta-value">
                  @if (abonnement()!.renouvellement_automatique) {
                    <span class="badge-tag tag-yes">
                      <i class="bi bi-check-circle-fill"></i> Activé
                    </span>
                  } @else {
                    <span class="badge-tag tag-no">
                      <i class="bi bi-dash-circle"></i> Désactivé
                    </span>
                  }
                </span>
              </div>

              @if (abonnement()!.observation) {
                <div class="meta-item">
                  <span class="meta-label">Observation interne</span>
                  <p class="meta-observation">{{ abonnement()!.observation }}</p>
                </div>
              }
            </div>
          </app-card>
        </div>

        <!-- SECTION 3 : ÉCHÉANCES DE FACTURATION -->
        <div class="echeances-section">
          <app-card title="3. Calendrier des Échéances" class="full-card">
            <div class="echeances-intro">
              <p>
                Échéances générées par le moteur de facturation central CATHEO.
                Les règlements et factures détaillés sont audités dans le registre central.
              </p>
            </div>
            <app-echeance-list [echeances]="abonnement()!.echeances || []" />
          </app-card>
        </div>
      }

      <!-- DIALOGUE CONFIRMATION STATUT (Activer / Suspendre) -->
      <app-confirm-dialog
        [isOpen]="isConfirmStatutOpen()"
        [title]="confirmStatutTitle()"
        [message]="confirmStatutMessage()"
        [confirmText]="confirmStatutBtnText()"
        [variant]="confirmStatutVariant()"
        [loading]="actionLoading()"
        (confirmed)="executeStatutChange()"
        (cancelled)="closeConfirmStatut()"
      />

      <!-- MODAL RÉSILIATION -->
      <app-modal
        [isOpen]="isResilierModalOpen()"
        title="Résilier l'abonnement"
        size="md"
        (close)="closeResilierModal()"
      >
        <div class="resilier-modal-body">
          <div class="resilier-warning">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div>
              <strong>Attention : cette action interrompt le contrat.</strong>
              <p>
                La paroisse ne pourra plus utiliser ce module SaaS après résiliation.
                Le backend exige un motif de résiliation détaillé.
              </p>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="field-label required">Motif de la résiliation *</label>
            <app-textarea
              [rows]="3"
              placeholder="Ex : Demande écrite de la paroisse, non-paiement prolongé..."
              [ngModel]="motifResiliation()"
              (ngModelChange)="motifResiliation.set($event)"
            />
            @if (resilierError()) {
              <p class="field-error">{{ resilierError() }}</p>
            }
          </div>
        </div>

        <div modal-footer class="modal-footer-actions">
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            [disabled]="actionLoading()"
            (btnClick)="closeResilierModal()"
          >
            Annuler
          </app-btn>

          <app-btn
            [variant]="'danger'"
            [size]="'sm'"
            [disabled]="actionLoading() || !motifResiliation().trim()"
            (btnClick)="executeResiliation()"
          >
            <i class="bi bi-x-circle"></i>
            <span>Confirmer la résiliation</span>
          </app-btn>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .resilie-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background-color: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-md, 8px);
      color: var(--danger-800, #991b1b);
    }
    .banner-icon {
      font-size: 1.5rem;
      line-height: 1;
      color: var(--danger-600, #dc2626);
    }
    .banner-body {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .banner-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--danger-700, #b91c1c);
    }
    .motif-text {
      font-style: italic;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .grid-card {
      height: 100%;
    }
    .meta-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .meta-item-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .meta-sub-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #64748b);
    }
    .meta-value {
      font-size: 0.9375rem;
      color: var(--text-primary, #0f172a);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .highlight-ref {
      font-size: 1.125rem;
      color: var(--primary-700, #1d4ed8);
    }
    .amount-highlight {
      font-size: 1.25rem;
      color: var(--success-700, #15803d);
    }
    .sub-code {
      font-weight: normal;
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }
    .meta-hint {
      font-size: 0.8125rem;
      color: var(--text-muted, #94a3b8);
    }
    .meta-observation {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      background: var(--neutral-50, #f8fafc);
      padding: 0.75rem;
      border-radius: var(--radius-sm, 4px);
      border-left: 3px solid var(--primary-500, #3b82f6);
      margin: 0;
    }
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
    }
    .tag-yes {
      background-color: var(--success-50, #f0fdf4);
      color: var(--success-700, #15803d);
    }
    .tag-no {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-600, #475569);
    }
    .echeances-section {
      margin-top: 0.5rem;
    }
    .echeances-intro {
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }
    .resilier-modal-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .resilier-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      background-color: var(--warning-50, #fffbeb);
      border: 1px solid var(--warning-200, #fde68a);
      border-radius: var(--radius-md, 8px);
      color: var(--warning-900, #78350f);
      font-size: 0.875rem;
    }
    .resilier-warning i {
      font-size: 1.25rem;
      color: var(--warning-600, #d97706);
    }
    .resilier-warning p {
      margin: 0.25rem 0 0 0;
      font-size: 0.8125rem;
      color: var(--warning-800, #92400e);
    }
    .field-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      margin-bottom: 0.35rem;
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      margin-top: 0.25rem;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .ml-2 { margin-left: 0.5rem; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .mt-3 { margin-top: 0.75rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbonnementDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly abonnementService = inject(AbonnementService);
  private readonly toastService = inject(ToastService);

  protected readonly abonnement = signal<Abonnement | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorTitle = signal<string>('Erreur');
  protected readonly errorMessage = signal<string>('');

  protected readonly actionLoading = signal<boolean>(false);

  // Confirm Statut Dialog
  protected readonly isConfirmStatutOpen = signal<boolean>(false);
  protected readonly targetStatut = signal<AbonnementStatut | null>(null);
  protected readonly confirmStatutTitle = signal<string>('');
  protected readonly confirmStatutMessage = signal<string>('');
  protected readonly confirmStatutBtnText = signal<string>('Confirmer');
  protected readonly confirmStatutVariant = signal<ConfirmVariant>('info');

  // Modal Résiliation
  protected readonly isResilierModalOpen = signal<boolean>(false);
  protected readonly motifResiliation = signal<string>('');
  protected readonly resilierError = signal<string>('');

  public ngOnInit(): void {
    this.loadAbonnement();
  }

  public loadAbonnement(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.showError('Identifiant manquant', "L'identifiant de l'abonnement est invalide.");
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.abonnementService.getAbonnement(id).subscribe({
      next: (abo) => {
        this.abonnement.set(abo);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.hasError.set(true);
        if (err.status === 404) {
          this.showError('Abonnement introuvable', "L'abonnement demandé n'existe pas ou a été supprimé.");
        } else if (err.status === 403) {
          this.showError('Accès refusé', "Vous n'avez pas l'autorisation d'accéder à cet abonnement.");
        } else {
          this.showError('Erreur de chargement', "Impossible de charger les données de l'abonnement.");
        }
      },
    });
  }

  private showError(title: string, message: string): void {
    this.hasError.set(true);
    this.errorTitle.set(title);
    this.errorMessage.set(message);
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/abonnements']);
  }

  // Permissions & Visibility
  protected canActiver(): boolean {
    const s = this.abonnement()?.statut;
    return s === 'en_attente' || s === 'suspendu';
  }

  protected canSuspendre(): boolean {
    return this.abonnement()?.statut === 'actif';
  }

  protected canResilier(): boolean {
    const s = this.abonnement()?.statut;
    return !!s && s !== 'resilie';
  }

  // Activation & Suspension
  public openConfirmStatut(statut: 'actif' | 'suspendu'): void {
    this.targetStatut.set(statut);
    if (statut === 'actif') {
      this.confirmStatutTitle.set("Activer l'abonnement");
      this.confirmStatutMessage.set(
        `Confirmez-vous l'activation de l'abonnement ${this.abonnement()?.reference || ''} pour la paroisse ${this.abonnement()?.paroisse?.nom_paroisse || ''} ?`
      );
      this.confirmStatutBtnText.set('Activer');
      this.confirmStatutVariant.set('info');
    } else {
      this.confirmStatutTitle.set("Suspendre l'abonnement");
      this.confirmStatutMessage.set(
        `Confirmez-vous la suspension temporaire de l'abonnement ${this.abonnement()?.reference || ''} ? Les services associés seront désactivés.`
      );
      this.confirmStatutBtnText.set('Suspendre');
      this.confirmStatutVariant.set('warning');
    }
    this.isConfirmStatutOpen.set(true);
  }

  public closeConfirmStatut(): void {
    this.isConfirmStatutOpen.set(false);
    this.targetStatut.set(null);
  }

  public executeStatutChange(): void {
    const target = this.targetStatut();
    const abo = this.abonnement();
    if (!target || !abo) return;

    this.actionLoading.set(true);
    this.abonnementService.changeStatut(abo.id, target).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.closeConfirmStatut();
        this.abonnement.set(updated);
        this.toastService.success(
          'Statut mis à jour',
          `L'abonnement est désormais ${target === 'actif' ? 'actif' : 'suspendu'}.`
        );
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.error(
          'Erreur',
          err.error?.message || 'Impossible de mettre à jour le statut.'
        );
      },
    });
  }

  // Résiliation
  public openResilierModal(): void {
    this.motifResiliation.set('');
    this.resilierError.set('');
    this.isResilierModalOpen.set(true);
  }

  public closeResilierModal(): void {
    this.isResilierModalOpen.set(false);
    this.motifResiliation.set('');
    this.resilierError.set('');
  }

  public executeResiliation(): void {
    const motif = this.motifResiliation().trim();
    const abo = this.abonnement();
    if (!motif) {
      this.resilierError.set('Le motif de résiliation est obligatoire.');
      return;
    }
    if (!abo) return;

    this.actionLoading.set(true);
    this.resilierError.set('');

    this.abonnementService.resilierAbonnement(abo.id, { motif_resiliation: motif }).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.closeResilierModal();
        this.abonnement.set(updated);
        this.toastService.success(
          'Abonnement résilié',
          `L'abonnement ${abo.reference} a été résilié conformément au contrat.`
        );
      },
      error: (err) => {
        this.actionLoading.set(false);
        if (err.status === 422 && err.error?.errors?.motif_resiliation) {
          this.resilierError.set(err.error.errors.motif_resiliation[0]);
        } else {
          this.toastService.error(
            'Erreur',
            err.error?.message || "Impossible de résilier l'abonnement."
          );
        }
      },
    });
  }
}
