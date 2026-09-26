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
  CampagnePelerinage,
  StoreCampagnePayload,
  UpdateCampagnePayload,
} from '../../models/pelerinage.model';
import { PelerinageService } from '../../services/pelerinage.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-campagne-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="lg"
      (close)="onCancel()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="campagne-form">
        <!-- Message d'erreur serveur -->
        @if (serverError()) {
          <div class="alert-error mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill mr-2"></i>
            {{ serverError() }}
          </div>
        }

        <div class="form-grid">
          <!-- Nom de la Campagne -->
          <div class="form-group col-span-2">
            <label for="nom" class="form-label required">Nom de la campagne</label>
            <input
              id="nom"
              type="text"
              formControlName="nom"
              class="form-input"
              placeholder="Ex : Pèlerinage Marial à Issia 2026"
            />
            @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
              <span class="field-error">Le nom est obligatoire (max 255 caractères).</span>
            }
          </div>

          <!-- Lieu de Départ & Destination -->
          <div class="form-group">
            <label for="lieu_depart" class="form-label required">Lieu de départ</label>
            <input
              id="lieu_depart"
              type="text"
              formControlName="lieu_depart"
              class="form-input"
              placeholder="Ex : Paroisse Sainte Famille"
            />
            @if (form.get('lieu_depart')?.invalid && form.get('lieu_depart')?.touched) {
              <span class="field-error">Le lieu de départ est obligatoire.</span>
            }
          </div>

          <div class="form-group">
            <label for="destination" class="form-label required">Destination / Sanctuaire</label>
            <input
              id="destination"
              type="text"
              formControlName="destination"
              class="form-input"
              placeholder="Ex : Sanctuaire Marial d'Issia"
            />
            @if (form.get('destination')?.invalid && form.get('destination')?.touched) {
              <span class="field-error">La destination est obligatoire.</span>
            }
          </div>

          <!-- Dates & Heures de Départ -->
          <div class="form-group">
            <label for="date_depart" class="form-label required">Date de départ</label>
            <input
              id="date_depart"
              type="date"
              formControlName="date_depart"
              class="form-input"
            />
            @if (form.get('date_depart')?.invalid && form.get('date_depart')?.touched) {
              <span class="field-error">La date de départ est obligatoire.</span>
            }
          </div>

          <div class="form-group">
            <label for="heure_depart" class="form-label">Heure de départ (H:i)</label>
            <input
              id="heure_depart"
              type="time"
              formControlName="heure_depart"
              class="form-input"
            />
          </div>

          <!-- Dates & Heures de Fin -->
          <div class="form-group">
            <label for="date_fin" class="form-label required">Date de fin</label>
            <input
              id="date_fin"
              type="date"
              formControlName="date_fin"
              class="form-input"
            />
            @if (form.get('date_fin')?.invalid && form.get('date_fin')?.touched) {
              <span class="field-error">La date de fin doit être égale ou postérieure au départ.</span>
            }
          </div>

          <div class="form-group">
            <label for="heure_fin" class="form-label">Heure de fin (H:i)</label>
            <input
              id="heure_fin"
              type="time"
              formControlName="heure_fin"
              class="form-input"
            />
          </div>

          <!-- Période d'Inscription & Capacité -->
          <div class="form-group">
            <label for="date_debut_inscription" class="form-label">Ouverture des inscriptions</label>
            <input
              id="date_debut_inscription"
              type="date"
              formControlName="date_debut_inscription"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="date_fin_inscription" class="form-label">Clôture des inscriptions</label>
            <input
              id="date_fin_inscription"
              type="date"
              formControlName="date_fin_inscription"
              class="form-input"
            />
          </div>

          <div class="form-group col-span-2">
            <label for="capacite" class="form-label">Capacité maximale (places)</label>
            <input
              id="capacite"
              type="number"
              min="1"
              formControlName="capacite"
              class="form-input"
              placeholder="Ex : 120 (laisser vide si illimité)"
            />
            @if (form.get('capacite')?.invalid && form.get('capacite')?.touched) {
              <span class="field-error">La capacité doit être un entier supérieur ou égal à 1.</span>
            }
          </div>

          <!-- Description & Consignes -->
          <div class="form-group col-span-2">
            <label for="description" class="form-label">Programme & Consignes logistiques</label>
            <textarea
              id="description"
              rows="3"
              formControlName="description"
              class="form-textarea"
              placeholder="Indications sur le transport, l'hébergement, la restauration..."
            ></textarea>
          </div>
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
          {{ isEditMode() ? 'Mettre à jour' : 'Créer la campagne' }}
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .campagne-form {
      display: flex;
      flex-direction: column;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .col-span-2 {
      grid-column: span 2;
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
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .col-span-2 {
        grid-column: span 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagne = input<CampagnePelerinage | null>(null);

  public readonly close = output<void>();
  public readonly saved = output<CampagnePelerinage>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly serverError = signal<string | null>(null);

  public readonly isEditMode = computed(() => !!this.campagne());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier la campagne de pèlerinage' : 'Nouvelle campagne de pèlerinage'
  );

  public readonly form: FormGroup = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    lieu_depart: ['', [Validators.required, Validators.maxLength(255)]],
    destination: ['', [Validators.required, Validators.maxLength(255)]],
    date_depart: ['', [Validators.required]],
    heure_depart: [''],
    date_fin: ['', [Validators.required]],
    heure_fin: [''],
    date_debut_inscription: [''],
    date_fin_inscription: [''],
    capacite: [null, [Validators.min(1)]],
    observation: [''],
  });

  // Synchronise le formulaire lors de l'ouverture
  public updateFormValues(campagne: CampagnePelerinage | null): void {
    this.serverError.set(null);
    if (campagne) {
      this.form.patchValue({
        nom: campagne.nom,
        description: campagne.description || '',
        lieu_depart: campagne.lieu_depart,
        destination: campagne.destination,
        date_depart: campagne.date_depart,
        heure_depart: campagne.heure_depart || '',
        date_fin: campagne.date_fin,
        heure_fin: campagne.heure_fin || '',
        date_debut_inscription: campagne.date_debut_inscription || '',
        date_fin_inscription: campagne.date_fin_inscription || '',
        capacite: campagne.capacite || null,
        observation: campagne.observation || '',
      });
    } else {
      this.form.reset({
        nom: '',
        description: '',
        lieu_depart: '',
        destination: '',
        date_depart: '',
        heure_depart: '',
        date_fin: '',
        heure_fin: '',
        date_debut_inscription: '',
        date_fin_inscription: '',
        capacite: null,
        observation: '',
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
    const payload: StoreCampagnePayload = {
      nom: formVal.nom.trim(),
      description: formVal.description?.trim() || null,
      activite_id: null,
      lieu_depart: formVal.lieu_depart.trim(),
      destination: formVal.destination.trim(),
      date_depart: formVal.date_depart,
      heure_depart: formVal.heure_depart || null,
      date_fin: formVal.date_fin,
      heure_fin: formVal.heure_fin || null,
      date_debut_inscription: formVal.date_debut_inscription || null,
      date_fin_inscription: formVal.date_fin_inscription || null,
      capacite: formVal.capacite ? Number(formVal.capacite) : null,
      observation: formVal.observation?.trim() || null,
    };

    if (this.isEditMode()) {
      const current = this.campagne()!;
      this.pelerinageService.updateCampagne(current.id, payload as UpdateCampagnePayload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.toast.success('Campagne mise à jour', 'Campagne mise à jour avec succès.');
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(err?.error?.message || 'Erreur lors de la mise à jour.');
        },
      });
    } else {
      this.pelerinageService.createCampagne(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('Campagne créée', 'Campagne créée avec succès.');
          this.saved.emit(created);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.serverError.set(err?.error?.message || 'Erreur lors de la création de la campagne.');
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
