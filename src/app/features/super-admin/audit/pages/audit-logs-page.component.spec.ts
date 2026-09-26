import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsPageComponent } from './audit-logs-page.component';
import { AuditService } from '../services/audit.service';
import { AuditLog } from '../models/audit.model';

describe('AuditLogsPageComponent', () => {
  let fixture: ComponentFixture<AuditLogsPageComponent>;
  let component: AuditLogsPageComponent;
  let mockAuditService: {
    getAuditLogs: ReturnType<typeof vi.fn>;
  };

  const mockLogs: AuditLog[] = [
    {
      id: 'uuid-1',
      action: 'create',
      entite_type: 'Paroisse',
      entite_id: 12,
      ip_address: '127.0.0.1',
      user: { id: 1, name: 'Super Admin', email: 'sa@catheo.org' },
      created_at: '2026-09-19T20:00:00Z',
    },
    {
      id: 'uuid-2',
      action: 'delete',
      entite_type: 'User',
      entite_id: 34,
      ip_address: '127.0.0.1',
      user: { id: 1, name: 'Super Admin', email: 'sa@catheo.org' },
      created_at: '2026-09-19T20:05:00Z',
    },
  ];

  beforeEach(async () => {
    mockAuditService = {
      getAuditLogs: vi.fn().mockReturnValue(
        of({
          data: mockLogs,
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 2 },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AuditLogsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé et charger les logs initiaux', () => {
    expect(component).toBeTruthy();
    expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
    expect(component['logs']().length).toBe(2);
  });

  it('devrait filtrer par action', () => {
    const event = { target: { value: 'create' } } as unknown as Event;
    component.onActionFilterChange(event);

    expect(component['filterAction']()).toBe('create');
    expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create', page: 1 })
    );
  });

  it('devrait filtrer par type d’entité', () => {
    const event = { target: { value: 'Paroisse' } } as unknown as Event;
    component.onEntiteFilterChange(event);

    expect(component['filterEntite']()).toBe('Paroisse');
    expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ entite_type: 'Paroisse', page: 1 })
    );
  });

  it('devrait réinitialiser les filtres', () => {
    component['filterAction'].set('delete');
    component['filterEntite'].set('User');

    component.onResetFilters();

    expect(component['filterAction']()).toBe('tous');
    expect(component['filterEntite']()).toBe('toutes');
  });

  it('devrait gérer la pagination', () => {
    mockAuditService.getAuditLogs.mockReturnValue(
      of({
        data: mockLogs,
        meta: { current_page: 2, last_page: 5, per_page: 25, total: 100 },
      })
    );

    component.onPageChange({ page: 2, perPage: 25 });

    expect(component['currentPage']()).toBe(2);
    expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, per_page: 25 })
    );
  });

  it('devrait ouvrir et fermer la modale de détail d’un événement', () => {
    component.openDetailModal(mockLogs[0]);

    expect(component['isDetailModalOpen']()).toBe(true);
    expect(component['selectedLog']()).toEqual(mockLogs[0]);

    component.closeDetailModal();

    expect(component['isDetailModalOpen']()).toBe(false);
    expect(component['selectedLog']()).toBeNull();
  });

  it('devrait afficher l’état d’erreur en cas d’échec API', () => {
    mockAuditService.getAuditLogs.mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Accès refusé' } }))
    );

    component.refresh();

    expect(component['hasError']()).toBe(true);
    expect(component['errorMessage']()).toContain('Accès non autorisé');
  });
});
