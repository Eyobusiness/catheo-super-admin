import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

export interface DashboardNotificationItem {
  id: string;
  type: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  description: string;
  timeAgo: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-notifications',
  standalone: true,
  imports: [CommonModule, CardComponent, EmptyStateComponent],
  template: `
    <app-card
      title="Centre de Notifications"
      subtitle="Alertes et événements critiques récents de la plateforme"
    >
      @if (notifications().length > 0) {
        <div class="notifications-list">
          @for (notif of notifications(); track notif.id) {
            <div [class]="'notif-item type-' + notif.type">
              <div class="notif-icon-col">
                <i [class]="notif.icon"></i>
              </div>
              <div class="notif-content-col">
                <div class="notif-top">
                  <span class="notif-title">{{ notif.title }}</span>
                  <span class="notif-time">{{ notif.timeAgo }}</span>
                </div>
                <p class="notif-desc">{{ notif.description }}</p>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          title="Toutes les alertes sont traitées"
          description="Aucune alerte critique ni événement urgent en attente d'action."
          icon="bi bi-bell-slash"
        />
      }
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .notif-item {
      display: flex;
      gap: 0.875rem;
      padding: 0.875rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      transition: transform var(--transition-fast, 150ms ease);
    }
    .notif-item:hover {
      transform: translateX(2px);
    }
    .notif-icon-col {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .type-warning {
      border-left: 4px solid #d97706;
    }
    .type-warning .notif-icon-col {
      background: #fef3c7;
      color: #b45309;
    }
    .type-danger {
      border-left: 4px solid #dc2626;
    }
    .type-danger .notif-icon-col {
      background: #fee2e2;
      color: #b91c1c;
    }
    .type-info {
      border-left: 4px solid #0284c7;
    }
    .type-info .notif-icon-col {
      background: #e0f2fe;
      color: #0369a1;
    }
    .type-success {
      border-left: 4px solid #16a34a;
    }
    .type-success .notif-icon-col {
      background: #dcfce7;
      color: #15803d;
    }
    .notif-content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .notif-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .notif-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .notif-time {
      font-size: 0.6875rem;
      color: var(--text-muted, #94a3b8);
    }
    .notif-desc {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-secondary, #475569);
      line-height: 1.4;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotificationsComponent {
  public readonly notifications = input<DashboardNotificationItem[]>([]);
}
