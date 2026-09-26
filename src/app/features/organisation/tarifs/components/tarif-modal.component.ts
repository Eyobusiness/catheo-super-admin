import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ToastService } from '../../../../core/services/toast.service';
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import {
  CampagnePelerinage,
  StoreTarifPayload,
  TarifPelerinage,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-tarif-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="md"
      (close)="onCancel()"
    >
      @if (generalError()) {
        <div class="alert-error mb-4" role="alert">
          <i class="bi bi-exclamation-triangle-fill mr-2" aria-hidden="true"></i>
          <span>{{ generalError() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        @if (!campagneId()) {
          <div class="form-group">
            <app-select
              label="Campagne de pèlerinage"
              [required]="true"
              [options]="campagneOptions()"
              formControlName="campagne_id"
              [error]="getFieldError('campagne_id')"
            />
          </div>
        }

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              label="Catégorie / Libellé"
              placeholder="Ex: Enfant, Jeune, Adulte, Accompagnateur..."
              [required]="true"
              formControlName="categorie"
              [error]="getFieldError('categorie')"
            />
          </div>

          <div class="form-group">
            <app-input
              type="number"
              label="Montant (FCFA)"
              placeholder="Ex: 50000"
              [required]="true"
              formControlName="montant"
              [error]="getFieldError('montant')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              type="number"
              label="Âge minimum"
              placeholder="Ex: 6"
              formControlName="age_min"
              [error]="getFieldError('age_min')"
            />
          </div>

          <div class="form-group">
            <app-input
              type="number"
              label="Âge maximum"
              placeholder="Ex: 14"
              formControlName="age_max"
              [error]="getFieldError('age_max')"
            />
          </div>
        </div>

        <div class="form-group">
          <app-select
            label="Statut du tarif"
            [required]="true"
            [options]="statutOptions"
            formControlName="statut"
            [error]="getFieldError('statut')"
          />
        </div>

        <div class="form-group">
          <app-textarea
            label="Description / Conditions"
            placeholder="Précisions sur ce tarif (inclusions, transport, repas...)"
            [rows]="3"
            formControlName="description"
            [error]="getFieldError('description')"
          />
        </div>

        <div modal-footer class="modal-actions-footer">
          <app-btn
            type="button"
            variant="secondary"
            (btnClick)="onCancel()"
            [disabled]="isSubmitting()"
          >
            Annuler
          </app-btn>
          <app-btn
            type="submit"
            variant="primary"
            [loading]="isSubmitting()"
            [icon]="isEditMode() ? 'check-lg' : 'plus-lg'"
          >
            {{ isEditMode() ? 'Enregistrer les modifications' : 'Créer le tarif' }}
          </app-btn>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 640px) {
      .form-row-2 {
        grid-template-columns: 1fr 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .alert-error {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-md, 8px);
      color: var(--danger-700, #b91c1c);
      font-size: 0.85rem;
    }
    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifModalComponent {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly tarif = input<TarifPelerinage | null>(null);
  public readonly campagneId = input<number | string | null>(null);
  public readonly campagneNom = input<string>('');
  public readonly campagnes = input<CampagnePelerinage[]>([]);

  public readonly close = output<void>();
  public readonly saved = output<TarifPelerinage>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly generalError = signal<string | null>(null);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly isEditMode = computed(() => !!this.tarif());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier le Tarif' : 'Nouveau Tarif de Pèlerinage'
  );

  public readonly campagneOptions = computed<SelectOption[]>(() => {
    return this.campagnes().map((c) => ({
      label: `${c.nom} (${c.destination})`,
      value: String(c.id),
    }));
  });

  public readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
  ];

  public readonly form = new FormGroup({
    campagne_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    categorie: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    montant: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    age_min: new FormControl<number | null>(null, {
      validators: [Validators.min(0), Validators.max(120)],
    }),
    age_max: new FormControl<number | null>(null, {
      validators: [Validators.min(0), Validators.max(120)],
    }),
    statut: new FormControl<'actif' | 'inactif'>('actif', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const t = this.tarif();
      const parentCampagneId = this.campagneId();
      if (t) {
        this.form.reset({
          campagne_id: String(t.campagne_pelerinage_id || parentCampagneId || ''),
          categorie: t.libelle || '',
          montant: t.montant || 0,
          age_min: null,
          age_max: null,
          statut: t.statut || 'actif',
          description: t.description || '',
        });
      } else {
        this.form.reset({
          campagne_id: parentCampagneId ? String(parentCampagneId) : '',
          categorie: '',
          montant: null,
          age_min: null,
          age_max: null,
          statut: 'actif',
          description: '',
        });
      }
      this.generalError.set(null);
      this.validationErrors.set({});
    });
  }

  public getFieldError(field: string): string {
    const backendErr = this.validationErrors()[field];
    if (backendErr && backendErr.length > 0) return backendErr[0];
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['min']) return 'La valeur doit être positive.';
    return '';
  }

  public onCancel(): void {
    this.close.emit();
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const targetCampagneId = this.campagneId() || raw.campagne_id;

    if (!targetCampagneId) {
      this.generalError.set('Veuillez sélectionner une campagne.');
      this.isSubmitting.set(false);
      return;
    }

    const payload: StoreTarifPayload = {
      libelle: raw.categorie.trim(),
      montant: Number(raw.montant),
      statut: raw.statut,
      description: raw.description.trim() || undefined,
    };

    const currentTarif = this.tarif();

    if (currentTarif) {
      this.pelerinageService
        .updateTarif(targetCampagneId, currentTarif.id, payload)
        .subscribe({
          next: (updated) => {
            this.isSubmitting.set(false);
            this.toast.success('Tarif mis à jour', `Le tarif ${updated.libelle} a été modifié.`);
            this.saved.emit(updated);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.handleApiError(err);
          },
        });
    } else {
      this.pelerinageService
        .createTarif(targetCampagneId, payload)
        .subscribe({
          next: (created) => {
            this.isSubmitting.set(false);
            this.toast.success('Tarif créé', `Le tarif ${created.libelle} a été créé.`);
            this.saved.emit(created);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.handleApiError(err);
          },
        });
    }
  }

  private handleApiError(err: any): void {
    if (err.status === 422 && err.error?.errors) {
      this.validationErrors.set(err.error.errors);
      this.generalError.set(err.error.message || 'Données invalides.');
    } else {
      const msg = err.error?.message || err.message || 'Erreur lors de l’enregistrement.';
      this.generalError.set(msg);
      this.toast.error('Erreur', msg);
    }
  }
}
