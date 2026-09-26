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
import { MembreService } from '../../services/membre.service';
import {
  Membre,
  MembreSexe,
  MembreStatut,
  CreateMembreDto,
  UpdateMembreDto,
} from '../../models/membre.model';

@Component({
  selector: 'app-membre-form-modal',
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
        <!-- 1. IDENTITÉ -->
        <div class="form-section-title">
          <i class="bi bi-person-fill text-primary mr-1" aria-hidden="true"></i>
          Identité du membre
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              label="Nom de famille"
              placeholder="Ex: KOUASSI"
              [required]="true"
              formControlName="nom"
              [error]="getFieldError('nom')"
            />
          </div>
          <div class="form-group">
            <app-input
              label="Prénoms"
              placeholder="Ex: Jean-Philippe"
              [required]="true"
              formControlName="prenoms"
              [error]="getFieldError('prenoms')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-select
              label="Genre / Sexe"
              [required]="true"
              [options]="sexeOptions"
              formControlName="sexe"
              [error]="getFieldError('sexe')"
            />
          </div>
          <div class="form-group">
            <app-input
              type="date"
              label="Date de naissance"
              formControlName="date_naissance"
              [error]="getFieldError('date_naissance')"
            />
          </div>
        </div>

        <!-- 2. FONCTION & RÔLE -->
        <div class="form-section-title mt-4">
          <i class="bi bi-briefcase-fill text-primary mr-1" aria-hidden="true"></i>
          Rôle, Mandat & Statut pastoral
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-select
              label="Fonction au Bureau"
              [options]="fonctionPredefinieOptions"
              formControlName="fonctionPreset"
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

        @if (form.get('fonctionPreset')?.value === 'AUTRE') {
          <div class="form-row-1">
            <div class="form-group">
              <app-input
                label="Intitulé de la Fonction Personnalisée"
                placeholder="Ex: Responsable logistique, Chargé de communication..."
                formControlName="fonction"
                [required]="true"
                [error]="getFieldError('fonction')"
              />
            </div>
          </div>
        }

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              label="Mandat / Période"
              placeholder="Ex: 2024 - 2027"
              formControlName="mandat"
              [error]="getFieldError('mandat')"
            />
          </div>
          <div class="form-group">
            <app-input
              type="date"
              label="Date d'entrée / adhésion"
              formControlName="date_entree"
              [error]="getFieldError('date_entree')"
            />
          </div>
        </div>

        <!-- 3. COORDONNÉES -->
        <div class="form-section-title mt-4">
          <i class="bi bi-telephone-fill text-primary mr-1" aria-hidden="true"></i>
          Coordonnées
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              type="tel"
              label="Téléphone"
              placeholder="Ex: 0701020304"
              formControlName="telephone"
              [error]="getFieldError('telephone')"
            />
          </div>
          <div class="form-group">
            <app-input
              type="email"
              label="Adresse Email"
              placeholder="Ex: membre@eglise.ci"
              formControlName="email"
              [error]="getFieldError('email')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              label="Quartier"
              placeholder="Ex: Cocody Angré"
              formControlName="quartier"
              [error]="getFieldError('quartier')"
            />
          </div>
          <div class="form-group">
            <app-input
              label="Adresse postale / géographique"
              placeholder="Ex: Rue L12, Villa 42"
              formControlName="adresse"
              [error]="getFieldError('adresse')"
            />
          </div>
        </div>

        <!-- 4. OBSERVATION -->
        <div class="form-section-title mt-4">
          <i class="bi bi-chat-left-text text-primary mr-1" aria-hidden="true"></i>
          Remarques & Observations
        </div>

        <div class="form-row-1">
          <div class="form-group">
            <app-textarea
              label="Observation"
              placeholder="Notes confidentielles ou compétences particulières..."
              [rows]="3"
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
            {{ isEditMode() ? 'Enregistrer les modifications' : 'Ajouter le membre' }}
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
export class MembreFormModalComponent {
  private readonly membreService = inject(MembreService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly membre = input<Membre | null>(null);

  public readonly close = output<void>();
  public readonly saved = output<Membre>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly generalError = signal<string | null>(null);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly isEditMode = computed(() => !!this.membre());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier la Fiche Membre' : 'Nouveau Membre de l’Équipe'
  );

  public readonly sexeOptions: SelectOption[] = [
    { label: 'Masculin (M)', value: 'M' },
    { label: 'Féminin (F)', value: 'F' },
  ];

  public readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
    { label: 'Suspendu', value: 'suspendu' },
  ];

  public readonly fonctionPredefinieOptions: SelectOption[] = [
    { label: 'Président', value: 'Président' },
    { label: 'Vice-président', value: 'Vice-président' },
    { label: 'Secrétaire', value: 'Secrétaire' },
    { label: 'Trésorier', value: 'Trésorier' },
    { label: 'Responsable Spirituel', value: 'Responsable Spirituel' },
    { label: 'Autre (Personnalisé)', value: 'AUTRE' },
  ];

  public readonly form = new FormGroup({
    nom: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    prenoms: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    sexe: new FormControl<MembreSexe>('M', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date_naissance: new FormControl<string | null>(null),
    fonctionPreset: new FormControl<string>('Président', {
      nonNullable: true,
    }),
    fonction: new FormControl<string>('Président', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    mandat: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    statut: new FormControl<MembreStatut>('actif', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date_entree: new FormControl<string | null>(null),
    telephone: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(150)],
    }),
    quartier: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(150)],
    }),
    adresse: new FormControl<string>('', {
      nonNullable: true,
    }),
    observation: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const m = this.membre();
      const predefined = ['Président', 'Vice-président', 'Secrétaire', 'Trésorier', 'Responsable Spirituel'];
      if (m) {
        const isPredefined = m.fonction && predefined.includes(m.fonction);
        const preset = isPredefined ? m.fonction! : (m.fonction ? 'AUTRE' : 'Président');
        this.form.reset({
          nom: m.nom,
          prenoms: m.prenoms,
          sexe: m.sexe,
          date_naissance: m.date_naissance || null,
          fonctionPreset: preset,
          fonction: m.fonction || 'Président',
          mandat: m.mandat || '',
          statut: m.statut || 'actif',
          date_entree: m.date_entree || null,
          telephone: m.telephone || '',
          email: m.email || '',
          quartier: m.quartier || '',
          adresse: m.adresse || '',
          observation: m.observation || '',
        });
      } else {
        this.form.reset({
          nom: '',
          prenoms: '',
          sexe: 'M',
          date_naissance: null,
          fonctionPreset: 'Président',
          fonction: 'Président',
          mandat: '',
          statut: 'actif',
          date_entree: null,
          telephone: '',
          email: '',
          quartier: '',
          adresse: '',
          observation: '',
        });
      }
      this.generalError.set(null);
      this.validationErrors.set({});
    });

    this.form.get('fonctionPreset')?.valueChanges.subscribe((val) => {
      if (val !== 'AUTRE') {
        this.form.patchValue({ fonction: val || 'Président' }, { emitEvent: false });
      } else {
        this.form.patchValue({ fonction: '' }, { emitEvent: false });
      }
    });
  }

  public getFieldError(field: string): string {
    // 1. Erreurs renvoyées par le backend Laravel (422)
    const backendErr = this.validationErrors()[field];
    if (backendErr && backendErr.length > 0) {
      return backendErr[0];
    }

    // 2. Erreurs frontend
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['email']) return 'Format d’adresse email invalide.';
    if (control.errors['maxlength']) {
      return `Longueur maximale dépassée (${control.errors['maxlength'].requiredLength} caractères max).`;
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

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const finalFonction = raw.fonctionPreset === 'AUTRE' ? raw.fonction.trim() : raw.fonctionPreset;

    const payload: CreateMembreDto = {
      nom: raw.nom.trim(),
      prenoms: raw.prenoms.trim(),
      sexe: raw.sexe,
      date_naissance: raw.date_naissance || null,
      fonction: finalFonction || null,
      mandat: raw.mandat.trim() || null,
      statut: raw.statut,
      date_entree: raw.date_entree || null,
      telephone: raw.telephone.trim() || null,
      email: raw.email.trim() || null,
      quartier: raw.quartier.trim() || null,
      adresse: raw.adresse.trim() || null,
      observation: raw.observation.trim() || null,
    };

    const currentMembre = this.membre();

    if (currentMembre) {
      // Édition
      this.membreService.updateMembre(currentMembre.id, payload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.toast.success('Membre mis à jour', `${updated.nom_complet} a été mis à jour avec succès.`);
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      // Création
      this.membreService.createMembre(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('Membre ajouté', `${created.nom_complet} a été enregistré avec succès.`);
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
}
