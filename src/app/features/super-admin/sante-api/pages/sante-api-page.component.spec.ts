import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SanteApiPageComponent } from './sante-api-page.component';
import { SanteApiService } from '../services/sante-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SystemHealthReport } from '../models/sante-api.model';

describe('SanteApiPageComponent', () => {
  let fixture: ComponentFixture<SanteApiPageComponent>;
  let component: SanteApiPageComponent;
  let mockSanteService: {
    getHealthReport: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    show: ReturnType<typeof vi.fn>;
  };

  const mockReport: SystemHealthReport = {
    statut_global: 'healthy',
    message: 'Catheo API v1 is running',
    server_timestamp: '2026-09-19T21:49:00+00:00',
    client_latency_ms: 110,
    derniere_verification: '2026-09-19T21:49:05Z',
  };

  beforeEach(async () => {
    mockSanteService = {
      getHealthReport: vi.fn().mockReturnValue(of(mockReport)),
    };
    mockToast = {
      show: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SanteApiPageComponent],
      providers: [
        provideRouter([]),
        { provide: SanteApiService, useValue: mockSanteService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SanteApiPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait charger l’état de santé initialement', () => {
    expect(component).toBeTruthy();
    expect(mockSanteService.getHealthReport).toHaveBeenCalled();
    expect(component['report']()).toEqual(mockReport);
  });

  it('devrait déclencher checkHealth et afficher un toast lors du clic sur vérifier maintenant', () => {
    component.checkHealth(true);

    expect(mockSanteService.getHealthReport).toHaveBeenCalledTimes(2);
    expect(mockToast.show).toHaveBeenCalledWith(
      'success',
      'Contrôle de santé API',
      expect.stringContaining('110 ms')
    );
  });

  it('devrait gérer l’erreur si le serveur ne répond pas', () => {
    mockSanteService.getHealthReport.mockReturnValue(
      throwError(() => ({ message: 'Connexion refusée' }))
    );

    component.checkHealth(true);

    expect(component['hasError']()).toBe(true);
    expect(component['errorMessage']()).toContain('Connexion refusée');
    expect(mockToast.show).toHaveBeenCalledWith(
      'error',
      'Échec du contrôle',
      expect.any(String)
    );
  });
});
