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
import {
  OrganisationAdminService,
  OrgProfilOption,
  OrgUserItem,
} from '../../services/organisation-admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-organisation-user-modal',
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
        <div class="form-group">
          <app-input
            label="Nom complet de l'utilisateur"
            placeholder="Ex: Jean-Marc KOUADIO"
            [required]="true"
            formControlName="name"
            [error]="getFieldError('name')"
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-input
              type="email"
              label="Adresse Email"
              placeholder="Ex: user@catheo.ci"
              [required]="true"
              formControlName="email"
              [error]="getFieldError('email')"
            />
          </div>

          <div class="form-group">
            <app-input
              type="tel"
              label="Numéro de Téléphone"
              placeholder="Ex: 0701020304"
              formControlName="telephone"
              [error]="getFieldError('telephone')"
            />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <app-select
              label="Profil & Droits d'accès (RBAC)"
              [required]="true"
              [options]="profilOptions()"
              formControlName="profil_id"
              [error]="getFieldError('profil_id')"
            />
          </div>

          <div class="form-group">
            <app-select
              label="Statut du compte"
              [required]="true"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>
        </div>

        @if (!isEditMode()) {
          <div class="form-group">
            <app-input
              type="password"
              label="Mot de passe temporaire"
              placeholder="Minimum 8 caractères"
              [required]="true"
              formControlName="password"
              [error]="getFieldError('password')"
            />
          </div>
        }

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
            [icon]="isEditMode() ? 'check-lg' : 'send'"
          >
            {{ isEditMode() ? 'Enregistrer' : 'Inviter l’utilisateur' }}
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
export class OrganisationUserModalComponent {
  private readonly adminService = inject(OrganisationAdminService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly user = input<OrgUserItem | null>(null);
  public readonly profils = input<OrgProfilOption[]>([]);

  public readonly close = output<void>();
  public readonly saved = output<OrgUserItem>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly generalError = signal<string | null>(null);
  public readonly validationErrors = signal<Record<string, string[]>>({});

  public readonly isEditMode = computed(() => !!this.user());
  public readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Modifier l’utilisateur' : 'Inviter un nouvel utilisateur'
  );

  public readonly profilOptions = computed<SelectOption[]>(() => {
    return this.profils().map((p) => ({
      label: `${p.name} (${p.code})`,
      value: String(p.id),
    }));
  });

  public readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
    { label: 'Suspendu', value: 'suspendu' },
  ];

  public readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telephone: new FormControl<string>('', {
      nonNullable: true,
    }),
    profil_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    statut: new FormControl<'actif' | 'inactif' | 'suspendu'>('actif', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.form.reset({
          name: u.name,
          email: u.email,
          telephone: u.telephone || '',
          profil_id: u.profil?.id ? String(u.profil.id) : '',
          statut: u.statut || 'actif',
          password: '',
        });
        this.form.get('password')?.clearValidators();
      } else {
        this.form.reset({
          name: '',
          email: '',
          telephone: '',
          profil_id: this.profils().length > 0 ? String(this.profils()[0].id) : '',
          statut: 'actif',
          password: '',
        });
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      }
      this.form.get('password')?.updateValueAndValidity();
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
    if (control.errors['email']) return 'Email invalide.';
    if (control.errors['minlength']) return 'Minimum 8 caractères.';
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
    const payload: Record<string, any> = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      telephone: raw.telephone.trim() || null,
      profil_id: Number(raw.profil_id),
      statut: raw.statut,
    };

    if (!this.isEditMode()) {
      payload['password'] = raw.password;
    }

    const currentUser = this.user();

    if (currentUser) {
      this.adminService.updateUser(currentUser.id, payload).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.toast.success('Utilisateur mis à jour', `Le compte de ${updated.name} a été modifié.`);
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleApiError(err);
        },
      });
    } else {
      this.adminService.createUser(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.toast.success('Invitation envoyée', `L’utilisateur ${created.name} a été créé avec succès.`);
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
      const msg = err.error?.message || err.message || 'Erreur lors de l’opération.';
      this.generalError.set(msg);
      this.toast.error('Erreur', msg);
    }
  }
}
