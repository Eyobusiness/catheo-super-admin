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
import { EcheanceService } from '../services/echeance.service';
import { EcheanceAbonnement } from '../models/echeance.model';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { EcheanceStatusBadgeComponent } from '../../abonnements/components/echeance-status-badge/echeance-status-badge.component';
import { PaiementStatusBadgeComponent } from '../components/paiement-status-badge/paiement-status-badge.component';
import { FactureStatusBadgeComponent } from '../../factures/components/facture-status-badge/facture-status-badge.component';

@Component({
  selector: 'app-echeance-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    EcheanceStatusBadgeComponent,
    PaiementStatusBadgeComponent,
    FactureStatusBadgeComponent,
    CurrencyCfaPipe,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-2 text-muted">Chargement de l'échéance...</p>
        </div>
      } @else if (hasError()) {
        <app-error-state
          title="Échéance introuvable"
          [message]="errorMessage()"
          (retry)="loadEcheance()"
        />
      } @else if (echeance(); as ech) {
        <app-page-header
          [title]="'Échéance ' + ech.reference"
          [subtitle]="'Période du ' + (ech.periode_debut | date:'dd/MM/yyyy') + ' au ' + (ech.periode_fin | date:'dd/MM/yyyy')"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Échéances', path: '/super-admin/echeances' },
            { label: ech.reference }
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

            @if (ech.solde_restant > 0 && ech.statut !== 'annulee') {
              <app-btn
                variant="primary"
                size="md"
                (btnClick)="navigateToPaiement(ech.id)"
              >
                <i class="bi bi-cash-coin me-1"></i>
                <span>Enregistrer un versement</span>
              </app-btn>
            }

            @if (!ech.facture) {
              <app-btn
                variant="outline"
                size="md"
                (btnClick)="openGenererFactureModal()"
              >
                <i class="bi bi-receipt me-1"></i>
                <span>Générer Facture</span>
              </app-btn>
            }
          </div>
        </app-page-header>

        <!-- Balance Strip -->
        <div class="financial-balance-strip mb-4">
          <div class="balance-cell">
            <span class="cell-label">Montant Échéance</span>
            <span class="cell-amount">{{ ech.montant | currencyCfa:'XOF' }}</span>
          </div>
          <div class="balance-cell">
            <span class="cell-label">Déjà Réglé</span>
            <span class="cell-amount text-success">{{ ech.montant_paye | currencyCfa:'XOF' }}</span>
          </div>
          <div class="balance-cell highlight-balance">
            <span class="cell-label">Solde Restant</span>
            <span class="cell-amount text-danger font-bold">{{ ech.solde_restant | currencyCfa:'XOF' }}</span>
          </div>
          <div class="balance-cell">
            <span class="cell-label">Statut</span>
            <div class="mt-1">
              <app-echeance-status-badge [statut]="ech.statut" size="md" />
            </div>
          </div>
        </div>

        <!-- Grid: Details & Facture -->
        <div class="details-layout mb-4">
          <div class="main-column">
            <!-- Abonnement & Paroisse -->
            <app-card title="Abonnement et Paroisse" class="mb-4">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Réf. Abonnement :</span>
                  @if (ech.abonnement) {
                    <a [routerLink]="['/super-admin/abonnements', ech.abonnement.id]" class="ref-link font-semibold">
                      {{ ech.abonnement.reference }}
                    </a>
                  } @else {
                    <span class="value">-</span>
                  }
                </div>
                <div class="info-item">
                  <span class="label">Paroisse :</span>
                  <strong class="value">{{ getParoisseNom() }}</strong>
                </div>
                <div class="info-item">
                  <span class="label">Produit SaaS :</span>
                  <span class="value">{{ getProduitNom() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Formule :</span>
                  <span class="value">{{ getFormuleNom() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Date d'échéance :</span>
                  <span class="value font-medium">{{ ech.date_echeance | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </app-card>
          </div>

          <div class="side-column">
            <!-- Facture Associée -->
            <app-card title="Facture associée">
              @if (ech.facture) {
                <div class="facture-mini-card">
                  <div class="facture-row">
                    <span class="label">Réf. Facture :</span>
                    <a [routerLink]="['/super-admin/factures', ech.facture.id]" class="ref-link font-semibold">
                      {{ ech.facture.reference }}
                    </a>
                  </div>
                  <div class="facture-row">
                    <span class="label">Date émission :</span>
                    <span class="value">{{ ech.facture.date_facture | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="facture-row">
                    <span class="label">Total TTC :</span>
                    <span class="value font-bold">{{ ech.facture.montant_ttc | currencyCfa:'XOF' }}</span>
                  </div>
                  <div class="facture-row mt-2">
                    <span class="label">Statut :</span>
                    <app-facture-status-badge [statut]="ech.facture.statut" />
                  </div>
                  <div class="mt-3">
                    <app-btn
                      variant="outline"
                      size="sm"
                      (btnClick)="navigateToFacture(ech.facture.id)"
                    >
                      <i class="bi bi-eye me-1"></i>
                      Voir la facture
                    </app-btn>
                  </div>
                </div>
              } @else {
                <div class="no-facture-box">
                  <p class="text-muted mb-2">Aucune facture n'a encore été émise pour cette échéance.</p>
                  <app-btn
                    variant="primary"
                    size="sm"
                    (btnClick)="openGenererFactureModal()"
                  >
                    <i class="bi bi-file-earmark-plus me-1"></i>
                    Générer la facture
                  </app-btn>
                </div>
              }
            </app-card>
          </div>
        </div>

        <!-- Tableau des Paiements Liés -->
        <app-card title="Historique des règlements perçus">
          @if (!ech.paiements || ech.paiements.length === 0) {
            <div class="empty-payments-state">
              <i class="bi bi-receipt-cutoff empty-icon"></i>
              <p class="empty-title">Aucun versement enregistré</p>
              <p class="text-muted">Aucun paiement partiel ou total n'a été enregistré pour cette échéance.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="app-data-table">
                <thead>
                  <tr>
                    <th>Réf. Règlement</th>
                    <th>Date Versement</th>
                    <th>Mode</th>
                    <th>Réf. Transaction</th>
                    <th class="text-end">Montant</th>
                    <th class="text-center">Statut</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of ech.paiements; track p.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/super-admin/paiements', p.id]" class="ref-link font-medium">
                          {{ p.reference }}
                        </a>
                      </td>
                      <td>{{ p.date_paiement | date:'dd/MM/yyyy' }}</td>
                      <td>{{ p.mode_paiement }}</td>
                      <td>{{ p.reference_transaction || '-' }}</td>
                      <td class="text-end font-semibold">{{ p.montant | currencyCfa:'XOF' }}</td>
                      <td class="text-center">
                        <app-paiement-status-badge [statut]="p.statut" />
                      </td>
                      <td class="text-end">
                        <app-btn
                          variant="ghost"
                          size="sm"
                          (btnClick)="navigateToPaiementDetail(p.id)"
                        >
                          <i class="bi bi-arrow-right"></i>
                        </app-btn>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </app-card>

        <!-- Dialogue Génération Facture -->
        <app-confirm-dialog
          [isOpen]="isInvoiceDialogOpen()"
          title="Générer la facture officielle"
          [message]="'Voulez-vous générer la facture pour cette échéance avec un taux de TVA de 18% ?'"
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
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }

    .financial-balance-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      background-color: #ffffff;
      padding: 1.25rem;
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid #e2e8f0;
    }

    .balance-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      text-align: center;
    }

    .highlight-balance {
      background-color: #fff1f2;
      border-radius: var(--radius-sm, 0.25rem);
      padding: 0.25rem;
    }

    .cell-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cell-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .details-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    }

    .value {
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .facture-mini-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .facture-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .no-facture-box {
      text-align: center;
      padding: 1rem;
    }

    .empty-payments-state {
      text-align: center;
      padding: 2.5rem;
    }

    .empty-icon {
      font-size: 2.5rem;
      color: #94a3b8;
      display: block;
      margin-bottom: 0.5rem;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.25rem;
    }

    .app-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .app-data-table th {
      background-color: #f8fafc;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }

    .app-data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .text-center { text-align: center; }
    .text-end { text-align: right; }
    .text-success { color: #047857; }
    .text-danger { color: #b91c1c; }
    .text-muted { color: #64748b; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }

    .ref-link {
      color: var(--primary-600, #0284c7);
      text-decoration: underline;
    }

    @media (max-width: 900px) {
      .details-layout {
        grid-template-columns: 1fr;
      }
      .financial-balance-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcheanceDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly echeanceService = inject(EcheanceService);
  private readonly toast = inject(ToastService);

  protected readonly echeance = signal<EcheanceAbonnement | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly actionLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected readonly isInvoiceDialogOpen = signal<boolean>(false);

  public ngOnInit(): void {
    this.loadEcheance();
  }

  public loadEcheance(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.errorMessage.set('Identifiant d’échéance non fourni.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.echeanceService.getEcheance(id).subscribe({
      next: (data) => {
        this.echeance.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer l’échéance demandée.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/echeances']);
  }

  public navigateToPaiement(echeanceId: string | number): void {
    this.router.navigate(['/super-admin/paiements/nouveau'], {
      queryParams: { echeance_id: echeanceId },
    });
  }

  public navigateToPaiementDetail(paiementId: string | number): void {
    this.router.navigate(['/super-admin/paiements', paiementId]);
  }

  public navigateToFacture(factureId: string | number): void {
    this.router.navigate(['/super-admin/factures', factureId]);
  }

  public openGenererFactureModal(): void {
    this.isInvoiceDialogOpen.set(true);
  }

  public closeInvoiceDialog(): void {
    this.isInvoiceDialogOpen.set(false);
  }

  public confirmGenererFacture(): void {
    const ech = this.echeance();
    if (!ech || this.actionLoading()) return;

    this.actionLoading.set(true);
    this.echeanceService
      .genererFacture(ech.id, {
        taux_tva: 18,
        description: `Facture pour échéance ${ech.reference}`,
      })
      .subscribe({
        next: (facture) => {
          this.toast.success(
            'Facture créée',
            `La facture ${facture.reference} a été créée avec succès.`
          );
          this.actionLoading.set(false);
          this.closeInvoiceDialog();
          this.loadEcheance();
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

  protected getParoisseNom(): string {
    const ech = this.echeance();
    return (
      ech?.abonnement?.paroisse?.nom_paroisse ||
      ech?.abonnement?.paroisse_nom ||
      'Paroisse non spécifiée'
    );
  }

  protected getProduitNom(): string {
    const ech = this.echeance();
    return (
      ech?.abonnement?.formule?.produit?.nom ||
      ech?.abonnement?.produit_nom ||
      '-'
    );
  }

  protected getFormuleNom(): string {
    const ech = this.echeance();
    return (
      ech?.abonnement?.formule?.nom ||
      ech?.abonnement?.formule_nom ||
      '-'
    );
  }
}
