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
import { CaisseService } from '../../services/caisse.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { CampagnePelerinage } from '../../../pelerinages/models/pelerinage.model';
import { OperationCaisse, StoreDepensePayload } from '../../models/caisse.model';
import { formatCfa } from '../../../../../shared/utils/format.utils';

@Component({
  selector: 'app-depense-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Enregistrer une dépense (Décaissement)"
      size="md"
      (close)="onCancel()"
    >
      <div class="caisse-warning-notice mb-4">
        <div class="notice-icon">
          <i class="bi bi-info-circle-fill text-warning"></i>
        </div>
        <div class="notice-content">
          <span class="notice-title">Décompte automatique de caisse</span>
          <p class="notice-text">
            Cette sortie sera immédiatement déduite du solde effectif de la caisse.
            @if (soldeActuel() !== undefined) {
              Solde actuel disponible : <strong>{{ formatAmount(soldeActuel()) }}</strong>.
            }
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="depense-form">
        @if (serverError()) {
          <div class="alert-error mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill mr-2"></i>
            {{ serverError() }}
          </div>
        }

        <!-- Motif / Libellé -->
        <div class="form-group mb-3">
          <label for="libelle" class="form-label required">Motif / Libellé de la dépense</label>
          <input
            id="libelle"
            type="text"
            formControlName="libelle"
            class="form-input"
            placeholder="Ex : Achat livrets de prière, Transport autocar, Sonorisation..."
          />
          @if (form.get('libelle')?.invalid && form.get('libelle')?.touched) {
            <span class="field-error">Le motif de la dépense est obligatoire (max 255 car.).</span>
          }
        </div>

        <div class="form-grid mb-3">
          <!-- Montant -->
          <div class="form-group">
            <label for="montant" class="form-label required">Montant décaissé (FCFA)</label>
            <div class="input-with-suffix">
              <input
                id="montant"
                type="number"
                min="1"
                step="100"
                formControlName="montant"
                class="form-input font-bold text-danger"
                placeholder="Ex : 25000"
              />
              <span class="suffix-text">F CFA</span>
            </div>
            @if (form.get('montant')?.invalid && form.get('montant')?.touched) {
              <span class="field-error">Le montant doit être supérieur à zéro.</span>
            }
          </div>

          <!-- Mode de règlement -->
          <div class="form-group">
            <label for="mode_reglement" class="form-label required">Mode de règlement</label>
            <select id="mode_reglement" formControlName="mode_reglement" class="form-select">
              <option value="especes">Espèces (Caisse)</option>
              <option value="mobile_money">Mobile Money (Wave / Orange / MTN / Moov)</option>
              <option value="cheque">Chèque bancaire</option>
              <option value="virement">Virement bancaire</option>
              <option value="carte_bancaire">Carte bancaire</option>
            </select>
          </div>
        </div>

        <div class="form-grid mb-3">
          <!-- Date de la dépense -->
          <div class="form-group">
            <label for="date_operation" class="form-label required">Date du décaissement</label>
            <input
              id="date_operation"
              type="date"
              formControlName="date_operation"
              class="form-input"
            />
            @if (form.get('date_operation')?.invalid && form.get('date_operation')?.touched) {
              <span class="field-error">La date est obligatoire.</span>
            }
          </div>

          <!-- Bénéficiaire -->
          <div class="form-group">
            <label for="beneficiaire" class="form-label">Bénéficiaire / Prestataire</label>
            <input
              id="beneficiaire"
              type="text"
              formControlName="beneficiaire"
              class="form-input"
              placeholder="Ex : Librairie Paulines, Chauffeur..."
            />
          </div>
        </div>

        <!-- Rattachement facultatif à une campagne -->
        <div class="form-group mb-3">
          <label for="campagne_pelerinage_id" class="form-label">Rattachement à un pèlerinage (Optionnel)</label>
          <select id="campagne_pelerinage_id" formControlName="campagne_pelerinage_id" class="form-select">
            <option [ngValue]="null">Aucun pèlerinage (Dépense générale de caisse)</option>
            @for (camp of campagnes(); track camp.id) {
              <option [ngValue]="camp.id">{{ camp.code }} — {{ camp.nom }}</option>
            }
          </select>
          <span class="field-hint">Permet d'affecter cette charge directement au bilan financier du voyage.</span>
        </div>

        <!-- Observation / Notes -->
        <div class="form-group">
          <label for="observation" class="form-label">Notes / Pièce justificative</label>
          <textarea
            id="observation"
            rows="2"
            formControlName="observation"
            class="form-textarea"
            placeholder="N° facture, reçu, référence chèque ou note explicative..."
          ></textarea>
        </div>
      </form>

      <div modal-footer class="modal-footer-actions">
        <app-btn variant="secondary" (btnClick)="onCancel()" [disabled]="isSubmitting()">
          Annuler
        </app-btn>
        <app-btn
          variant="danger"
          icon="check-lg"
          [loading]="isSubmitting()"
          (btnClick)="onSubmit()"
        >
          Valider le décaissement
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .caisse-warning-notice {
      display: flex;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: var(--warning-50, #fffbeb);
      border: 1px solid var(--warning-200, #fde68a);
      border-radius: var(--radius-md, 8px);
      align-items: flex-start;
    }
    .notice-icon {
      font-size: 1.25rem;
      line-height: 1;
      margin-top: 0.1rem;
    }
    .notice-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--warning-800, #92400e);
      display: block;
      margin-bottom: 0.2rem;
    }
    .notice-text {
      font-size: 0.8rem;
      color: var(--warning-700, #b45309);
      margin: 0;
      line-height: 1.4;
    }
    .depense-form {
      display: flex;
      flex-direction: column;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
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
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--danger-500, #ef4444);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .input-with-suffix {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-suffix .form-input {
      padding-right: 4.5rem;
    }
    .suffix-text {
      position: absolute;
      right: 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
      pointer-events: none;
    }
    .font-bold {
      font-weight: 700;
    }
    .text-danger {
      color: var(--danger-600, #dc2626);
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
    }
    .field-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.15rem;
    }
    .alert-error {
      padding: 0.75rem 1rem;
      background-color: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-md, 8px);
      color: var(--danger-700, #b91c1c);
      font-size: 0.875rem;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepenseFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly caisseService = inject(CaisseService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly soldeActuel = input<number>(0);
  public readonly campagnes = input<CampagnePelerinage[]>([]);

  public readonly close = output<void>();
  public readonly saved = output<OperationCaisse>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly serverError = signal<string | null>(null);

  public readonly form: FormGroup = this.fb.group({
    libelle: ['', [Validators.required, Validators.maxLength(255)]],
    montant: [null, [Validators.required, Validators.min(1)]],
    mode_reglement: ['especes', [Validators.required]],
    date_operation: [this.getTodayDate(), [Validators.required]],
    campagne_pelerinage_id: [null],
    beneficiaire: [''],
    observation: [''],
  });

  public formatAmount(amount: number): string {
    return formatCfa(amount);
  }

  public resetForm(): void {
    this.serverError.set(null);
    this.form.reset({
      libelle: '',
      montant: null,
      mode_reglement: 'especes',
      date_operation: this.getTodayDate(),
      campagne_pelerinage_id: null,
      beneficiaire: '',
      observation: '',
    });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const val = this.form.value;
    const payload: StoreDepensePayload = {
      libelle: val.libelle.trim(),
      montant: Number(val.montant),
      mode_reglement: val.mode_reglement,
      date_operation: val.date_operation || null,
      campagne_pelerinage_id: val.campagne_pelerinage_id || null,
      beneficiaire: val.beneficiaire?.trim() || null,
      observation: val.observation?.trim() || null,
    };

    this.caisseService.enregistrerDepense(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.toast.success(
          'Dépense enregistrée',
          `Sortie de caisse de ${this.formatAmount(created.montant)} effectuée avec succès.`
        );
        this.saved.emit(created);
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.serverError.set(err?.error?.message || 'Erreur lors de l’enregistrement de la dépense.');
      },
    });
  }

  public onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  private getTodayDate(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
