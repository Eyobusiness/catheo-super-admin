import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AuditLog } from '../../../audit/models/audit.model';

@Component({
  selector: 'app-dashboard-recent-activity',
  standalone: true,
  imports: [CommonModule, CardComponent, EmptyStateComponent],
  template: `
    <app-card
      title="Activité Récente & Piste d'Audit"
      subtitle="Timeline des dernières actions système (créations, modifications, restaurations, suppressions)"
    >
      @if (logs().length > 0) {
        <div class="timeline-container">
          @for (log of logs(); track log.id) {
            <div class="timeline-item">
              <div class="timeline-icon-col">
                <div [class]="'timeline-bullet ' + getActionClass(log.action)">
                  <i [class]="getActionIcon(log.action)"></i>
                </div>
                <div class="timeline-line"></div>
              </div>

              <div class="timeline-body">
                <div class="timeline-header">
                  <span class="timeline-actor">{{ log.user?.name || 'Système / Super Admin' }}</span>
                  <span class="timeline-date">{{ formatDate(log.created_at) }}</span>
                </div>

                <p class="timeline-text">
                  <span [class]="'action-tag ' + getActionClass(log.action)">
                    {{ getActionLabel(log.action) }}
                  </span>
                  <span class="entity-desc">{{ log.entite_type }} ({{ log.module || 'Système' }})</span>
                </p>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          title="Aucune activité récente"
          description="Aucune action administrative récente enregistrée dans le journal d'audit."
          icon="bi bi-clock-history"
        />
      }
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .timeline-container {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 0;
    }
    .timeline-item {
      display: flex;
      gap: 1rem;
      position: relative;
    }
    .timeline-icon-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 32px;
      flex-shrink: 0;
    }
    .timeline-bullet {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      z-index: 2;
    }
    .timeline-bullet.create {
      background: #ecfdf5;
      color: #059669;
      border: 2px solid #a7f3d0;
    }
    .timeline-bullet.update {
      background: #eff6ff;
      color: #2563eb;
      border: 2px solid #bfdbfe;
    }
    .timeline-bullet.restore {
      background: #fdf4ff;
      color: #9333ea;
      border: 2px solid #f5d0fe;
    }
    .timeline-bullet.delete,
    .timeline-bullet.force_delete {
      background: #fef2f2;
      color: #dc2626;
      border: 2px solid #fecaca;
    }
    .timeline-bullet.default {
      background: #f1f5f9;
      color: #64748b;
      border: 2px solid #cbd5e1;
    }
    .timeline-line {
      flex: 1;
      width: 2px;
      background: var(--border-color, #e2e8f0);
      margin: 0.25rem 0;
      min-height: 24px;
    }
    .timeline-item:last-child .timeline-line {
      display: none;
    }
    .timeline-body {
      flex: 1;
      padding-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .timeline-actor {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .timeline-date {
      font-size: 0.6875rem;
      color: var(--text-muted, #94a3b8);
    }
    .timeline-text {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-secondary, #475569);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .action-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .action-tag.create { background: #dcfce7; color: #15803d; }
    .action-tag.update { background: #dbeafe; color: #1d4ed8; }
    .action-tag.restore { background: #f3e8ff; color: #7e22ce; }
    .action-tag.delete,
    .action-tag.force_delete { background: #fee2e2; color: #b91c1c; }
    .action-tag.default { background: #f1f5f9; color: #475569; }
    .entity-desc {
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRecentActivityComponent {
  public readonly logs = input<AuditLog[]>([]);

  protected getActionClass(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create':
      case 'création':
        return 'create';
      case 'update':
      case 'modification':
        return 'update';
      case 'restore':
      case 'restauration':
        return 'restore';
      case 'delete':
      case 'suppression':
      case 'force_delete':
        return 'delete';
      default:
        return 'default';
    }
  }

  protected getActionIcon(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create':
      case 'création':
        return 'bi bi-plus-circle';
      case 'update':
      case 'modification':
        return 'bi bi-pencil';
      case 'restore':
      case 'restauration':
        return 'bi bi-arrow-counterclockwise';
      case 'delete':
      case 'suppression':
      case 'force_delete':
        return 'bi bi-trash';
      default:
        return 'bi bi-dot';
    }
  }

  protected getActionLabel(action: string): string {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'restore':
        return 'Restauration';
      case 'delete':
        return 'Suppression';
      case 'force_delete':
        return 'Suppression définitive';
      default:
        return action || 'Action';
    }
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Récemment';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? String(dateStr)
        : d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return String(dateStr);
    }
  }
}
