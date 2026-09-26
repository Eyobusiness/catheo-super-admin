import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ApiErrorService } from './api-error.service';

describe('ApiErrorService', () => {
  let service: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    service = TestBed.inject(ApiErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sanitize dangerous SQL/internal server errors', () => {
    const error = new HttpErrorResponse({
      error: { message: 'SQLSTATE[42S02]: Base table or view not found at /var/www/catheo/app/Models/User.php' },
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = service.handleError(error, false);
    expect(result.message).not.toContain('SQLSTATE');
    expect(result.message).not.toContain('.php');
    expect(result.message).toContain('erreur interne du serveur');
  });

  it('should format 422 validation errors properly', () => {
    const error = new HttpErrorResponse({
      error: {
        message: 'Données invalides',
        errors: {
          email: ['Le champ email est requis.'],
          password: ['Le mot de passe doit contenir 8 caractères.'],
        },
      },
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    const result = service.handleError(error, false);
    expect(result.status).toBe(422);
    expect(result.errors?.['email']?.[0]).toBe('Le champ email est requis.');
  });
});
