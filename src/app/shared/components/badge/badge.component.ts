import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses()">
      @if (dot()) {
        <span class="badge-dot" aria-hidden="true"></span>
      }
      @if (icon()) {
        <i [class]="icon() + ' badge-icon'" aria-hidden="true"></i>
      }
      <span class="badge-text">
        @if (label()) {
          {{ label() }}
        } @else {
          <ng-content />
        }
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }
    span.app-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
      border-radius: var(--radius-full, 9999px);
      line-height: 1;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .badge-sm {
      padding: 0.2rem 0.5rem;
      font-size: 0.6875rem;
    }
    .badge-md {
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
    /* Variants */
    .badge-primary {
      background-color: var(--primary-50, #eff6ff);
      color: var(--primary-700, #0369a1);
      border-color: var(--primary-200, #bfdbfe);
    }
    .badge-secondary {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-700, #334155);
      border-color: var(--neutral-200, #e2e8f0);
    }
    .badge-success {
      background-color: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
      border-color: var(--success-100, #d1fae5);
    }
    .badge-warning {
      background-color: var(--warning-50, #fffbeb);
      color: var(--warning-700, #b45309);
      border-color: var(--warning-100, #fef3c7);
    }
    .badge-danger {
      background-color: var(--danger-50, #fef2f2);
      color: var(--danger-700, #b91c1c);
      border-color: var(--danger-100, #fee2e2);
    }
    .badge-info {
      background-color: var(--info-50, #f0f9ff);
      color: var(--info-700, #0369a1);
      border-color: var(--info-100, #e0f2fe);
    }
    .badge-neutral {
      background-color: var(--neutral-50, #f8fafc);
      color: var(--neutral-600, #475569);
      border-color: var(--neutral-200, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  public readonly label = input<string>('');
  public readonly variant = input<BadgeVariant>('primary');
  public readonly size = input<BadgeSize>('md');
  public readonly dot = input<boolean>(false);
  public readonly icon = input<string>('');

  protected badgeClasses(): string {
    return `app-badge badge-${this.variant()} badge-${this.size()}`;
  }
}
