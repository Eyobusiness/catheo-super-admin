import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminLoginPageComponent } from './admin-login-page.component';
import { AuthService } from '../../../../core/services/auth.service';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('AdminLoginPageComponent', () => {
  let component: AdminLoginPageComponent;
  let fixture: ComponentFixture<AdminLoginPageComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/organisation', component: class {} },
          { path: 'super-admin/dashboard', component: class {} },
        ]),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginPageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should validate required fields', () => {
    component.loginForm.controls.login.setValue('admin@catheo.ci');
    component.loginForm.controls.password.setValue('1234');
    expect(component.loginForm.valid).toBe(true);
  });

  it('should call authService.loginAdmin on valid submission', () => {
    const loginSpy = vi.spyOn(authService, 'loginAdmin').mockReturnValue(of({} as any));

    component.loginForm.controls.login.setValue('super@catheo.ci');
    component.loginForm.controls.password.setValue('SuperSecret123');

    component.onSubmit();
    expect(loginSpy).toHaveBeenCalledWith({
      login: 'super@catheo.ci',
      password: 'SuperSecret123',
    });
  });

  it('should have submit button with type submit in the DOM', () => {
    const submitBtn = fixture.nativeElement.querySelector('.login-submit-btn button');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.getAttribute('type')).toBe('submit');
  });

  it('should trigger onSubmit when submit button is clicked on valid form', () => {
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');
    component.loginForm.controls.login.setValue('admin@catheo.ci');
    component.loginForm.controls.password.setValue('password123');
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.login-submit-btn button');
    submitBtn.click();
    expect(onSubmitSpy).toHaveBeenCalled();
  });

  it('should display error message when loginAdmin fails with 403', () => {
    vi.spyOn(authService, 'loginAdmin').mockReturnValue(
      throwError(() => ({
        status: 403,
        message: 'Ce compte ne dispose pas des privilèges Super Administrateur.',
      }))
    );

    component.loginForm.controls.login.setValue('user@catheo.ci');
    component.loginForm.controls.password.setValue('Password123');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.generalErrorMessage()).toContain('privilèges Super Administrateur');
  });

  it('should display validation errors when loginAdmin fails with 422', () => {
    vi.spyOn(authService, 'loginAdmin').mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          message: 'Identifiants incorrects.',
          errors: { login: ['Identifiants incorrects.'] },
        },
      }))
    );

    component.loginForm.controls.login.setValue('bad@catheo.ci');
    component.loginForm.controls.password.setValue('wrongpass');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.generalErrorMessage()).toContain('Identifiants incorrects');
    expect(component.serverErrors()?.['login']).toContain('Identifiants incorrects.');
  });
});
