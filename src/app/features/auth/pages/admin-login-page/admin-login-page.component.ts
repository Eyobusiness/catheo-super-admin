import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, BadgeComponent],
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
              <app-badge [variant]="'danger'" [size]="'sm'">Portail Super Admin</app-badge>
            </div>
            <h1 class="form-title">Connexion Administration</h1>
            <p class="form-subtitle">
              Accès strictement réservé aux Super Administrateurs de la plateforme Cathéo.
            </p>
          </div>

          <!-- Alert error -->
          @if (generalErrorMessage()) {
            <div class="auth-alert-box" role="alert">
              <i class="bi bi-shield-slash-fill"></i>
              <span>{{ generalErrorMessage() }}</span>
            </div>
          }

          <!-- Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Identifiant -->
            <div class="form-field-group">
              <label class="form-label" for="adminLogin">
                Identifiant Administrateur <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <span class="field-icon"><i class="bi bi-person-badge"></i></span>
                <input
                  id="adminLogin"
                  type="text"
                  formControlName="login"
                  class="field-input"
                  placeholder="Email, téléphone ou nom d'utilisateur"
                  autocomplete="username"
                />
              </div>
              @if (loginForm.controls.login.touched && loginForm.controls.login.invalid) {
                <span class="error-msg">Veuillez saisir votre identifiant.</span>
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
                <label class="form-label" for="adminPassword">
                  Mot de passe <span class="required">*</span>
                </label>
                <a routerLink="/auth/forgot-password" class="forgot-link">
                  Oublié ?
                </a>
              </div>
              <div class="input-wrapper">
                <span class="field-icon"><i class="bi bi-lock"></i></span>
                <input
                  id="adminPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="field-input password-input"
                  placeholder="Mot de passe sécurisé"
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
              <label class="remember-label" for="adminRemember">
                <input
                  id="adminRemember"
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
                [variant]="'danger'"
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

          <!-- Footer switch -->
          <div class="form-card-footer">
            <span class="footer-hint">Vous appartenez à une équipe paroissiale ?</span>
            <a routerLink="/auth/organisation" class="switch-link">
              Accéder à la Connexion Organisation
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {
  private readonly authService = inject(AuthService);

  public readonly isLoading = this.authService.isLoading;
  public readonly showPassword = signal<boolean>(false);
  public readonly serverErrors = signal<Record<string, string[]> | null>(null);
  public readonly generalErrorMessage = signal<string | null>(null);

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

    this.authService.loginAdmin({ login, password }).subscribe({
      next: () => {
        // Redirection assurée par AuthService vers /super-admin/dashboard
      },
      error: (err) => {
        if (err.status === 403 || err.message?.includes('Super Administrateur')) {
          this.generalErrorMessage.set(
            'Accès refusé : Ce compte ne dispose pas des privilèges Super Administrateur. Veuillez utiliser la Connexion Organisation.'
          );
        } else if (err.status === 422) {
          if (err.error?.errors) {
            this.serverErrors.set(err.error.errors);
          }
          this.generalErrorMessage.set(err.error?.message || 'Identifiants incorrects. Veuillez vérifier vos accès.');
        } else if (err.error?.message) {
          this.generalErrorMessage.set(err.error.message);
        } else {
          this.generalErrorMessage.set('Identifiants incorrects ou compte suspendu.');
        }
      },
    });
  }
}
