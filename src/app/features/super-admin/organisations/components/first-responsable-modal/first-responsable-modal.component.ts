import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SuperAdminOrganisationService } from '../../services/super-admin-organisation.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { SuperAdminOrganisation } from '../../models/super-admin-organisation.model';

@Component({
  selector: 'app-first-responsable-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, InputComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="md"
      (close)="onCancel()"
    >
      <div class="modal-intro">
        <p class="text-muted">
          Ce compte administrateur sera créé avec le profil
          <strong class="text-primary">{{ defaultProfilLabel() }}</strong>
          pour piloter l'espace <strong>{{ organisation().nom }}</strong>.
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
            id="responsable-name"
            label="Nom complet ou Titre"
            placeholder="Ex : Abbé Jean Dupont ou Marie Traoré"
            [required]="true"
            formControlName="name"
            [error]="getFieldError('name')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="responsable-email"
            type="email"
            label="Adresse Email"
            placeholder="responsable@paroisse.org"
            [required]="true"
            formControlName="email"
            [error]="getFieldError('email')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="responsable-telephone"
            type="tel"
            label="Numéro de téléphone"
            placeholder="+225 07 00 00 00 00"
            formControlName="telephone"
            [error]="getFieldError('telephone')"
          />
        </div>

        <div class="form-group">
          <app-input
            id="responsable-password"
            type="password"
            label="Mot de passe temporaire"
            placeholder="Min. 8 caractères (optionnel, généré si vide)"
            formControlName="password"
            [error]="getFieldError('password')"
          />
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
          [disabled]="loading()"
          (btnClick)="onSubmit()"
        >
          Créer le premier responsable
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
    .text-primary {
      color: var(--color-primary-600, #3b82f6);
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
export class FirstResponsableModalComponent {
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly organisation = input.required<SuperAdminOrganisation>();

  public readonly close = output<void>();
  public readonly responsableCreated = output<any>();

  protected readonly loading = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly validationErrors = signal<Record<string, string[]>>({});

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
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.minLength(8)],
    }),
  });

  protected modalTitle(): string {
    return `Premier Responsable · ${this.organisation().nom}`;
  }

  protected defaultProfilLabel(): string {
    const type = this.organisation().type_organisation;
    return `RESPONSABLE_${type}`;
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
    const payload: any = {
      name: raw.name.trim(),
      email: raw.email.trim().toLowerCase(),
    };

    if (raw.telephone.trim()) {
      payload.telephone = raw.telephone.trim();
    }
    if (raw.password && raw.password.trim()) {
      payload.password = raw.password.trim();
      payload.password_confirmation = raw.password.trim();
    }

    const orgId = this.organisation().uuid || this.organisation().id;
    this.orgService.provisionResponsable(orgId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.show(
          'success',
          'Premier responsable provisionné',
          `Le compte pour ${payload.name} a été créé avec succès.`
        );
        this.resetForm();
        this.responsableCreated.emit(res);
        this.close.emit();
      },

      error: (err) => {
        this.loading.set(false);
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors.set(err.error.errors);
          this.generalError.set(err.error.message || 'Vérifiez les données saisies.');
        } else if (err.status === 409) {
          this.generalError.set('Un conflit existe déjà pour cette organisation ou cet email.');
        } else if (err.status === 403) {
          this.generalError.set('Action non autorisée. Permissions insuffisantes.');
        } else {
          this.generalError.set(err.error?.message || 'Une erreur est survenue lors de la création.');
        }
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      email: '',
      telephone: '',
      password: '',
    });
    this.generalError.set(null);
    this.validationErrors.set({});
  }
}
