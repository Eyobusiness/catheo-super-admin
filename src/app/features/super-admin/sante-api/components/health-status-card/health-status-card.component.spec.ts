import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { HealthStatusCardComponent } from './health-status-card.component';
import { SystemHealthReport } from '../../models/sante-api.model';

describe('HealthStatusCardComponent', () => {
  let fixture: ComponentFixture<HealthStatusCardComponent>;

  const mockReport: SystemHealthReport = {
    statut_global: 'healthy',
    message: 'Catheo API v1 is running',
    server_timestamp: '2026-09-19T21:49:00+00:00',
    client_latency_ms: 85,
    derniere_verification: '2026-09-19T21:49:05Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HealthStatusCardComponent],
    });

    fixture = TestBed.createComponent(HealthStatusCardComponent);
    fixture.componentRef.setInput('report', mockReport);
    fixture.detectChanges();
  });

  it('devrait afficher les données de santé et la latence client', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Catheo API v1 is running');
    expect(text).toContain('Opérationnelle');
    expect(text).toContain('2026-09-19T21:49:00+00:00');
    expect(text).toContain('85 ms');
    expect(text).toContain('GET /api/v1/health');
  });

  it('devrait basculer sur indisponible si le statut est unhealthy', () => {
    fixture.componentRef.setInput('report', {
      ...mockReport,
      statut_global: 'unhealthy',
      message: 'Service temporairement dégradé',
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Indisponible');
    expect(text).toContain('Service temporairement dégradé');
  });
});
