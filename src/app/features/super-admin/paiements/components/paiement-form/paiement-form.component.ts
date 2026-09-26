import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../../shared/components/textarea/textarea.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { CurrencyCfaPipe } from '../../../../../shared/pipes/currency-cfa.pipe';
import { EcheanceAbonnement } from '../../models/echeance.model';
import { CreatePaiementData, ModePaiement } from '../../models/paiement.model';

@Component({
  selector: 'app-paiement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    ButtonComponent,
    CardComponent,
    CurrencyCfaPipe,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="paiement-form">
      <!-- Récapitulatif Échéance & Reste à Payer -->
      <app-card title="Échéance ciblée" class="form-card">
        <div class="echeance-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Référence :</span>
              <strong class="summary-val">{{ echeance().reference }}</strong>
            </div>
            <div class="summary-item">
              <span class="summary-label">Paroisse :</span>
              <span class="summary-val">{{ getParoisseNom() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Produit & Formule :</span>
              <span class="summary-val">{{ getProduitFormule() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Date limite d'échéance :</span>
              <span class="summary-val">{{ echeance().date_echeance | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <div class="financial-balance-strip">
            <div class="balance-cell">
              <span class="cell-label">Montant Échéance</span>
              <span class="cell-amount">{{ echeance().montant | currencyCfa:'XOF' }}</span>
            </div>
            <div class="balance-cell">
              <span class="cell-label">Déjà Réglé</span>
              <span class="cell-amount text-success">{{ echeance().montant_paye | currencyCfa:'XOF' }}</span>
            </div>
            <div class="balance-cell highlight-balance">
              <span class="cell-label">Solde Restant à Payer</span>
              <span class="cell-amount text-danger">{{ echeance().solde_restant | currencyCfa:'XOF' }}</span>
            </div>
          </div>
        </div>
      </app-card>

      <!-- Détails du Règlement -->
      <app-card title="Détails du paiement" class="form-card mt-4">
        <div class="form-grid">
          <!-- Montant à encaisser -->
          <div class="form-col">
            <div class="montant-field-container">
              <app-input
                label="Montant du versement (XOF)"
                type="number"
                formControlName="montant"
                [required]="true"
                [error]="getFieldError('montant')"
                placeholder="Ex: 50000"
              />
              <button
                type="button"
                class="btn-quick-fill"
                [disabled]="isSubmitting() || echeance().solde_restant <= 0"
                (click)="fillSoldeRestant()"
              >
                Régler la totalité ({{ echeance().solde_restant | currencyCfa:'XOF' }})
              </button>
            </div>
          </div>

          <!-- Mode de règlement -->
          <div class="form-col">
            <app-select
              label="Mode de paiement"
              [options]="modeOptions"
              formControlName="mode_paiement"
              [required]="true"
              [error]="getFieldError('mode_paiement')"
            />
          </div>

          <!-- Date du versement -->
          <div class="form-col">
            <app-input
              label="Date du paiement"
              type="date"
              formControlName="date_paiement"
              [required]="true"
              [error]="getFieldError('date_paiement')"
            />
          </div>

          <!-- Référence de transaction -->
          <div class="form-col">
            <app-input
              label="Référence de transaction (reçu, ID Wave/Orange, chèque)"
              type="text"
              formControlName="reference_transaction"
              [error]="getFieldError('reference_transaction')"
              placeholder="Ex: WAVE-TX-109283"
            />
          </div>

          <!-- Observation -->
          <div class="form-col-span-2">
            <app-textarea
              label="Observation ou notes comptables"
              formControlName="observation"
              [rows]="3"
              placeholder="Commentaire facultatif sur ce versement..."
            />
          </div>
        </div>
      </app-card>

      <!-- Actions -->
      <div class="form-actions mt-4">
        <app-btn
          variant="secondary"
          type="button"
          [disabled]="isSubmitting()"
          (btnClick)="onCancel()"
        >
          Annuler
        </app-btn>

        <app-btn
          variant="primary"
          type="submit"
          [loading]="isSubmitting()"
          [disabled]="form.invalid || isSubmitting() || echeance().solde_restant <= 0"
        >
          <i class="bi bi-check-circle me-1"></i>
          Enregistrer le paiement
        </app-btn>
      </div>
    </form>
  `,
  styles: [`
    .paiement-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .form-col-span-2 {
      grid-column: span 2;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .summary-val {
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .financial-balance-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      background-color: #f8fafc;
      padding: 1rem;
      border-radius: var(--radius-md, 0.375rem);
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
      color: #475569;
      font-weight: 500;
    }

    .cell-amount {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }

    .montant-field-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-quick-fill {
      background: none;
      border: none;
      color: var(--primary-600, #0284c7);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      padding: 0;
      margin-top: -0.25rem;
      text-decoration: underline;
    }

    .btn-quick-fill:disabled {
      color: #94a3b8;
      cursor: not-allowed;
      text-decoration: none;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .mt-4 { margin-top: 1rem; }
    .text-success { color: #047857; }
    .text-danger { color: #b91c1c; }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-col-span-2 {
        grid-column: span 1;
      }
      .financial-balance-strip {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  public readonly echeance = input.required<EcheanceAbonnement>();
  public readonly isSubmitting = input<boolean>(false);

  public readonly submitted = output<CreatePaiementData>();
  public readonly cancelled = output<void>();

  public form!: FormGroup;

  public readonly modeOptions: SelectOption[] = [
    { label: 'Mobile Money (Wave, Orange, MTN, Moov)', value: 'mobile_money' },
    { label: 'Espèces', value: 'especes' },
    { label: 'Virement bancaire', value: 'virement' },
    { label: 'Chèque', value: 'cheque' },
    { label: 'Autre moyen', value: 'autre' },
  ];

  public ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    const maxMontant = this.echeance().solde_restant;

    this.form = this.fb.group({
      montant: [
        maxMontant > 0 ? maxMontant : '',
        [Validators.required, Validators.min(1), Validators.max(maxMontant)],
      ],
      mode_paiement: ['mobile_money', [Validators.required]],
      date_paiement: [today, [Validators.required]],
      reference_transaction: ['', [Validators.maxLength(100)]],
      observation: [''],
    });
  }

  public fillSoldeRestant(): void {
    this.form.patchValue({
      montant: this.echeance().solde_restant,
    });
    this.form.get('montant')?.markAsDirty();
  }

  public onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const payload: CreatePaiementData = {
      echeance_abonnement_id: this.echeance().id,
      montant: Number(val.montant),
      mode_paiement: val.mode_paiement as ModePaiement,
      date_paiement: val.date_paiement,
      reference_transaction: val.reference_transaction?.trim() || null,
      observation: val.observation?.trim() || null,
    };

    this.submitted.emit(payload);
  }

  public onCancel(): void {
    this.cancelled.emit();
  }

  public getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Ce champ est obligatoire.';
    }
    if (control.errors['min']) {
      return `Le montant minimum est de ${control.errors['min'].min} XOF.`;
    }
    if (control.errors['max']) {
      return `Le montant ne peut pas dépasser le solde restant (${control.errors['max'].max} XOF).`;
    }
    if (control.errors['maxlength']) {
      return `Nombre maximal de caractères dépassé.`;
    }

    return 'Valeur non valide.';
  }

  protected getParoisseNom(): string {
    const ech = this.echeance();
    return (
      ech.abonnement?.paroisse?.nom_paroisse ||
      ech.abonnement?.paroisse_nom ||
      '-'
    );
  }

  protected getProduitFormule(): string {
    const ech = this.echeance();
    const produit =
      ech.abonnement?.formule?.produit?.nom ||
      ech.abonnement?.produit_nom ||
      '';
    const formule =
      ech.abonnement?.formule?.nom ||
      ech.abonnement?.formule_nom ||
      '';
    return produit && formule ? `${produit} (${formule})` : produit || formule || '-';
  }
}
