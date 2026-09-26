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
  StoreTarifPayload,
  TarifPelerinage,
} from '../../models/pelerinage.model';
import { PelerinageService } from '../../services/pelerinage.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-tarif-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="md"
      (close)="onCancel()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="tarif-form">
        @if (serverError()) {
          <div class="alert-error mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill mr-2"></i>
            {{ serverError() }}
          </div>
        }

        <div class="form-group">
          <label for="libelle" class="form-label required">Libellé du tarif</label>
          <input
            id="libelle"
            type="text"
            formControlName="libelle"
            class="form-input"
            placeholder="Ex : Tarif Standard, Tarif Enfant, Forfait Couple"
          />
          @if (form.get('libelle')?.invalid && form.get('libelle')?.touched) {
            <span class="field-error">Le libellé est obligatoire.</span>
          }
        </div>

        <div class="grid grid-cols-2 gap-4 mt-3">
          <div class="form-group">
            <label for="montant" class="form-label required">Montant (FCFA)</label>
            <input
              id="montant"
              type="number"
              min="0"
              formControlName="montant"
              class="form-input"
              placeholder="Ex : 25000"
            />
            @if (form.get('montant')?.invalid && form.get('montant')?.touched) {
              <span class="field-error">Le montant doit être supérieur ou égal à 0.</span>
            }
          </div>

          <div class="form-group">
            <label for="code" class="form-label">Code tarif (optionnel)</label>
            <input
              id="code"
              type="text"
              formControlName="code"
              class="form-input"
              placeholder="Ex : TAR-STD"
            />
          </div>
        </div>

        <div class="form-group mt-3">
          <label for="statut" class="form-label">Statut</label>
          <select id="statut" formControlName="statut" class="form-select">
            <option value="actif">Actif (disponible à l'inscription)</option>
            <option value="inactif">Inactif (suspendu)</option>
          </select>
        </div>

        <div class="form-group mt-3">
          <label for="description" class="form-label">Prestations incluses / Description</label>
          <textarea
            id="description"
            rows="2"
            formControlName="description"
            class="form-textarea"
            placeholder="Transport aller-retour, livret de pèlerin, kit..."
          ></textarea>
        </div>
      </form>

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onCancel()" [disabled]="isSubmitting()">
          Annuler
        </app-btn>
        <app-btn
          variant="primary"
          icon="check-lg"
          [loading]="isSubmitting()"
          (btnClick)="onSubmit()"
        >
          {{ isEditMode() ? 'Mettre à jour' : 'Ajouter le tarif' }}
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .tarif-form {
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
export class TarifFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagneId = input.required<number | string>();
  public readonly tarif = input<TarifPelerinage | null>(null);

  public readonly close = output<void>();
  public readonly saved = output<TarifPelerinage>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly serverError = signal<string | null>(null);

  public readonly isEditMode = computed(() => !!this.tarif());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier le tarif' : 'Nouveau tarif de pèlerinage'
  );

  public readonly form: FormGroup = this.fb.group({
    libelle: ['', [Validators.required, Validators.maxLength(255)]],
    montant: [0, [Validators.required, Validators.min(0)]],
    code: [''],
    devise: ['XOF'],
    statut: ['actif'],
    description: [''],
  });

  public updateFormValues(tarif: TarifPelerinage | null): void {
    this.serverError.set(null);
    if (tarif) {
      this.form.patchValue({
        libelle: tarif.libelle,
        montant: tarif.montant,
        code: tarif.code || '',
        devise: tarif.devise || 'XOF',
        statut: tarif.statut || 'actif',
        description: tarif.description || '',
      });
    } else {
      this.form.reset({
        libelle: '',
        montant: 0,
        code: '',
        devise: 'XOF',
        statut: 'actif',
        description: '',
      });
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const formVal = this.form.value;
    const payload: StoreTarifPayload = {
      libelle: formVal.libelle.trim(),
      montant: Number(formVal.montant),
      code: formVal.code?.trim() || null,
      devise: formVal.devise || 'XOF',
      statut: formVal.statut || 'actif',
      description: formVal.description?.trim() || null,
    };

    if (this.isEditMode()) {
      const current = this.tarif()!;
      this.pelerinageService
        .updateTarif(this.campagneId(), current.id, payload)
        .subscribe({
          next: (updated) => {
            this.isSubmitting.set(false);
            this.toast.success('Tarif mis à jour', 'Tarif mis à jour avec succès.');
            this.saved.emit(updated);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.serverError.set(err?.error?.message || 'Erreur lors de la mise à jour du tarif.');
          },
        });
    } else {
      this.pelerinageService.createTarif(this.campagneId(), payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('Tarif créé', 'Tarif créé avec succès.');
          this.saved.emit(created);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(err?.error?.message || 'Erreur lors de la création du tarif.');
        },
      });
    }
  }

  public onCancel(): void {
    this.form.reset();
    this.serverError.set(null);
    this.close.emit();
  }
}
