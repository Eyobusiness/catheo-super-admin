import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="'toast-item toast-' + toast.type"
          role="alert"
        >
          <div class="toast-icon-wrap" aria-hidden="true">
            <i [class]="getIcon(toast.type)"></i>
          </div>
          <div class="toast-content">
            <h4 class="toast-title">{{ toast.title }}</h4>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>
          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            class="toast-close-btn"
            aria-label="Fermer la notification"
          >
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      background: var(--bg-surface, #ffffff);
      border-radius: var(--radius-lg, 14px);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color, #e2e8f0);
      animation: slideInRight var(--transition-normal);
      border-left: 4px solid transparent;
    }
    .toast-success {
      border-left-color: var(--success-600, #059669);
    }
    .toast-success .toast-icon-wrap {
      color: var(--success-600, #059669);
      background: var(--success-50, #ecfdf5);
    }
    .toast-error {
      border-left-color: var(--danger-600, #dc2626);
    }
    .toast-error .toast-icon-wrap {
      color: var(--danger-600, #dc2626);
      background: var(--danger-50, #fef2f2);
    }
    .toast-warning {
      border-left-color: var(--warning-600, #d97706);
    }
    .toast-warning .toast-icon-wrap {
      color: var(--warning-600, #d97706);
      background: var(--warning-50, #fffbeb);
    }
    .toast-info {
      border-left-color: var(--primary-600, #0284c7);
    }
    .toast-info .toast-icon-wrap {
      color: var(--primary-600, #0284c7);
      background: var(--primary-50, #eff6ff);
    }
    .toast-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .toast-content {
      flex: 1;
      min-width: 0;
    }
    .toast-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .toast-message {
      font-size: 0.8125rem;
      color: var(--text-secondary, #475569);
      margin: 0.25rem 0 0 0;
      line-height: 1.4;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #64748b);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0;
      margin-left: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast-close-btn:hover {
      color: var(--text-primary, #0f172a);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected getIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi bi-check-circle-fill';
      case 'error': return 'bi bi-exclamation-octagon-fill';
      case 'warning': return 'bi bi-exclamation-triangle-fill';
      case 'info':
      default: return 'bi bi-info-circle-fill';
    }
  }
}
