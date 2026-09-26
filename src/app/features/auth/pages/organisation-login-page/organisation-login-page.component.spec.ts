import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganisationLoginPageComponent } from './organisation-login-page.component';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganisationSpacePreferenceService } from '../../services/organisation-space-preference.service';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('OrganisationLoginPageComponent', () => {
  let component: OrganisationLoginPageComponent;
  let fixture: ComponentFixture<OrganisationLoginPageComponent>;
  let authService: AuthService;
  let preferenceService: OrganisationSpacePreferenceService;

  beforeEach(async () => {
    try {
      localStorage.clear();
    } catch {}
    await TestBed.configureTestingModule({
      imports: [OrganisationLoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/organisation', component: class {} },
          { path: 'organisation/dashboard', component: class {} },
        ]),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    preferenceService = TestBed.inject(OrganisationSpacePreferenceService);
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  it('should create with default space OPPE', () => {
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.selectedSpace()).toBe('OPPE');
  }, 15000);

  it('should update selectedSpace and save preference on onSpaceChange', () => {
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSpaceChange('OPPE');
    expect(component.selectedSpace()).toBe('OPPE');
    expect(preferenceService.getPreference()).toBe('OPPE');
  });

  it('should not contain any link or mention of super admin on the form', () => {
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.innerHTML.toLowerCase()).not.toContain('super admin');
    expect(compiled.innerHTML).not.toContain('/auth/admin');
  });

  it('should call authService.loginOrganisation with chosen space on valid submission', () => {
    preferenceService.setPreference('OPPE');
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const loginSpy = vi.spyOn(authService, 'loginOrganisation').mockReturnValue(of({} as any));

    component.loginForm.controls.login.setValue('oppe@catheo.ci');
    component.loginForm.controls.password.setValue('SecretPassword123');

    component.onSubmit();
    expect(loginSpy).toHaveBeenCalledWith({
      login: 'oppe@catheo.ci',
      password: 'SecretPassword123',
      organisation_type: 'OPPE',
    });
  });

  it('should call authService.loginOrganisation with OPPJ when space changed', () => {
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onSpaceChange('OPPJ');

    const loginSpy = vi.spyOn(authService, 'loginOrganisation').mockReturnValue(of({} as any));

    component.loginForm.controls.login.setValue('oppj@catheo.ci');
    component.loginForm.controls.password.setValue('SecretPassword123');

    component.onSubmit();
    expect(loginSpy).toHaveBeenCalledWith({
      login: 'oppj@catheo.ci',
      password: 'SecretPassword123',
      organisation_type: 'OPPJ',
    });
  });

  it('should display explicit mismatch error when SPACE_MISMATCH is returned', () => {
    preferenceService.setPreference('OPPJ');
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const mismatchError = {
      status: 403,
      code: 'SPACE_MISMATCH',
      realSpace: 'OPPE',
      chosenSpace: 'OPPJ',
      message: "Votre compte est rattaché à l'espace OPPE. Vous ne pouvez pas vous connecter à l'espace OPPJ.",
    };

    vi.spyOn(authService, 'loginOrganisation').mockReturnValue(
      throwError(() => mismatchError)
    );

    component.loginForm.controls.login.setValue('user.oppe@catheo.ci');
    component.loginForm.controls.password.setValue('Password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.generalErrorMessage()).toBe(
      "Votre compte est rattaché à l'espace OPPE. Vous ne pouvez pas vous connecter à l'espace OPPJ."
    );
  });

  it('should display error message if loginOrganisation returns 403', () => {
    preferenceService.setPreference('OPPE');
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    vi.spyOn(authService, 'loginOrganisation').mockReturnValue(
      throwError(() => ({
        status: 403,
        message: "Votre compte n'est rattaché à aucune organisation paroissiale active.",
      }))
    );

    component.loginForm.controls.login.setValue('orphan@catheo.ci');
    component.loginForm.controls.password.setValue('Password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.generalErrorMessage()).toContain("aucune organisation paroissiale");
  });

  it('should have submit button with type submit in the DOM', () => {
    fixture = TestBed.createComponent(OrganisationLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const submitBtn = fixture.nativeElement.querySelector('.login-submit-btn button');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.getAttribute('type')).toBe('submit');
  });
});
