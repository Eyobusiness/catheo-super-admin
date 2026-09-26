import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly brandLogoUrl = 'image/logo/catheo.png';
  protected readonly showPassword = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]> | null>(null);
  protected readonly generalErrorMessage = signal<string | null>(null);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)]
    }),
    rememberMe: new FormControl<boolean>(true, { nonNullable: true })
  });

  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  protected onSubmit(): void {
    this.serverErrors.set(null);
    this.generalErrorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ login: email, password }).subscribe({
      next: () => {
        // La redirection est assurée par le service d'authentification selon le rôle
      },
      error: (err) => {
        if (err.error?.errors) {
          this.serverErrors.set(err.error.errors);
        }
        if (err.error?.message) {
          this.generalErrorMessage.set(err.error.message);
        }
      }
    });
  }
}