import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../core/services/toast.service';
import { PaiementService } from '../services/paiement.service';
import { PaiementAbonnement } from '../models/paiement.model';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { PaiementStatusBadgeComponent } from '../components/paiement-status-badge/paiement-status-badge.component';
import { EcheanceStatusBadgeComponent } from '../../abonnements/components/echeance-status-badge/echeance-status-badge.component';

@Component({
  selector: 'app-paiement-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    PaiementStatusBadgeComponent,
    EcheanceStatusBadgeComponent,
    CurrencyCfaPipe,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-2 text-muted">Chargement du détail du règlement...</p>
        </div>
      } @else if (hasError()) {
        <app-error-state
          title="Paiement introuvable"
          [message]="errorMessage()"
          (retry)="loadPaiement()"
        />
      } @else if (paiement(); as p) {
        <app-page-header
          [title]="'Paiement ' + p.reference"
          [subtitle]="'Encaissé le ' + (p.date_paiement | date:'dd/MM/yyyy') + ' pour ' + getParoisseNom()"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Paiements', path: '/super-admin/paiements' },
            { label: p.reference }
          ]"
        >
          <div page-actions class="d-flex gap-2">
            <app-btn
              variant="outline"
              size="md"
              (btnClick)="goBack()"
            >
              <i class="bi bi-arrow-left me-1"></i>
              <span>Retour</span>
            </app-btn>

            @if (p.statut === 'valide' || p.statut === 'en_attente') {
              <app-btn
                variant="danger"
                size="md"
                (btnClick)="openAnnulerModal()"
              >
                <i class="bi bi-x-circle me-1"></i>
                <span>Annuler</span>
              </app-btn>
            }

            @if (p.statut === 'valide') {
              <app-btn
                variant="warning"
                size="md"
                (btnClick)="openRembourserModal()"
              >
                <i class="bi bi-arrow-return-left me-1"></i>
                <span>Rembourser</span>
              </app-btn>
            }
          </div>
        </app-page-header>

        <!-- Grille de Détails -->
        <div class="details-layout">
          <!-- Colonne Principale -->
          <div class="main-column">
            <!-- Carte Résumé Financier -->
            <app-card title="Informations du versement" class="mb-4">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Référence :</span>
                  <strong class="value">{{ p.reference }}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Statut :</span>
                  <div class="value">
                    <app-paiement-status-badge [statut]="p.statut" />
                  </div>
                </div>

                <div class="info-item">
                  <span class="label">Montant encaissé :</span>
                  <span class="value amount-highlight">{{ p.montant | currencyCfa:'XOF' }}</span>
                </div>

                <div class="info-item">
                  <span class="label">Mode de règlement :</span>
                  <span class="value">{{ getModePaiementLabel(p.mode_paiement) }}</span>
                </div>

                <div class="info-item">
                  <span class="label">Date de versement :</span>
                  <span class="value">{{ p.date_paiement | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="info-item">
                  <span class="label">Réf. transaction :</span>
                  <span class="value">{{ p.reference_transaction || '-' }}</span>
                </div>

                @if (p.caissier) {
                  <div class="info-item">
                    <span class="label">Enregistré par :</span>
                    <span class="value">{{ p.caissier.nom }} {{ p.caissier.prenom || '' }} ({{ p.caissier.email }})</span>
                  </div>
                }

                <div class="info-item">
                  <span class="label">Date d'enregistrement :</span>
                  <span class="value">{{ p.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              @if (p.observation) {
                <div class="observation-box mt-3">
                  <span class="obs-title">Observation :</span>
                  <p class="obs-text">{{ p.observation }}</p>
                </div>
              }
            </app-card>

            <!-- Échéance Liée -->
            @if (p.echeance; as ech) {
              <app-card title="Échéance associée" class="mb-4">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Réf. Échéance :</span>
                    <a [routerLink]="['/super-admin/echeances', ech.id]" class="ref-link">
                      {{ ech.reference }}
                    </a>
                  </div>

                  <div class="info-item">
                    <span class="label">Statut échéance :</span>
                    <div class="value">
                      <app-echeance-status-badge [statut]="ech.statut" />
                    </div>
                  </div>

                  <div class="info-item">
                    <span class="label">Période couverte :</span>
                    <span class="value">
                      {{ ech.periode_debut | date:'dd/MM/yyyy' }} au {{ ech.periode_fin | date:'dd/MM/yyyy' }}
                    </span>
                  </div>

                  <div class="info-item">
                    <span class="label">Date limite :</span>
                    <span class="value">{{ ech.date_echeance | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                <div class="echeance-balance-box mt-3">
                  <div class="balance-metric">
                    <span class="metric-title">Montant Échéance</span>
                    <span class="metric-val">{{ ech.montant | currencyCfa:'XOF' }}</span>
                  </div>
                  <div class="balance-metric">
                    <span class="metric-title">Total Réglé</span>
                    <span class="metric-val text-success">{{ ech.montant_paye | currencyCfa:'XOF' }}</span>
                  </div>
                  <div class="balance-metric">
                    <span class="metric-title">Solde Restant</span>
                    <span class="metric-val text-danger font-bold">{{ ech.solde_restant | currencyCfa:'XOF' }}</span>
                  </div>
                </div>
              </app-card>
            }
          </div>

          <!-- Colonne Latérale : Abonnement & Paroisse -->
          <div class="side-column">
            @if (p.echeance?.abonnement; as abo) {
              <app-card title="Abonnement & Souscription" class="mb-4">
                <div class="side-info-list">
                  <div class="side-item">
                    <span class="side-label">Réf. Contrat :</span>
                    <a [routerLink]="['/super-admin/abonnements', abo.id]" class="ref-link font-semibold">
                      {{ abo.reference }}
                    </a>
                  </div>
                  <div class="side-item">
                    <span class="side-label">Paroisse :</span>
                    <strong class="side-val">{{ getParoisseNom() }}</strong>
                  </div>
                  @if (getDiocese()) {
                    <div class="side-item">
                      <span class="side-label">Diocèse :</span>
                      <span class="side-val">{{ getDiocese() }}</span>
                    </div>
                  }
                  <div class="side-item">
                    <span class="side-label">Produit SaaS :</span>
                    <span class="side-val">{{ getProduitNom() }}</span>
                  </div>
                  <div class="side-item">
                    <span class="side-label">Formule :</span>
                    <span class="side-val">{{ getFormuleNom() }}</span>
                  </div>
                  <div class="side-item">
                    <span class="side-label">Statut Contrat :</span>
                    <span class="side-val">{{ abo.statut }}</span>
                  </div>
                </div>
              </app-card>
            }
          </div>
        </div>

        <!-- Dialogue d'Annulation -->
        <app-confirm-dialog
          [isOpen]="isCancelDialogOpen()"
          title="Annuler le paiement"
          [message]="'Êtes-vous certain de vouloir annuler le règlement ' + p.reference + ' (' + (p.montant | currencyCfa:'XOF') + ') ?'"
          confirmLabel="Confirmer l'annulation"
          cancelLabel="Retour"
          variant="danger"
          [loading]="actionLoading()"
          (confirmed)="confirmAnnulation()"
          (cancelled)="closeActionDialog()"
        />

        <!-- Dialogue de Remboursement -->
        <app-confirm-dialog
          [isOpen]="isRefundDialogOpen()"
          title="Rembourser le paiement"
          [message]="'Confirmez-vous le remboursement de ce paiement de ' + (p.montant | currencyCfa:'XOF') + ' ?'"
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

    .d-flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }

    .details-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      font-size: 0.9375rem;
      color: #0f172a;
    }

    .amount-highlight {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-700, #0369a1);
    }

    .observation-box {
      background-color: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 0.375rem);
      border-left: 3px solid var(--primary-500, #0ea5e9);
    }

    .obs-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      display: block;
      margin-bottom: 0.25rem;
    }

    .obs-text {
      margin: 0;
      font-size: 0.875rem;
      color: #334155;
    }

    .echeance-balance-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      background-color: #f8fafc;
      padding: 1rem;
      border-radius: var(--radius-md, 0.375rem);
      border: 1px solid #e2e8f0;
      text-align: center;
    }

    .metric-title {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
      display: block;
      margin-bottom: 0.25rem;
    }

    .metric-val {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }

    .side-info-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .side-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .side-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .side-val {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .ref-link {
      color: var(--primary-600, #0284c7);
      text-decoration: underline;
    }

    .text-success { color: #047857; }
    .text-danger { color: #b91c1c; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }

    @media (max-width: 900px) {
      .details-layout {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paiementService = inject(PaiementService);
  private readonly toast = inject(ToastService);

  protected readonly paiement = signal<PaiementAbonnement | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly actionLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected readonly isCancelDialogOpen = signal<boolean>(false);
  protected readonly isRefundDialogOpen = signal<boolean>(false);

  public ngOnInit(): void {
    this.loadPaiement();
  }

  public loadPaiement(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.errorMessage.set('Identifiant de paiement non fourni.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.paiementService.getPaiement(id).subscribe({
      next: (data) => {
        this.paiement.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer les informations de ce paiement.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/paiements']);
  }

  public openAnnulerModal(): void {
    this.isCancelDialogOpen.set(true);
  }

  public openRembourserModal(): void {
    this.isRefundDialogOpen.set(true);
  }

  public closeActionDialog(): void {
    this.isCancelDialogOpen.set(false);
    this.isRefundDialogOpen.set(false);
  }

  public confirmAnnulation(): void {
    const p = this.paiement();
    if (!p || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.paiementService
      .annulerPaiement(p.id, { observation: 'Annulé depuis la vue détail Super Admin' })
      .subscribe({
        next: (updated) => {
          this.paiement.set(updated);
          this.toast.success('Paiement annulé', `Le paiement ${p.reference} a été annulé.`);
          this.actionLoading.set(false);
          this.closeActionDialog();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error('Erreur', err?.message || 'Erreur lors de l’annulation.');
        },
      });
  }

  public confirmRemboursement(): void {
    const p = this.paiement();
    if (!p || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.paiementService
      .rembourserPaiement(p.id, { observation: 'Remboursé depuis la vue détail Super Admin' })
      .subscribe({
        next: (updated) => {
          this.paiement.set(updated);
          this.toast.success('Paiement remboursé', `Le paiement ${p.reference} a été marqué comme remboursé.`);
          this.actionLoading.set(false);
          this.closeActionDialog();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error('Erreur', err?.message || 'Erreur lors du remboursement.');
        },
      });
  }

  protected getModePaiementLabel(mode: string): string {
    switch (mode) {
      case 'mobile_money':
        return 'Mobile Money (Wave, Orange, MTN, Moov)';
      case 'especes':
        return 'Espèces';
      case 'virement':
        return 'Virement bancaire';
      case 'cheque':
        return 'Chèque';
      case 'autre':
        return 'Autre';
      default:
        return mode || '-';
    }
  }

  protected getParoisseNom(): string {
    const p = this.paiement();
    return (
      p?.echeance?.abonnement?.paroisse?.nom_paroisse ||
      p?.echeance?.abonnement?.paroisse_nom ||
      'Paroisse non spécifiée'
    );
  }

  protected getDiocese(): string {
    const p = this.paiement();
    return p?.echeance?.abonnement?.paroisse?.diocese || '';
  }

  protected getProduitNom(): string {
    const p = this.paiement();
    return (
      p?.echeance?.abonnement?.formule?.produit?.nom ||
      p?.echeance?.abonnement?.produit_nom ||
      '-'
    );
  }

  protected getFormuleNom(): string {
    const p = this.paiement();
    return (
      p?.echeance?.abonnement?.formule?.nom ||
      p?.echeance?.abonnement?.formule_nom ||
      '-'
    );
  }
}
