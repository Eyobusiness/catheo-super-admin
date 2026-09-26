import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
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
import {
  InscriptionPelerinage,
  PaiementPelerinage,
  StorePaiementPayload,
} from '../../models/pelerinage.model';
import { PelerinageService } from '../../services/pelerinage.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-paiement-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Enregistrer un versement"
      size="md"
      (close)="onCancel()"
    >
      @if (inscription(); as ins) {
        <div class="participant-summary-card mb-4">
          <div class="summary-line">
            <span class="summary-label">Participant :</span>
            <span class="summary-val font-bold">{{ ins.nom_complet }}</span>
          </div>
          <div class="summary-line">
            <span class="summary-label">Réf. Inscription :</span>
            <span class="summary-val font-mono">{{ ins.reference }}</span>
          </div>
          <div class="summary-badges mt-2">
            <span class="pill-stat">Total : {{ ins.montant }} F</span>
            <span class="pill-stat pill-paid">Déjà payé : {{ ins.montant_paye }} F</span>
            <span class="pill-stat pill-due">Reste : {{ ins.reste_a_payer }} F</span>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="paiement-form">
          @if (serverError()) {
            <div class="alert-error mb-4" role="alert">
              <i class="bi bi-exclamation-triangle-fill mr-2"></i>
              {{ serverError() }}
            </div>
          }

          <div class="form-group">
            <label for="montant" class="form-label required">Montant du versement (FCFA)</label>
            <div class="input-with-action">
              <input
                id="montant"
                type="number"
                min="1"
                [max]="ins.reste_a_payer"
                formControlName="montant"
                class="form-input"
                placeholder="Montant versé"
              />
              <button
                type="button"
                class="btn-solde-complet"
                (click)="setSoldeComplet(ins.reste_a_payer)"
                title="Régler l'intégralité du solde"
              >
                Solde complet
              </button>
            </div>
            @if (form.get('montant')?.invalid && form.get('montant')?.touched) {
              <span class="field-error">
                Le montant doit être compris entre 1 et {{ ins.reste_a_payer }} FCFA.
              </span>
            }
          </div>

          <div class="form-group mt-3">
            <label for="mode_paiement" class="form-label required">Mode de paiement</label>
            <select id="mode_paiement" formControlName="mode_paiement" class="form-select">
              <option value="espece">Espèces (Caisse Paroisse)</option>
              <option value="mobile_money">Mobile Money (Wave, Orange, MTN, Moov)</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement bancaire</option>
              <option value="carte_bancaire">Carte bancaire</option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label for="reference_transaction" class="form-label">Référence transaction / Numéro de reçu</label>
            <input
              id="reference_transaction"
              type="text"
              formControlName="reference_transaction"
              class="form-input"
              placeholder="Ex : ID Wave, Numéro de chèque, Bordereau..."
            />
          </div>

          <div class="form-group mt-3">
            <label for="observation" class="form-label">Observation</label>
            <textarea
              id="observation"
              rows="2"
              formControlName="observation"
              class="form-textarea"
              placeholder="Note ou précision sur ce versement..."
            ></textarea>
          </div>
        </form>
      }

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onCancel()" [disabled]="isSubmitting()">
          Annuler
        </app-btn>
        <app-btn
          variant="primary"
          icon="cash-coin"
          [loading]="isSubmitting()"
          (btnClick)="onSubmit()"
        >
          Valider l'encaissement
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .participant-summary-card {
      padding: 0.875rem 1rem;
      background-color: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
    .summary-label {
      color: var(--text-muted, #64748b);
    }
    .summary-val {
      color: var(--text-color, #1e293b);
    }
    .summary-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .pill-stat {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: var(--neutral-200, #e2e8f0);
      color: var(--text-color, #1e293b);
    }
    .pill-paid {
      background: var(--success-100, #dcfce7);
      color: var(--success-800, #166534);
    }
    .pill-due {
      background: var(--warning-100, #fef3c7);
      color: var(--warning-800, #92400e);
    }
    .input-with-action {
      display: flex;
      gap: 0.5rem;
    }
    .btn-solde-complet {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      background: var(--color-primary-light, #e0e7ff);
      color: var(--color-primary, #6366f1);
      border: 1px solid var(--color-primary, #6366f1);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .btn-solde-complet:hover {
      background: var(--color-primary, #6366f1);
      color: #ffffff;
    }
    .paiement-form {
      display: flex;
      flex-direction: column;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
    }
    .form-label.required::after {
      content: ' *';
      color: var(--danger-500, #ef4444);
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--text-color, #1e293b);
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
    }
    .alert-error {
      padding: 0.75rem 1rem;
      background-color: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-md, 8px);
      color: var(--danger-700, #b91c1c);
      font-size: 0.875rem;
    }
    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagneId = input.required<number | string>();
  public readonly inscription = input<InscriptionPelerinage | null>(null);

  public readonly close = output<void>();
  public readonly saved = output<{
    paiement: PaiementPelerinage;
    inscription: InscriptionPelerinage;
  }>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly serverError = signal<string | null>(null);

  public readonly form: FormGroup = this.fb.group({
    montant: [null, [Validators.required, Validators.min(1)]],
    mode_paiement: ['espece', [Validators.required]],
    reference_transaction: [''],
    observation: [''],
  });

  public updateMaxMontant(resteAPayer: number): void {
    const montantCtrl = this.form.get('montant');
    montantCtrl?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(resteAPayer),
    ]);
    montantCtrl?.setValue(resteAPayer);
    montantCtrl?.updateValueAndValidity();
    this.serverError.set(null);
  }

  public setSoldeComplet(resteAPayer: number): void {
    this.form.patchValue({ montant: resteAPayer });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const ins = this.inscription();
    if (!ins) return;

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const f = this.form.value;
    const payload: StorePaiementPayload = {
      montant: Number(f.montant),
      mode_paiement: f.mode_paiement,
      reference_transaction: f.reference_transaction?.trim() || null,
      observation: f.observation?.trim() || null,
    };

    this.pelerinageService
      .createPaiement(this.campagneId(), ins.id, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.toast.success(
            'Paiement enregistré',
            `Paiement de ${payload.montant} FCFA enregistré avec succès (Réf: ${res.paiement.reference}).`
          );
          this.saved.emit(res);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            err?.error?.message || "Erreur lors de l'enregistrement du paiement."
          );
        },
      });
  }

  public onCancel(): void {
    this.form.reset({
      montant: null,
      mode_paiement: 'espece',
      reference_transaction: '',
      observation: '',
    });
    this.serverError.set(null);
    this.close.emit();
  }
}
