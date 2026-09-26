import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { SessionService } from './session.service';
import { ApiError } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  private readonly toastService = inject(ToastService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  /**
   * Translates an HttpErrorResponse into a standardized ApiError and emits feedback.
   */
  public handleError(error: HttpErrorResponse, notify: boolean = true): ApiError {
    const status = error.status || 0;
    const apiError: ApiError = {
      status,
      message: this.sanitizeErrorMessage(error),
      errors: this.extractValidationErrors(error),
      code: error.error?.code,
    };

    if (notify) {
      this.dispatchNotification(apiError);
    }

    if (status === 401) {
      this.handleUnauthorized();
    }

    return apiError;
  }

  /**
   * Sanitizes the error message to prevent leaking SQL, paths, or stack traces.
   */
  public sanitizeErrorMessage(error: HttpErrorResponse): string {
    const rawMsg: string = error.error?.message || error.message || '';

    // Detect and redact dangerous/internal server leaks
    if (
      rawMsg.includes('SQLSTATE') ||
      rawMsg.includes('QueryException') ||
      rawMsg.includes('Stack trace') ||
      rawMsg.includes('vendor/laravel') ||
      rawMsg.includes('.php')
    ) {
      return 'Une erreur interne du serveur est survenue. Veuillez réessayer plus tard.';
    }

    switch (error.status) {
      case 400:
        return rawMsg || 'Requête invalide.';
      case 401:
        return 'Session expirée ou non authentifiée. Veuillez vous reconnecter.';
      case 403:
        return rawMsg || 'Accès refusé. Vous ne possédez pas les autorisations nécessaires.';
      case 404:
        return rawMsg || 'Ressource demandée introuvable.';
      case 409:
        return rawMsg || 'Conflit de données : cette ressource existe déjà ou est verrouillée.';
      case 422:
        return rawMsg || 'Certaines données du formulaire sont invalides.';
      case 429:
        return 'Trop de requêtes envoyées. Veuillez patienter un instant avant de réessayer.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Le serveur Cathéo rencontre une indisponibilité momentanée. Veuillez réessayer.';
      default:
        if (error.status === 0) {
          return 'Impossible de joindre le serveur. Veuillez vérifier votre connexion internet.';
        }
        return rawMsg || 'Une erreur inattendue est survenue.';
    }
  }

  private extractValidationErrors(error: HttpErrorResponse): Record<string, string[]> | undefined {
    if (error.status === 422 && error.error?.errors) {
      return error.error.errors as Record<string, string[]>;
    }
    return undefined;
  }

  private dispatchNotification(error: ApiError): void {
    if (error.status === 401) {
      // Handled specifically with session expiration toast
      return;
    }

    if (error.status === 422) {
      let detail = error.message;
      if (error.errors) {
        const firstField = Object.keys(error.errors)[0];
        if (firstField && error.errors[firstField]?.length) {
          detail = `${error.message} (${error.errors[firstField][0]})`;
        }
      }
      this.toastService.error('Erreur de validation', detail);
      return;
    }

    if (error.status === 403) {
      this.toastService.error('Accès refusé (403)', error.message);
      return;
    }

    if (error.status === 404) {
      this.toastService.warning('Introuvable (404)', error.message);
      return;
    }

    if (error.status === 429) {
      this.toastService.warning('Trop de requêtes', error.message);
      return;
    }

    this.toastService.error('Erreur serveur', error.message);
  }

  private handleUnauthorized(): void {
    const currentUrl = this.router.url || '';
    const isAuthRoute = currentUrl.startsWith('/auth') || currentUrl.startsWith('/login');

    if (!isAuthRoute) {
      this.sessionService.clearSession();
      this.toastService.warning(
        'Session expirée',
        'Votre session a expiré après inactivité. Veuillez vous reconnecter.'
      );
      this.router.navigate(['/auth/organisation'], { queryParams: { reason: 'session_expired' } });
    }
  }
}
