import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { OrganisationSpaceSelectorComponent } from '../../components/organisation-space-selector/organisation-space-selector.component';
import { OrganisationSpacePreferenceService } from '../../services/organisation-space-preference.service';
import { OrganisationSpace } from '../../models/organisation-space.model';

@Component({
  selector: 'app-organisation-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    BadgeComponent,
    OrganisationSpaceSelectorComponent,
  ],
  template: `
    <div class="auth-viewport">
      <div class="auth-background-media" aria-hidden="true">
        <img src="images/video.png" alt="" class="auth-background-image" />
        <div class="auth-background-overlay"></div>
        <div class="auth-background-rays"></div>
      </div>

      <div class="auth-container">
        <div class="auth-form-card">
          <!-- Header -->
          <div class="form-header text-center">
            <div class="brand-badge-icon">
              <img src="image/logo/catheo.png" alt="Logo Cathéo" class="brand-logo-image" />
            </div>
            <div class="badge-wrapper">
              <app-badge [variant]="'primary'" [size]="'sm'">Portail Organisation</app-badge>
            </div>
            <h1 class="form-title">Connexion Organisation</h1>
            <p class="form-subtitle">
              Gestion pastorale et catéchétique paroissiale
            </p>
          </div>

          <!-- Space Selector Component (Petit boutons compacts sans description) -->
          <div class="space-selector-block">
            <app-organisation-space-selector
              [selectedSpace]="selectedSpace()"
              (spaceChange)="onSpaceChange($event)"
            />
          </div>

          <!-- Alert error -->
          @if (generalErrorMessage()) {
            <div class="auth-alert-box" role="alert">
              <i class="bi bi-exclamation-octagon-fill"></i>
              <span>{{ generalErrorMessage() }}</span>
            </div>
          }

          <!-- Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Identifiant -->
            <div class="form-field-group">
              <label class="form-label" for="orgLogin">
                Identifiant Utilisateur <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <span class="field-icon"><i class="bi bi-person"></i></span>
                <input
                  id="orgLogin"
                  type="text"
                  formControlName="login"
                  class="field-input"
                  placeholder="Email, téléphone ou identifiant"
                  autocomplete="username"
                />
              </div>
              @if (loginForm.controls.login.touched && loginForm.controls.login.invalid) {
                <span class="error-msg">Veuillez saisir votre identifiant de connexion.</span>
              }
              @if (serverErrors()?.['login']) {
                @for (err of serverErrors()!['login']; track err) {
                  <span class="error-msg">{{ err }}</span>
                }
              }
            </div>

            <!-- Mot de passe -->
            <div class="form-field-group">
              <div class="field-label-row">
                <label class="form-label" for="orgPassword">
                  Mot de passe <span class="required">*</span>
                </label>
                <a routerLink="/auth/forgot-password" class="forgot-link">
                  Oublié ?
                </a>
              </div>
              <div class="input-wrapper">
                <span class="field-icon"><i class="bi bi-lock"></i></span>
                <input
                  id="orgPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="field-input password-input"
                  placeholder="Mot de passe"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="btn-toggle-pw"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="showPassword() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <i class="bi" [class]="showPassword() ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              @if (loginForm.controls.password.touched && loginForm.controls.password.invalid) {
                <span class="error-msg">Le mot de passe doit comporter au moins 4 caractères.</span>
              }
              @if (serverErrors()?.['password']) {
                @for (err of serverErrors()!['password']; track err) {
                  <span class="error-msg">{{ err }}</span>
                }
              }
            </div>

            <!-- Remember me -->
            <div class="form-options-row">
              <label class="remember-label" for="orgRemember">
                <input
                  id="orgRemember"
                  type="checkbox"
                  formControlName="rememberMe"
                  class="checkbox-input"
                />
                <span>Mémoriser cette session</span>
              </label>
            </div>

            <!-- Submit -->
            <div class="form-submit-group">
              <app-btn
                [type]="'submit'"
                [variant]="'success'"
                [size]="'lg'"
                [loading]="isLoading()"
                [disabled]="isLoading() || loginForm.invalid"
                (btnClick)="onSubmit()"
                class="login-submit-btn"
              >
                <i class="bi bi-box-arrow-in-right"></i>
                <span>Se connecter</span>
              </app-btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrl: './organisation-login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationLoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly preferenceService = inject(OrganisationSpacePreferenceService);

  public readonly isLoading = this.authService.isLoading;
  public readonly showPassword = signal<boolean>(false);
  public readonly serverErrors = signal<Record<string, string[]> | null>(null);
  public readonly generalErrorMessage = signal<string | null>(null);

  public readonly selectedSpace = signal<OrganisationSpace>(this.preferenceService.getPreference());

  public readonly loginForm = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
    rememberMe: new FormControl<boolean>(true, { nonNullable: true }),
  });

  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  public onSpaceChange(space: OrganisationSpace): void {
    this.selectedSpace.set(space);
    this.preferenceService.setPreference(space);
  }

  public onSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    this.serverErrors.set(null);
    this.generalErrorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { login, password } = this.loginForm.getRawValue();
    const space = this.selectedSpace();

    this.authService
      .loginOrganisation({ login, password, organisation_type: space })
      .subscribe({
        next: () => {
          // Redirection assurée par AuthService vers le type d'organisation certifié
        },
        error: (err) => {
          if (err.code === 'SPACE_MISMATCH') {
            this.generalErrorMessage.set(err.message);
          } else if (err.status === 403 || err.message?.includes('organisation')) {
            this.generalErrorMessage.set(
              err.message || "Accès refusé : Votre compte n'est rattaché à aucune organisation paroissiale active."
            );
          } else if (err.error?.errors) {
            this.serverErrors.set(err.error.errors);
          } else if (err.error?.message) {
            this.generalErrorMessage.set(err.error.message);
          } else {
            this.generalErrorMessage.set('Identifiants incorrects ou compte suspendu.');
          }
        },
      });
  }
}
