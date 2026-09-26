import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CaisseService } from '../../services/caisse.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { formatCfa } from '../../../../../shared/utils/format.utils';
import { OrganisationContextService } from '../../../../../core/services/organisation-context.service';
import { RecuModalComponent } from '../../../paiements/components/recu-modal.component';

@Component({
  selector: 'app-paiement-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    ConfirmDialogComponent,
    RecuModalComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Suivi des règlements du participant"
      size="lg"
      (close)="onClose()"
    >
      @if (inscription(); as insc) {
        <div class="paiement-detail-container" id="printable-quittance">
          <!-- Carte récapitulative du participant et solde -->
          <div class="summary-card">
            <div class="summary-header">
              <div class="participant-info">
                <h3 class="participant-name">{{ insc.nom_complet || (insc.nom + ' ' + (insc.prenoms || '')) }}</h3>
                <span class="campagne-name">{{ campagneNom() || 'Campagne de pèlerinage' }}</span>
                <span class="ref-badge">Réf. Inscription : {{ insc.reference }}</span>
              </div>
              <div class="status-box">
                <app-badge [variant]="getStatutVariant(inscStatut())">
                  {{ getStatutLabel(inscStatut()) }}
                </app-badge>
              </div>
            </div>

            <div class="financial-kpis">
              <div class="kpi-item">
                <span class="kpi-label">Montant total</span>
                <span class="kpi-val">{{ formatAmount(montantTotal()) }}</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Total déjà payé</span>
                <span class="kpi-val is-paid">{{ formatAmount(montantPaye()) }}</span>
              </div>
              <div class="kpi-item highlight">
                <span class="kpi-label">Reste à payer</span>
                <span class="kpi-val is-due">{{ formatAmount(resteAPayer()) }}</span>
              </div>
            </div>
          </div>

          <!-- Section Historique des versements -->
          <div class="payments-section">
            <div class="section-header">
              <h4 class="section-title">
                <i class="bi bi-clock-history mr-1"></i>
                Historique des versements ({{ paiements().length }})
              </h4>
              @if (canEnregistrer() && resteAPayer() > 0 && !showNewPaymentForm()) {
                <app-btn
                  variant="primary"
                  size="sm"
                  icon="plus-circle"
                  (btnClick)="openNewPaymentForm()"
                >
                  Nouveau versement
                </app-btn>
              }
            </div>

            <!-- Formulaire nouveau versement -->
            @if (showNewPaymentForm()) {
              <div class="new-payment-box">
                <h5 class="box-title">
                  <i class="bi bi-cash-coin mr-1"></i>
                  Enregistrer un versement
                </h5>

                @if (formError()) {
                  <div class="alert-error mb-3">{{ formError() }}</div>
                }

                <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="payment-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="montant" class="form-label required">Montant (FCFA)</label>
                      <input
                        id="montant"
                        type="number"
                        min="1"
                        [max]="resteAPayer()"
                        formControlName="montant"
                        class="form-input"
                        placeholder="Ex : 15000"
                      />
                      @if (paymentForm.get('montant')?.invalid && paymentForm.get('montant')?.touched) {
                        <span class="field-error">
                          Montant invalide (doit être &le; {{ formatAmount(resteAPayer()) }}).
                        </span>
                      }
                    </div>

                    <div class="form-group">
                      <label for="mode_paiement" class="form-label required">Mode de paiement</label>
                      <select id="mode_paiement" formControlName="mode_paiement" class="form-select">
                        <option value="especes">Espèces</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="virement">Virement bancaire</option>
                        <option value="cheque">Chèque</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="date_paiement" class="form-label">Date du paiement</label>
                      <input
                        id="date_paiement"
                        type="date"
                        formControlName="date_paiement"
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="reference_transaction" class="form-label">Réf. transaction / Chèque</label>
                      <input
                        id="reference_transaction"
                        type="text"
                        formControlName="reference_transaction"
                        class="form-input"
                        placeholder="Ex : TRX-987456 ou N° Chèque"
                      />
                    </div>

                    <div class="form-group">
                      <label for="observation" class="form-label">Observation</label>
                      <input
                        id="observation"
                        type="text"
                        formControlName="observation"
                        class="form-input"
                        placeholder="Remarque éventuelle"
                      />
                    </div>
                  </div>

                  <div class="form-actions">
                    <app-btn
                      variant="secondary"
                      size="sm"
                      (btnClick)="closeNewPaymentForm()"
                      [disabled]="isSubmitting()"
                    >
                      Annuler
                    </app-btn>
                    <app-btn
                      variant="primary"
                      size="sm"
                      icon="check-lg"
                      [loading]="isSubmitting()"
                      (btnClick)="submitPayment()"
                    >
                      Encaisser
                    </app-btn>
                  </div>
                </form>
              </div>
            }

            <!-- Tableau des paiements réels -->
            @if (isLoadingPaiements()) {
              <div class="loading-state">
                <i class="bi bi-arrow-repeat spin mr-2"></i>
                Chargement de l'historique des paiements...
              </div>
            } @else if (paiements().length === 0) {
              <div class="empty-payments">
                <i class="bi bi-wallet2 text-muted"></i>
                <p>Aucun paiement n'a encore été enregistré pour ce participant.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Réf. Quittance</th>
                      <th>Montant</th>
                      <th>Mode</th>
                      <th>Statut</th>
                      <th>Caissier</th>
                      <th>Observation</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of paiements(); track p.id) {
                      <tr [class.is-cancelled]="p.statut === 'annule'">
                        <td>{{ p.date_paiement ? (p.date_paiement | date: 'dd/MM/yyyy HH:mm') : '—' }}</td>
                        <td><strong>{{ p.reference }}</strong></td>
                        <td class="amount-cell">{{ formatAmount(p.montant) }}</td>
                        <td class="capitalize">{{ p.mode_paiement }}</td>
                        <td>
                          <app-badge [variant]="p.statut === 'valide' ? 'success' : 'danger'">
                            {{ p.statut === 'valide' ? 'Validé' : 'Annulé' }}
                          </app-badge>
                        </td>
                        <td>{{ p.caissier?.name || '—' }}</td>
                        <td class="obs-cell">{{ p.observation || '—' }}</td>
                        <td class="actions-cell">
                          @if (p.statut === 'valide') {
                            <button
                              type="button"
                              class="btn-action-icon btn-print-payment"
                              title="Imprimer le ticket thermique"
                              (click)="printSinglePayment(p)"
                            >
                              <i class="bi bi-printer text-primary"></i>
                            </button>
                            @if (canEnregistrer()) {
                              <button
                                type="button"
                                class="btn-action-icon btn-cancel-payment"
                                title="Annuler ce paiement"
                                (click)="promptCancel(p)"
                              >
                                <i class="bi bi-x-circle text-danger"></i>
                              </button>
                            }
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }

      <div modal-footer class="modal-footer-actions">
        <app-btn
          variant="secondary"
          icon="printer"
          [disabled]="paiements().length === 0"
          (btnClick)="printLatestPayment()"
        >
          Imprimer dernier ticket
        </app-btn>
        <app-btn variant="primary" (btnClick)="onClose()">
          Fermer
        </app-btn>
      </div>
    </app-modal>

    <!-- Modal Reçu thermique -->
    <app-recu-modal
      [isOpen]="isTicketModalOpen()"
      [paiement]="selectedPaymentForTicket()"
      [campagneNom]="campagneNom()"
      (close)="isTicketModalOpen.set(false)"
    />

    <!-- Dialog Confirmation Annulation -->
    <app-confirm-dialog
      [isOpen]="showCancelDialog()"
      title="Annuler le paiement"
      [message]="cancelConfirmMessage()"
      variant="danger"
      confirmText="Confirmer l'annulation"
      cancelText="Retour"
      [loading]="isCancelling()"
      (confirmed)="confirmCancelPayment()"
      (cancelled)="showCancelDialog.set(false)"
    />
  `,
  styles: [`
    .paiement-detail-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .summary-card {
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .participant-name {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
    }
    .campagne-name {
      display: block;
      font-size: 0.875rem;
      color: var(--color-primary, #6366f1);
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .ref-badge {
      display: inline-block;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.25rem;
    }
    .financial-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      padding-top: 0.875rem;
    }
    .kpi-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-muted, #64748b);
    }
    .kpi-val {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
    }
    .kpi-val.is-paid {
      color: var(--success-600, #16a34a);
    }
    .kpi-val.is-due {
      color: var(--danger-600, #dc2626);
    }
    .payments-section {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
      display: flex;
      align-items: center;
    }
    .new-payment-box {
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--color-primary-light, #e0e7ff);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
    }
    .box-title {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary, #6366f1);
    }
    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
    }
    .form-label.required::after {
      content: ' *';
      color: var(--danger-500, #ef4444);
    }
    .form-input, .form-select {
      padding: 0.375rem 0.625rem;
      font-size: 0.8125rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background: var(--bg-surface, #ffffff);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .field-error {
      font-size: 0.6875rem;
      color: var(--danger-600, #dc2626);
    }
    .alert-error {
      padding: 0.5rem 0.75rem;
      background: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-sm, 4px);
      color: var(--danger-700, #b91c1c);
      font-size: 0.75rem;
    }
    .table-responsive {
      overflow-x: auto;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .payments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .payments-table th, .payments-table td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .payments-table th {
      background: var(--bg-surface-elevated, #f8fafc);
      font-weight: 600;
      color: var(--text-muted, #64748b);
    }
    .payments-table tr.is-cancelled {
      background: var(--danger-50, #fef2f2);
      opacity: 0.75;
      text-decoration: line-through;
    }
    .amount-cell {
      font-weight: 600;
      color: var(--success-600, #16a34a);
    }
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .text-center {
      text-align: center !important;
    }
    .btn-action-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem 0.35rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm, 4px);
      transition: background 0.15s ease;
    }
    .btn-action-icon:hover {
      background: var(--bg-surface-elevated, #f1f5f9);
    }
    .btn-print-payment {
      color: var(--primary-600, #2563eb);
    }
    .btn-cancel-payment {
      color: var(--danger-600, #dc2626);
    }
    .empty-payments, .loading-state {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
      border: 1px dashed var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .modal-footer-actions {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    .capitalize {
      text-transform: capitalize;
    }
    .obs-cell {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .spin {
      animation: spin 1s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementDetailModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly caisseService = inject(CaisseService);
  private readonly toast = inject(ToastService);
  private readonly permission = inject(PermissionService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagneId = input.required<number | string>();
  public readonly campagneNom = input<string>('');
  public readonly inscription = input<any | null>(null);

  public readonly close = output<void>();
  public readonly paymentChanged = output<void>();

  public readonly paiements = signal<any[]>([]);
  public readonly isLoadingPaiements = signal<boolean>(false);
  public readonly showNewPaymentForm = signal<boolean>(false);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly formError = signal<string | null>(null);

  public readonly montantTotal = signal<number>(0);
  public readonly montantPaye = signal<number>(0);
  public readonly resteAPayer = signal<number>(0);
  public readonly inscStatut = signal<string>('en_attente');

  public readonly showCancelDialog = signal<boolean>(false);
  public readonly isCancelling = signal<boolean>(false);
  public readonly selectedPaymentToCancel = signal<any | null>(null);

  public readonly isTicketModalOpen = signal<boolean>(false);
  public readonly selectedPaymentForTicket = signal<any | null>(null);

  public readonly canEnregistrer = computed(() =>
    this.permission.hasPermission('pelerinages.paiements')
  );

  public readonly cancelConfirmMessage = computed(() => {
    const p = this.selectedPaymentToCancel();
    if (!p) return '';
    return `Êtes-vous sûr de vouloir annuler le versement de ${formatCfa(p.montant)} (Réf: ${p.reference}) ? Cette action mettra à jour le solde et annulera l'opération de caisse associée.`;
  });

  public readonly paymentForm: FormGroup = this.fb.group({
    montant: [null, [Validators.required, Validators.min(1)]],
    mode_paiement: ['especes', [Validators.required]],
    date_paiement: [new Date().toISOString().split('T')[0]],
    reference_transaction: [''],
    observation: [''],
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const insc = this.inscription();
      const campId = this.campagneId();

      if (open && insc && campId) {
        this.loadPaiements(campId, insc.id || insc.uuid);
      } else {
        this.showNewPaymentForm.set(false);
      }
    });
  }

  public loadPaiements(campagneId: number | string, inscriptionId: number | string): void {
    this.isLoadingPaiements.set(true);
    this.caisseService.getPaiementsInscription(campagneId, inscriptionId).subscribe({
      next: (res) => {
        this.paiements.set(res.data);
        this.montantTotal.set(res.meta.montant_total);
        this.montantPaye.set(res.meta.montant_paye);
        this.resteAPayer.set(Math.max(0, res.meta.reste_a_payer));
        this.inscStatut.set(res.meta.statut);
        this.isLoadingPaiements.set(false);
      },
      error: () => {
        this.isLoadingPaiements.set(false);
      },
    });
  }

  public openNewPaymentForm(): void {
    this.formError.set(null);
    this.paymentForm.reset({
      montant: this.resteAPayer() > 0 ? this.resteAPayer() : null,
      mode_paiement: 'especes',
      date_paiement: new Date().toISOString().split('T')[0],
      reference_transaction: '',
      observation: '',
    });
    this.paymentForm.get('montant')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.resteAPayer()),
    ]);
    this.paymentForm.get('montant')?.updateValueAndValidity();
    this.showNewPaymentForm.set(true);
  }

  public closeNewPaymentForm(): void {
    this.showNewPaymentForm.set(false);
    this.formError.set(null);
  }

  public submitPayment(): void {
    const insc = this.inscription();
    if (!insc) return;

    const val = this.paymentForm.value;
    const montant = Number(val.montant);

    if (montant > this.resteAPayer()) {
      this.formError.set(
        `Le montant (${this.formatAmount(montant)}) ne peut pas dépasser le reste à payer (${this.formatAmount(this.resteAPayer())}).`
      );
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    this.caisseService
      .enregistrerPaiement(this.campagneId(), insc.id || insc.uuid, {
        montant,
        mode_paiement: val.mode_paiement,
        date_paiement: val.date_paiement || null,
        reference_transaction: val.reference_transaction?.trim() || null,
        observation: val.observation?.trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.toast.success(
            'Versement enregistré',
            `Versement de ${formatCfa(montant)} enregistré avec succès (Réf: ${res.paiement.reference}).`
          );
          this.showNewPaymentForm.set(false);
          this.loadPaiements(this.campagneId(), insc.id || insc.uuid);
          this.paymentChanged.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(
            err?.error?.message || "Erreur lors de l'enregistrement du versement."
          );
        },
      });
  }

  public promptCancel(paiement: any): void {
    this.selectedPaymentToCancel.set(paiement);
    this.showCancelDialog.set(true);
  }

  public confirmCancelPayment(): void {
    const p = this.selectedPaymentToCancel();
    const insc = this.inscription();
    if (!p || !insc) return;

    this.isCancelling.set(true);
    this.caisseService
      .annulerPaiement(this.campagneId(), p.id || p.uuid, 'Annulé par le trésorier')
      .subscribe({
        next: () => {
          this.isCancelling.set(false);
          this.showCancelDialog.set(false);
          this.selectedPaymentToCancel.set(null);
          this.toast.success(
            'Paiement annulé',
            `Le paiement ${p.reference} a bien été annulé.`
          );
          this.loadPaiements(this.campagneId(), insc.id || insc.uuid);
          this.paymentChanged.emit();
        },
        error: (err) => {
          this.isCancelling.set(false);
          this.showCancelDialog.set(false);
          this.toast.error(
            'Erreur',
            err?.error?.message || "Erreur lors de l'annulation du paiement."
          );
        },
      });
  }

  public formatAmount(val: number): string {
    return formatCfa(val);
  }

  public getStatutVariant(statut: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (statut?.toLowerCase()) {
      case 'payee':
      case 'paye':
        return 'success';
      case 'partiellement_payee':
      case 'partiellement_paye':
        return 'warning';
      case 'annulee':
      case 'annule':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  public getStatutLabel(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'payee':
      case 'paye':
        return 'Soldé';
      case 'partiellement_payee':
      case 'partiellement_paye':
        return 'Partiel';
      case 'annulee':
      case 'annule':
        return 'Annulé';
      default:
        return 'En attente';
    }
  }

  public onClose(): void {
    this.close.emit();
  }

  public printQuittance(): void {
    window.print();
  }

  public printSinglePayment(paiement: any): void {
    const insc = this.inscription();
    // Prepare enriched payment object for thermal ticket modal
    const enriched = {
      ...paiement,
      inscription: paiement.inscription || {
        nom: insc?.nom || insc?.nom_complet || 'Pèlerin',
        prenoms: insc?.prenoms || '',
        reference: insc?.reference || '',
        telephone: insc?.telephone || '',
      },
    };
    this.selectedPaymentForTicket.set(enriched);
    this.isTicketModalOpen.set(true);
  }

  public printLatestPayment(): void {
    const list = this.paiements().filter((p) => p.statut === 'valide');
    if (list.length > 0) {
      this.printSinglePayment(list[0]);
    }
  }
}
