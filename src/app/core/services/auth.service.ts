import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { SessionService } from './session.service';
import { OrganisationContextService } from './organisation-context.service';
import { ToastService } from './toast.service';
import { InactivityService } from './inactivity.service';
import { API_BASE_URL } from '../config/api.config';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponse,
  ResetPasswordDto,
  User,
  VerifyCodeDto,
} from '../models/auth.models';
import { OrganisationContext } from '../models/organisation.models';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly inactivityService = inject(InactivityService);
  private readonly sessionService = inject(SessionService);
  private readonly organisationContextService = inject(OrganisationContextService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly authUrl = `${this.apiBaseUrl}/auth`;

  public readonly isLoading = signal<boolean>(false);

  // Reactive state mirrored from SessionService for convenience
  public readonly token = this.sessionService.token;
  public readonly currentUser = this.sessionService.currentUser;
  public readonly currentOrganisation = this.sessionService.currentOrganisation;
  public readonly accessibleMenus = this.sessionService.accessibleMenus;

  // Computed state
  public readonly isAuthenticated = this.sessionService.isAuthenticated;
  public readonly isSuperAdmin = this.sessionService.isSuperAdmin;
  public readonly isOrganisationUser = this.sessionService.isOrganisationUser;
  public readonly organisationType = this.sessionService.organisationType;

  constructor() {
    if (this.token()) {
      if (this.inactivityService.isExpired()) {
        this.clearSession();
        this.inactivityService.handleTimeout();
      } else {
        this.inactivityService.startTracking();
        this.getMe().subscribe({ error: () => {} });
      }
    }
  }

  public isSuperAdminUser(user: User | null | undefined): boolean {
    if (!user) return false;
    return (
      user.user_type === 'super_admin' ||
      user.profil?.code === 'SUPER_ADMIN' ||
      ((user.profil?.permissions as string[])?.includes('*') && !user.paroisse_configuration_id)
    );
  }

  /**
   * Connexion dédiée Super Administrateur.
   * Vérifie formellement les privilèges Super Admin certifiés par le backend.
   */
  public loginAdmin(dto: LoginDto): Observable<LoginResponse> {
    this.isLoading.set(true);
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, dto).pipe(
      tap((res) => {
        this.isLoading.set(false);
        const token = res.data.token;
        const user = res.data.user;
        const menus = res.data.menus || [];

        const isSuper = this.isSuperAdminUser(user);

        if (!isSuper) {
          this.clearSession();
          this.toastService.error(
            'Accès Refusé (403)',
            'Ce compte ne dispose pas des privilèges Super Administrateur. Veuillez utiliser la Connexion Organisation.'
          );
          throw new Error('UNAUTHORIZED_ADMIN_ACCESS');
        }

        this.setSession(token, user, menus);
        this.inactivityService.startTracking();
        this.toastService.success(
          'Connexion Administration réussie',
          `Bienvenue Super Admin ${user.prenoms || user.nom || user.name || ''}`
        );
        this.router.navigate(['/super-admin/dashboard']);
      }),
      catchError((error: any) => {
        this.isLoading.set(false);
        if (error?.message === 'UNAUTHORIZED_ADMIN_ACCESS') {
          return throwError(() => ({
            status: 403,
            message: 'Ce compte ne dispose pas des privilèges Super Administrateur.',
          }));
        }
        const msg = error.error?.message || 'Identifiants incorrects ou compte inactif.';
        this.toastService.error('Erreur de connexion', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Connexion dédiée Organisation (OPPE / OPPJ / OPPA).
   * Charge le contexte certifié et oriente vers l'espace réellement autorisé par le backend.
   */
  public loginOrganisation(dto: LoginDto): Observable<LoginResponse> {
    this.isLoading.set(true);
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, dto).pipe(
      switchMap((res) => {
        const token = res.data.token;
        const user = res.data.user;
        const menus = res.data.menus || [];

        const isSuper = this.isSuperAdminUser(user);

        if (!user.organisation_id && !isSuper) {
          this.isLoading.set(false);
          this.clearSession();
          this.toastService.error(
            'Accès Refusé (403)',
            "Votre compte n'est rattaché à aucune organisation paroissiale active."
          );
          return throwError(() => ({
            status: 403,
            message: "Votre compte n'est rattaché à aucune organisation paroissiale active.",
          }));
        }

        // Établit la session temporaire pour permettre l'appel au contexte certifié
        this.setSession(token, user, menus);

        if (user.organisation_id) {
          return this.organisationContextService.loadContext().pipe(
            switchMap((context) => {
              this.isLoading.set(false);

              if (context && context.statut !== 'actif') {
                this.clearSession();
                const inactiveMsg = `L'organisation [${context.nom}] est actuellement ${context.statut}.`;
                this.toastService.error('Organisation inactive (403)', inactiveMsg);
                return throwError(() => ({
                  status: 403,
                  message: inactiveMsg,
                }));
              }

              // VÉRIFICATION STRICTE DE L'ESPACE SÉLECTIONNÉ VS CONTEXTE RÉEL CERTIFIÉ
              const realSpace = context?.type_organisation;
              const chosenSpace = dto.organisation_type;

              if (chosenSpace && realSpace && realSpace !== chosenSpace) {
                // Révocation immédiate et complète de la session
                this.clearSession();
                const mismatchMsg = `Votre compte est rattaché à l'espace ${realSpace}. Vous ne pouvez pas vous connecter à l'espace ${chosenSpace}.`;
                this.toastService.error('Espace non autorisé (403)', mismatchMsg);
                return throwError(() => ({
                  status: 403,
                  code: 'SPACE_MISMATCH',
                  realSpace,
                  chosenSpace,
                  message: mismatchMsg,
                }));
              }

              // Contexte certifié et conforme
              this.inactivityService.startTracking();
              this.toastService.success(
                'Connexion Organisation réussie',
                `Bienvenue ${user.prenoms || user.nom || user.name || ''} — Espace ${context?.type_organisation || 'Organisation'}`
              );

              // Redirection certifiée par le type réel de l'organisation
              const typeOrg = context?.type_organisation;
              if (typeOrg === 'OPPE') {
                this.router.navigate(['/organisation/dashboard']);
              } else if (typeOrg === 'OPPJ') {
                this.router.navigate(['/organisation/oppj']);
              } else if (typeOrg === 'OPPA') {
                this.router.navigate(['/organisation/oppa']);
              } else {
                this.router.navigate(['/organisation/dashboard']);
              }

              return of(res);
            })
          );
        } else {
          // Cas d'un Super Admin supervisant l'espace organisation
          this.isLoading.set(false);
          this.inactivityService.startTracking();
          this.toastService.info(
            'Mode Superviseur',
            'Connexion en tant que Super Admin dans le portail organisationnel.'
          );
          this.router.navigate(['/organisation/dashboard']);
          return of(res);
        }
      }),
      catchError((error: any) => {
        this.isLoading.set(false);
        if (error?.code === 'SPACE_MISMATCH' || error?.status === 403) {
          return throwError(() => error);
        }
        if (error?.message === 'NO_ORGANISATION_ATTACHED') {
          return throwError(() => ({
            status: 403,
            message: "Votre compte n'est rattaché à aucune organisation paroissiale active.",
          }));
        }
        const msg = error.error?.message || 'Identifiants incorrects ou compte inactif.';
        this.toastService.error('Erreur de connexion', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Connexion générique à la plateforme.
   */
  public login(dto: LoginDto): Observable<LoginResponse> {
    this.isLoading.set(true);
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, dto).pipe(
      tap((res) => {
        this.isLoading.set(false);
        const token = res.data.token;
        const user = res.data.user;
        const menus = res.data.menus || [];

        this.setSession(token, user, menus);
        this.inactivityService.startTracking();

        if (user.organisation_id) {
          this.organisationContextService.loadContext().subscribe({
            next: () => {
              this.redirectAfterLogin(user);
            },
            error: () => {
              this.redirectAfterLogin(user);
            },
          });
        } else {
          this.redirectAfterLogin(user);
        }

        this.toastService.success(
          'Connexion réussie',
          `Bienvenue ${user.prenoms || user.name || user.nom || ''} !`
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Identifiants incorrects ou compte inactif.';
        this.toastService.error('Erreur de connexion', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère le profil certifié de l'utilisateur connecté (/auth/me).
   */
  public getMe(): Observable<User | null> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.authUrl}/me`).pipe(
      map((res: any) => res.data?.user || res.user || res.data || null),
      tap((user: User | null) => {
        if (user && user.id) {
          this.sessionService.updateUser(user);
          if (user.organisation_id && !this.currentOrganisation()) {
            this.organisationContextService.loadContext().subscribe();
          }
        }
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Charge le contexte certifié de l'organisation.
   */
  public loadOrganisationContext(): Observable<OrganisationContext | null> {
    return this.organisationContextService.loadContext();
  }

  /**
   * Déconnexion complète.
   */
  public logout(): Observable<void> {
    this.isLoading.set(true);
    this.inactivityService.stopTracking();
    return this.http.post<void>(`${this.authUrl}/logout`, {}).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/auth/organisation']);
        this.toastService.info('Déconnexion', 'Vous avez été déconnecté avec succès.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/auth/organisation']);
        return of(void 0);
      })
    );
  }

  /**
   * Réinitialisation de mot de passe - Demande de code OTP.
   */
  public forgotPassword(dto: ForgotPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.authUrl}/forgot-password`, dto).pipe(
      tap((res) => {
        this.isLoading.set(false);
        this.toastService.success(
          'Email envoyé',
          res.message || 'Un code de réinitialisation vous a été envoyé.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(
          'Erreur',
          error.error?.message || "Impossible d'envoyer le code."
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérification du code OTP à 6 chiffres.
   */
  public verifyCode(dto: VerifyCodeDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.authUrl}/verify-code`, dto).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.toastService.success('Code valide', 'Vous pouvez maintenant définir votre nouveau mot de passe.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Code invalide', error.error?.message || 'Le code saisi est incorrect ou expiré.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Finalisation de réinitialisation de mot de passe avec le code OTP.
   */
  public resetPassword(dto: ResetPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.authUrl}/reset-password`, dto).pipe(
      tap((res) => {
        this.isLoading.set(false);
        this.toastService.success(
          'Succès',
          res.message || 'Votre mot de passe a été modifié. Vous pouvez vous connecter.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', error.error?.message || 'Échec de la modification du mot de passe.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Changement de mot de passe pour utilisateur déjà authentifié.
   */
  public changePassword(dto: ChangePasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.authUrl}/change-password`, dto).pipe(
      tap((res) => {
        this.isLoading.set(false);
        this.toastService.success('Mot de passe mis à jour', res.message || 'Votre mot de passe a été changé.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', error.error?.message || 'Impossible de modifier le mot de passe.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Mise à jour du profil utilisateur authentifié.
   */
  public updateProfile(payload: Partial<User>): Observable<User | null> {
    this.isLoading.set(true);
    return this.http.put<ApiResponse<User>>(`${this.authUrl}/update-profile`, payload).pipe(
      map((res) => res.data || (res as any).user || null),
      tap((updatedUser) => {
        this.isLoading.set(false);
        if (updatedUser) {
          this.sessionService.updateUser(updatedUser);
          this.toastService.success('Profil', 'Vos informations ont été mises à jour.');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', error.error?.message || 'Échec de la mise à jour du profil.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si l'utilisateur possède une permission donnée.
   */
  public hasPermission(permission: string): boolean {
    if (this.isSuperAdmin()) return true;
    const permissions = this.currentUser()?.profil?.permissions || [];
    return permissions.includes(permission);
  }

  public setSession(token: string, user: User, menus: any[] = []): void {
    this.sessionService.setSession(token, user, menus);
  }

  public clearSession(): void {
    this.sessionService.clearSession();
  }

  private redirectAfterLogin(user: User): void {
    if (this.isSuperAdmin()) {
      this.router.navigate(['/super-admin/dashboard']);
    } else if (user.organisation_id) {
      this.router.navigate(['/organisation/dashboard']);
    } else {
      this.router.navigate(['/mon-profil']);
    }
  }
}
