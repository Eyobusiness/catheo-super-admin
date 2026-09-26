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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { OrganisationUserService } from '../../services/organisation-user.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';
import {
  OrganisationProfil,
  OrganisationUser,
  CreateOrganisationUserDto,
  UpdateOrganisationUserDto,
} from '../../models/organisation-user.model';

@Component({
  selector: 'app-organisation-user-modal',
  standalone: true,
  imports: [
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
      <div class="modal-intro">
        <p class="text-muted">
          Espace : <strong>{{ organisation().nom }}</strong>
          ({{ organisation().type_organisation }}).
          Les profils sont strictement restreints aux rôles autorisés pour cet espace.
        </p>
      </div>

      @if (generalError()) {
        <div class="alert-error" role="alert">
          <i class="bi bi-exclamation-triangle-fill mr-2" aria-hidden="true"></i>
          <span>{{ generalError() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <div class="form-group">
          <app-input
            id="user-name"
            label="Nom & Prénoms"
            placeholder="Ex : Paul Koffi"
            [required]="true"
            formControlName="name"
            [error]="getFieldError('name')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="user-email"
            type="email"
            label="Adresse Email"
            placeholder="utilisateur@domaine.org"
            [required]="true"
            formControlName="email"
            [error]="getFieldError('email')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="user-telephone"
            type="tel"
            label="Téléphone"
            placeholder="+225 05 00 00 00 00"
            formControlName="telephone"
            [error]="getFieldError('telephone')"
          />
        </div>

        <div class="form-group">
          <app-select
            id="user-profil"
            label="Profil organisationnel"
            placeholder="Sélectionner un profil compatible"
            [required]="true"
            [options]="profilOptions()"
            formControlName="profil_id"
            [error]="getFieldError('profil_id')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="user-password"
            type="password"
            [label]="isEditing() ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe initial'"
            [placeholder]="isEditing() ? 'Laisser vide pour ne pas modifier' : 'Minimum 8 caractères'"
            [required]="!isEditing()"
            formControlName="password"
            [error]="getFieldError('password')"
          />
        </div>

        @if (isEditing()) {
          <div class="form-group">
            <app-select
              id="user-statut"
              label="Statut du compte"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>
        }
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
          [disabled]="loading()"
          (btnClick)="onSubmit()"
        >
          {{ isEditing() ? 'Enregistrer les modifications' : 'Créer l’utilisateur' }}
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .modal-intro {
      margin-bottom: 1.25rem;
      padding: 0.75rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .text-muted {
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
      line-height: 1.4;
      margin: 0;
    }
    .alert-error {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md, 8px);
      color: #b91c1c;
      font-size: 0.875rem;
    }
    .mr-2 {
      margin-right: 0.5rem;
    }
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationUserModalComponent {
  private readonly userService = inject(OrganisationUserService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly organisation = input.required<SuperAdminOrganisation>();
  public readonly userToEdit = input<OrganisationUser | null>(null);
  public readonly availableProfils = input<OrganisationProfil[]>([]);

  public readonly close = output<void>();
  public readonly userSaved = output<OrganisationUser>();

  protected readonly loading = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly validationErrors = signal<Record<string, string[]>>({});

  protected readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
  ];

  protected readonly isEditing = computed(() => !!this.userToEdit());

  /**
   * Filtrage strict des profils autorisés selon le type d'organisation (OPPE / OPPJ / OPPA)
   */
  protected readonly profilOptions = computed<SelectOption[]>(() => {
    const orgType = this.organisation().type_organisation;
    const profils = this.availableProfils();

    // Règle absolue : uniquement les profils dont le code correspond à orgType
    const matchingProfils = profils.filter((p) => {
      const code = (p.code || '').toUpperCase();
      return code.includes(orgType);
    });

    // S'il n'y a pas encore de profils distants chargés, fournir les options standards du backend
    if (matchingProfils.length === 0) {
      return [
        { label: `Responsable ${orgType}`, value: `RESPONSABLE_${orgType}` },
        { label: `Utilisateur ${orgType}`, value: `UTILISATEUR_${orgType}` },
      ];
    }

    return matchingProfils.map((p) => ({
      label: p.libelle || p.code,
      value: p.id || p.code,
    }));
  });

  protected readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    telephone: new FormControl<string>('', { nonNullable: true }),
    profil_id: new FormControl<string | number>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
    }),
    statut: new FormControl<'actif' | 'inactif'>('actif', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const targetUser = this.userToEdit();
      if (targetUser) {
        this.form.patchValue({
          name: targetUser.name,
          email: targetUser.email,
          telephone: targetUser.telephone || '',
          profil_id: targetUser.profil_id || targetUser.profil?.id || targetUser.profil?.code || '',
          password: '',
          statut: targetUser.statut || 'actif',
        });
        this.form.get('password')?.clearValidators();
      } else {
        this.resetForm();
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      }
      this.form.get('password')?.updateValueAndValidity();
    });
  }

  protected modalTitle(): string {
    return this.isEditing()
      ? `Modifier l'utilisateur · ${this.userToEdit()?.name}`
      : `Nouvel utilisateur · ${this.organisation().nom}`;
  }

  protected getFieldError(fieldName: string): string {
    const serverErrors = this.validationErrors()[fieldName];
    if (serverErrors && serverErrors.length > 0) {
      return serverErrors[0];
    }
    const ctrl = this.form.get(fieldName);
    if (ctrl && ctrl.touched && ctrl.invalid) {
      if (ctrl.errors?.['required']) return 'Ce champ est obligatoire.';
      if (ctrl.errors?.['email']) return 'Format d’email invalide.';
      if (ctrl.errors?.['minlength']) {
        return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
      }
    }
    return '';
  }

  protected onCancel(): void {
    if (!this.loading()) {
      this.resetForm();
      this.close.emit();
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const orgId = this.organisation().id;

    if (this.isEditing() && this.userToEdit()) {
      const updatePayload: UpdateOrganisationUserDto = {
        name: raw.name.trim(),
        email: raw.email.trim().toLowerCase(),
        telephone: raw.telephone.trim() || undefined,
        profil_id: raw.profil_id,
        statut: raw.statut,
      };
      if (raw.password.trim()) {
        updatePayload.password = raw.password.trim();
      }

      this.userService.updateUser(orgId, this.userToEdit()!.id, updatePayload).subscribe({
        next: (savedUser) => {
          this.loading.set(false);
          this.toast.show('success', 'Utilisateur modifié', 'Les données ont été mises à jour.');
          this.userSaved.emit(savedUser);
          this.close.emit();
        },
        error: (err) => this.handleError(err),
      });
    } else {
      const createPayload: CreateOrganisationUserDto = {
        name: raw.name.trim(),
        email: raw.email.trim().toLowerCase(),
        telephone: raw.telephone.trim() || undefined,
        password: raw.password.trim(),
        profil_id: raw.profil_id,
        statut: 'actif',
      };

      this.userService.createUser(orgId, createPayload).subscribe({
        next: (createdUser) => {
          this.loading.set(false);
          this.toast.show(
            'success',
            'Utilisateur créé',
            `Le compte pour ${createdUser?.name || createPayload.name} a été créé.`
          );
          this.userSaved.emit(createdUser);
          this.close.emit();
        },
        error: (err) => this.handleError(err),
      });
    }
  }

  private handleError(err: any): void {
    this.loading.set(false);
    if (err.status === 422 && err.error?.errors) {
      this.validationErrors.set(err.error.errors);
      this.generalError.set(err.error.message || 'Vérifiez les données saisies.');
    } else if (err.status === 409) {
      this.generalError.set('Un utilisateur avec cet email existe déjà.');
    } else if (err.status === 403) {
      this.generalError.set('Action non autorisée sur cette organisation.');
    } else {
      this.generalError.set(err.error?.message || 'Une erreur est survenue.');
    }
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      email: '',
      telephone: '',
      profil_id: '',
      password: '',
      statut: 'actif',
    });
    this.generalError.set(null);
    this.validationErrors.set({});
  }
}
