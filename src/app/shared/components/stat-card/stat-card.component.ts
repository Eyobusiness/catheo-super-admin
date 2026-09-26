import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div [class]="'stat-card theme-' + theme()" [title]="tooltip() || title()">
      <div class="stat-content">
        <div class="stat-header-row">
          <span class="stat-title">{{ title() }}</span>
          @if (tooltip()) {
            <span class="stat-tooltip-icon" [title]="tooltip()">
              <i class="bi bi-info-circle"></i>
            </span>
          }
        </div>

        @if (loading()) {
          <div class="stat-skeleton-wrap">
            <app-skeleton width="110px" height="1.75rem" />
            <app-skeleton width="70px" height="0.875rem" />
          </div>
        } @else {
          <div class="stat-value-wrap">
            <span class="stat-value">{{ value() }}</span>
            @if (trend()) {
              <span [class]="'stat-trend trend-' + trendDirection()">
                <i [class]="trendIcon()"></i>
                {{ trend() }}
              </span>
            }
          </div>
          @if (subtitle()) {
            <span class="stat-subtitle">{{ subtitle() }}</span>
          }
        }
      </div>
      @if (icon()) {
        <div class="stat-icon-wrap" aria-hidden="true">
          <i [class]="icon()"></i>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .stat-card {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 14px);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .stat-header-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .stat-tooltip-icon {
      font-size: 0.8125rem;
      color: var(--text-muted, #94a3b8);
      cursor: help;
      transition: color var(--transition-fast, 150ms ease);
    }
    .stat-tooltip-icon:hover {
      color: var(--primary-600, #0284c7);
    }
    .stat-skeleton-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .stat-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-value-wrap {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1.2;
    }
    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-full, 9999px);
      padding: 0.15rem 0.5rem;
    }
    .trend-up {
      background: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
    }
    .trend-down {
      background: var(--danger-50, #fef2f2);
      color: var(--danger-700, #b91c1c);
    }
    .trend-neutral {
      background: var(--neutral-100, #f1f5f9);
      color: var(--neutral-600, #475569);
    }
    .stat-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary, #475569);
    }
    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md, 10px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    /* Color themes */
    .theme-primary .stat-icon-wrap {
      background: var(--primary-50, #eff6ff);
      color: var(--primary-600, #0284c7);
    }
    .theme-accent .stat-icon-wrap {
      background: var(--accent-50, #eef2ff);
      color: var(--accent-600, #4f46e5);
    }
    .theme-success .stat-icon-wrap {
      background: var(--success-50, #ecfdf5);
      color: var(--success-600, #059669);
    }
    .theme-warning .stat-icon-wrap {
      background: var(--warning-50, #fffbeb);
      color: var(--warning-600, #d97706);
    }
    .theme-danger .stat-icon-wrap {
      background: var(--danger-50, #fef2f2);
      color: var(--danger-600, #dc2626);
    }
    .theme-info .stat-icon-wrap {
      background: var(--info-50, #f0f9ff);
      color: var(--info-600, #0284c7);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  public readonly title = input.required<string>();
  public readonly value = input.required<string | number>();
  public readonly subtitle = input<string>('');
  public readonly icon = input<string>('');
  public readonly trend = input<string>('');
  public readonly trendDirection = input<'up' | 'down' | 'neutral'>('neutral');
  public readonly theme = input<'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>('primary');
  public readonly tooltip = input<string>('');
  public readonly loading = input<boolean>(false);

  protected trendIcon(): string {
    if (this.trendDirection() === 'up') return 'bi bi-arrow-up-short';
    if (this.trendDirection() === 'down') return 'bi bi-arrow-down-short';
    return 'bi bi-dash';
  }
}
