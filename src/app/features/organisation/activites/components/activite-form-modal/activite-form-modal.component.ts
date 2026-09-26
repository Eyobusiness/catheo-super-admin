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
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../../shared/components/textarea/textarea.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ActiviteService } from '../../services/activite.service';
import { Membre } from '../../../membres/models/membre.model';
import {
  Activite,
  ActiviteStatut,
  CreateActiviteDto,
  UpdateActiviteDto,
} from '../../models/activite.model';

@Component({
  selector: 'app-activite-form-modal',
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
      size="lg"
      (close)="onCancel()"
    >
      @if (generalError()) {
        <div class="alert-error mb-4" role="alert">
          <i class="bi bi-exclamation-triangle-fill mr-2" aria-hidden="true"></i>
          <span>{{ generalError() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <!-- 1. GÉNÉRALITÉS -->
        <div class="form-section-title">
          <i class="bi bi-calendar-check text-primary mr-1" aria-hidden="true"></i>
          Identification de l'activité
        </div>

        <div class="form-row-2">
          <div class="form-group flex-2">
            <app-input
              label="Titre de l'activité"
              placeholder="Ex: Récollection de rentrée pastorale"
              [required]="true"
              formControlName="titre"
              [error]="getFieldError('titre')"
            />
          </div>
          <div class="form-group flex-1">
            <app-input
              label="Code référence (optionnel)"
              placeholder="Ex: ACT-2024-01"
              formControlName="code"
              [error]="getFieldError('code')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-select
              label="Type d'activité"
              [options]="typeActiviteOptions"
              formControlName="type_activite"
              [error]="getFieldError('type_activite')"
            />
          </div>
          <div class="form-group">
            <app-select
              label="Statut"
              [required]="true"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>
        </div>

        <!-- 2. PLANNING & LIEU -->
        <div class="form-section-title mt-2">
          <i class="bi bi-clock-history text-primary mr-1" aria-hidden="true"></i>
          Calendrier et Localisation
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              type="datetime-local"
              label="Date & Heure de début"
              [required]="true"
              formControlName="date_debut"
              [error]="getFieldError('date_debut')"
            />
          </div>
          <div class="form-group">
            <app-input
              type="datetime-local"
              label="Date & Heure de fin"
              formControlName="date_fin"
              [error]="getFieldError('date_fin')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group flex-2">
            <app-input
              label="Lieu / Emplacement"
              placeholder="Ex: Salle paroissiale Sainte Thérèse"
              formControlName="lieu"
              [error]="getFieldError('lieu')"
            />
          </div>
          <div class="form-group flex-1">
            <app-input
              type="number"
              label="Taux d'exécution (%)"
              placeholder="0 à 100"
              formControlName="taux_execution"
              [error]="getFieldError('taux_execution')"
            />
          </div>
        </div>

        <!-- 3. RESPONSABLE PASTORAL -->
        <div class="form-section-title mt-2">
          <i class="bi bi-person-badge text-primary mr-1" aria-hidden="true"></i>
          Responsable de l'activité
        </div>

        <div class="form-row-1">
          <div class="form-group">
            <app-select
              label="Désigner un responsable (Membre de l'organisation)"
              [options]="responsableOptions()"
              formControlName="responsable_id"
              [error]="getFieldError('responsable_id')"
            />
          </div>
        </div>

        <!-- 4. DESCRIPTION & OBSERVATIONS -->
        <div class="form-section-title mt-2">
          <i class="bi bi-text-paragraph text-primary mr-1" aria-hidden="true"></i>
          Détails & Notes
        </div>

        <div class="form-row-1">
          <div class="form-group">
            <app-textarea
              label="Description du programme ou des objectifs"
              placeholder="Objectifs pastoraux, public ciblé, matériel à prévoir..."
              [rows]="2"
              formControlName="description"
              [error]="getFieldError('description')"
            />
          </div>
        </div>

        <div class="form-row-1">
          <div class="form-group">
            <app-textarea
              label="Observations pastorales"
              placeholder="Remarques particulières, bilan ou consignes..."
              [rows]="2"
              formControlName="observation"
              [error]="getFieldError('observation')"
            />
          </div>
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
            {{ isEditMode() ? 'Enregistrer les modifications' : 'Planifier l\'activité' }}
          </app-btn>
        </div>
      </form>
    </app-modal>
  `,
  styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.35rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
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

    .form-row-1 {
      display: grid;
      grid-template-columns: 1fr;
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

    .text-primary {
      color: var(--primary-600, #2563eb);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiviteFormModalComponent {
  private readonly activiteService = inject(ActiviteService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly activite = input<Activite | null>(null);
  public readonly membres = input<Membre[]>([]);

  public readonly close = output<void>();
  public readonly saved = output<Activite>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly generalError = signal<string | null>(null);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly isEditMode = computed(() => !!this.activite());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier l’Activité Pastorale' : 'Planifier une Nouvelle Activité'
  );

  public readonly statutOptions: SelectOption[] = [
    { label: 'Brouillon', value: 'brouillon' },
    { label: 'Planifiée', value: 'planifiee' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'Terminée', value: 'terminee' },
    { label: 'Annulée', value: 'annulee' },
  ];

  public readonly typeActiviteOptions: SelectOption[] = [
    { label: 'Sélectionner un type...', value: '' },
    { label: 'Récollection / Retraite', value: 'Récollection' },
    { label: 'Camp / Sortie pastorale', value: 'Camp' },
    { label: 'Formation / Enseignement', value: 'Formation' },
    { label: 'Célébration / Messe', value: 'Célébration' },
    { label: 'Pèlerinage paroissial', value: 'Pèlerinage' },
    { label: 'Autre activité', value: 'Autre' },
  ];

  public readonly responsableOptions = computed<SelectOption[]>(() => {
    const list = this.membres();
    const options: SelectOption[] = [{ label: 'Aucun responsable assigné', value: '' }];
    list.forEach((m) => {
      options.push({
        label: `${m.nom_complet} (${m.fonction || 'Membre'})`,
        value: String(m.id),
      });
    });
    return options;
  });

  public readonly form = new FormGroup({
    titre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    code: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    type_activite: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    date_debut: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date_fin: new FormControl<string | null>(null),
    lieu: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    responsable_id: new FormControl<string>('', {
      nonNullable: true,
    }),
    statut: new FormControl<ActiviteStatut>('planifiee', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    taux_execution: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(100)],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
    observation: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const a = this.activite();
      if (a) {
        this.form.reset({
          titre: a.titre,
          code: a.code || '',
          type_activite: a.type_activite || '',
          date_debut: this.formatToDateTimeLocal(a.date_debut),
          date_fin: this.formatToDateTimeLocal(a.date_fin),
          lieu: a.lieu || '',
          responsable_id: a.responsable_id ? String(a.responsable_id) : '',
          statut: a.statut || 'planifiee',
          taux_execution: a.taux_execution || 0,
          description: a.description || '',
          observation: a.observation || '',
        });
      } else {
        this.form.reset({
          titre: '',
          code: '',
          type_activite: '',
          date_debut: '',
          date_fin: null,
          lieu: '',
          responsable_id: '',
          statut: 'planifiee',
          taux_execution: 0,
          description: '',
          observation: '',
        });
      }
      this.generalError.set(null);
      this.validationErrors.set({});
    });
  }

  public getFieldError(field: string): string {
    const backendErr = this.validationErrors()[field];
    if (backendErr && backendErr.length > 0) {
      return backendErr[0];
    }

    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['maxlength']) {
      return `Longueur maximale dépassée (${control.errors['maxlength'].requiredLength} caractères max).`;
    }
    if (control.errors['min'] || control.errors['max']) {
      return 'La valeur doit être comprise entre 0 et 100.';
    }

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

    const raw = this.form.getRawValue();
    const payload: CreateActiviteDto = {
      titre: raw.titre.trim(),
      code: raw.code.trim() || null,
      type_activite: raw.type_activite.trim() || null,
      date_debut: raw.date_debut,
      date_fin: raw.date_fin || null,
      lieu: raw.lieu.trim() || null,
      responsable_id: raw.responsable_id ? raw.responsable_id : null,
      statut: raw.statut,
      taux_execution: Number(raw.taux_execution) || 0,
      description: raw.description.trim() || null,
      observation: raw.observation.trim() || null,
    };

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const currentActivite = this.activite();

    if (currentActivite) {
      // Édition
      this.activiteService.updateActivite(currentActivite.id, payload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.toast.success('Activité mise à jour', `${updated.titre} a été mise à jour avec succès.`);
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      // Création
      this.activiteService.createActivite(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('Activité créée', `${created.titre} a été enregistrée avec succès.`);
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
      this.generalError.set(err.error.message || 'Certaines données saisies sont invalides.');
    } else {
      const msg = err.error?.message || err.message || 'Une erreur est survenue lors de l’enregistrement.';
      this.generalError.set(msg);
      this.toast.error('Erreur', msg);
    }
  }

  private formatToDateTimeLocal(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      // Format YYYY-MM-DDTHH:mm
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }
}
