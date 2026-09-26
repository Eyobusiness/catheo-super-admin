import {
  ChangeDetectionStrategy,
  Component,
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
import {
  SelectComponent,
  SelectOption,
} from '../../../../../shared/components/select/select.component';
import { ParoisseService } from '../../services/paroisse.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  ParoisseUser,
  SystemProfil,
  CreateParoisseUserDto,
  UpdateParoisseUserDto,
} from '../../models/paroisse-user.model';

@Component({
  selector: 'app-paroisse-user-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="isEditMode() ? 'Modifier l’utilisateur' : 'Créer un administrateur / utilisateur'"
      size="lg"
      (close)="onCancel()"
    >
      @if (generalError()) {
        <div class="alert-error" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <span>{{ generalError() }}</span>
        </div>
      }

      <div class="modal-notice">
        <i class="bi bi-info-circle-fill text-primary me-2"></i>
        <span>
          Paroisse : <strong>{{ paroisseNom() }}</strong>.
          L'utilisateur sera automatiquement rattaché à cette paroisse (<code>paroisse_configuration_id</code>)
          sans affiliation à une organisation spécifique (<code>organisation_id = null</code>).
        </span>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <div class="form-grid">
          <!-- Nom complet -->
          <div class="form-group col-span-2">
            <app-input
              id="user-name"
              label="Nom & Prénoms"
              placeholder="Ex : Abbé Jean-Baptiste Koffi ou Administrateur Paroissial"
              [required]="true"
              formControlName="name"
              [error]="getFieldError('name')"
            />
          </div>

          <!-- Nom d'utilisateur (username) -->
          <div class="form-group">
            <app-input
              id="user-username"
              label="Identifiant / Nom d'utilisateur (Username)"
              placeholder="Ex : admin.stemonique"
              [required]="true"
              formControlName="username"
              [error]="getFieldError('username')"
            />
          </div>

          <!-- Email -->
          <div class="form-group">
            <app-input
              id="user-email"
              type="email"
              label="Adresse Email"
              placeholder="admin@paroisse.ci"
              [required]="true"
              formControlName="email"
              [error]="getFieldError('email')"
            />
          </div>

          <!-- Téléphone -->
          <div class="form-group">
            <app-input
              id="user-telephone"
              type="tel"
              label="Numéro de Téléphone"
              placeholder="+225 07 00 00 00 00"
              formControlName="telephone"
              [error]="getFieldError('telephone')"
            />
          </div>

          <!-- Profil Système (is_system = 1) -->
          <div class="form-group">
            <app-select
              id="user-profil-id"
              label="Profil / Rôle Système"
              hint="Sélectionnez un rôle système autorisé (is_system=1)"
              [required]="true"
              [options]="profilOptions()"
              formControlName="profil_id"
              [error]="getFieldError('profil_id')"
            />
          </div>

          <!-- Type d'utilisateur -->
          <div class="form-group">
            <app-select
              id="user-type"
              label="Type de compte"
              [options]="userTypeOptions"
              formControlName="user_type"
              [error]="getFieldError('user_type')"
            />
          </div>

          <!-- Statut -->
          <div class="form-group">
            <app-select
              id="user-statut"
              label="Statut du compte"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>

          <!-- Mot de passe -->
          <div class="form-group col-span-2">
            <app-input
              id="user-password"
              type="password"
              [label]="isEditMode() ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe initial'"
              placeholder="Min. 6 caractères"
              [required]="!isEditMode()"
              formControlName="password"
              [error]="getFieldError('password')"
            />
          </div>

          @if (isEditMode() && user()) {
            <!-- Bloc Informations Système & Métadonnées -->
            <div class="section-divider col-span-2">
              <h4 class="section-title">Informations Système & Traçabilité</h4>
            </div>

            <div class="meta-card col-span-2">
              <div class="meta-row">
                <span class="meta-label">ID Interne :</span>
                <span class="meta-val mono">{{ user()?.id_interne || '-' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">UUID :</span>
                <span class="meta-val mono">{{ user()?.uuid || user()?.id }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Paroisse Config ID :</span>
                <span class="meta-val mono">{{ user()?.paroisse_configuration_id }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Organisation ID :</span>
                <span class="meta-val mono">null (Paroisse directe)</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Dernier Login :</span>
                <span class="meta-val">{{ (user()?.dernier_login_at | date: 'dd/MM/yyyy HH:mm') || 'Jamais connecté' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Date Création :</span>
                <span class="meta-val">{{ (user()?.created_at | date: 'dd/MM/yyyy HH:mm') || '-' }}</span>
              </div>
            </div>
          }
        </div>
      </form>

      <div modal-footer class="modal-actions">
        <app-btn
          variant="secondary"
          [disabled]="loading()"
          (btnClick)="onCancel()"
        >
          Annuler
        </app-btn>

        <app-btn
          variant="primary"
          [loading]="loading()"
          [disabled]="loading() || form.invalid"
          (btnClick)="onSubmit()"
        >
          <i class="bi bi-check-lg me-1"></i>
          <span>{{ isEditMode() ? 'Mettre à jour' : 'Enregistrer l’utilisateur' }}</span>
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .alert-error {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: #fee2e2;
      border: 1px solid #f87171;
      border-radius: 0.5rem;
      color: #991b1b;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .modal-notice {
      display: flex;
      align-items: flex-start;
      padding: 0.75rem 1rem;
      background-color: var(--primary-50, #eff6ff);
      border: 1px solid var(--primary-200, #bfdbfe);
      border-radius: 0.5rem;
      color: var(--primary-800, #1e40af);
      font-size: 0.8125rem;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
    .modal-notice code {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 0.1rem 0.3rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
    }
    .section-divider {
      border-top: 1px solid var(--border-color, #e2e8f0);
      padding-top: 0.75rem;
      margin-top: 0.25rem;
    }
    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      margin: 0;
    }
    .meta-card {
      background-color: var(--bg-muted, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem 1.5rem;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }
    .meta-label {
      color: var(--text-muted, #64748b);
    }
    .meta-val {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
    }
    .meta-val.mono {
      font-family: monospace;
      font-size: 0.75rem;
    }
    .modal-actions {
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
      .meta-card {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoisseUserModalComponent {
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly paroisseId = input.required<string | number>();
  public readonly paroisseNom = input<string>('');
  public readonly user = input<ParoisseUser | null>(null);
  public readonly systemProfils = input<SystemProfil[]>([]);

  public readonly close = output<void>();
  public readonly userSaved = output<ParoisseUser>();

  protected readonly loading = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);

  protected readonly isEditMode = signal<boolean>(false);

  protected readonly userTypeOptions: SelectOption[] = [
    { label: 'Administrateur (admin)', value: 'admin' },
    { label: 'Super Administrateur (super_admin)', value: 'super_admin' },
    { label: 'Gestionnaire (gestionnaire)', value: 'gestionnaire' },
    { label: 'Utilisateur standard (utilisateur)', value: 'utilisateur' },
  ];

  protected readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
    { label: 'Suspendu', value: 'suspendu' },
  ];

  protected readonly profilOptions = signal<SelectOption[]>([]);

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        Validators.maxLength(100),
      ],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)],
    }),
    telephone: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(30)],
    }),
    profil_id: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    user_type: new FormControl<string>('admin', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    statut: new FormControl<string>('actif', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [],
    }),
  });

  constructor() {
    // React to systemProfils input (strictly show profiles whose code contains 'ADMIN')
    effect(
      () => {
        const profils = (this.systemProfils() || []).filter((p) =>
          p.code ? p.code.toUpperCase().includes('ADMIN') : true
        );
        const options: SelectOption[] = profils.map((p) => ({
          label: `${p.nom} (${p.code})`,
          value: p.id,
        }));
        this.profilOptions.set(options);

        // If no profil selected yet and list has items, default to first (e.g. ADMIN)
        if (!this.form.get('profil_id')?.value && options.length > 0) {
          const adminProfil = profils.find((p) => p.code.toUpperCase().includes('ADMIN')) || profils[0];
          this.form.patchValue({ profil_id: adminProfil.id });
        }
      },
      { allowSignalWrites: true }
    );

    // React to user edit mode
    effect(
      () => {
        const currentUser = this.user();
        this.generalError.set(null);

        if (currentUser) {
          this.isEditMode.set(true);
          this.form.patchValue({
            name: currentUser.name || '',
            username: currentUser.username || '',
            email: currentUser.email || '',
            telephone: currentUser.telephone || '',
            profil_id: currentUser.profil_id,
            user_type: currentUser.user_type || 'admin',
            statut: currentUser.statut || 'actif',
            password: '',
          });
          this.form.get('password')?.clearValidators();
          this.form.get('password')?.updateValueAndValidity();
        } else {
          this.isEditMode.set(false);
          this.form.reset({
            name: '',
            username: '',
            email: '',
            telephone: '',
            profil_id: this.systemProfils()[0]?.id ?? null,
            user_type: 'admin',
            statut: 'actif',
            password: '',
          });
          this.form
            .get('password')
            ?.setValidators([Validators.required, Validators.minLength(6)]);
          this.form.get('password')?.updateValueAndValidity();
        }
      },
      { allowSignalWrites: true }
    );
  }

  public getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['email']) return 'Format d’email invalide.';
    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} caractères.`;
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} caractères.`;
    }
    if (control.errors['pattern']) {
      return 'Caractères autorisés : lettres, chiffres, tirets et points.';
    }
    return 'Valeur invalide.';
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const paroisseId = this.paroisseId();
    if (!paroisseId) {
      this.generalError.set('Identifiant de la paroisse introuvable.');
      return;
    }

    this.loading.set(true);
    this.generalError.set(null);

    const val = this.form.getRawValue();

    if (this.isEditMode() && this.user()) {
      const targetUserId = this.user()!.uuid || this.user()!.id;
      const updatePayload: UpdateParoisseUserDto = {
        name: val.name,
        username: val.username,
        email: val.email,
        telephone: val.telephone || null,
        profil_id: Number(val.profil_id),
        user_type: val.user_type,
        statut: val.statut,
      };

      if (val.password && val.password.trim().length > 0) {
        updatePayload.password = val.password;
      }

      this.paroisseService
        .updateParoisseUser(paroisseId, targetUserId, updatePayload)
        .subscribe({
          next: (res) => {
            this.loading.set(false);
            this.toast.show('success', 'Utilisateur modifié', 'Le compte utilisateur a été mis à jour.');
            this.userSaved.emit(res);
            this.close.emit();
          },
          error: (err) => {
            this.loading.set(false);
            const msg =
              err.error?.errors
                ? Object.values(err.error.errors).flat().join(' ')
                : err.error?.message || 'Erreur lors de la mise à jour de l’utilisateur.';
            this.generalError.set(msg);
          },
        });
    } else {
      const createPayload: CreateParoisseUserDto = {
        name: val.name,
        username: val.username,
        email: val.email,
        telephone: val.telephone || null,
        profil_id: Number(val.profil_id),
        user_type: val.user_type || 'admin',
        statut: val.statut || 'actif',
        password: val.password,
      };

      this.paroisseService.createParoisseUser(paroisseId, createPayload).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.show(
            'success',
            'Utilisateur créé',
            'L’administrateur paroissial a été créé avec succès.'
          );
          this.userSaved.emit(res);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err.error?.errors
              ? Object.values(err.error.errors).flat().join(' ')
              : err.error?.message || 'Erreur lors de la création de l’utilisateur.';
          this.generalError.set(msg);
        },
      });
    }
  }

  public onCancel(): void {
    this.close.emit();
  }
}
