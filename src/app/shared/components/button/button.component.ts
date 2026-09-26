import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'warning' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-btn',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.aria-busy]="loading()"
      [attr.aria-disabled]="disabled()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true"></span>
      } @else if (icon()) {
        <i [class]="icon() + ' btn-icon'" aria-hidden="true"></i>
      }
      <span class="btn-content">
        <ng-content />
      </span>
      @if (!loading() && iconRight()) {
        <i [class]="iconRight() + ' btn-icon-right'" aria-hidden="true"></i>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 600;
      border-radius: var(--radius-md, 10px);
      transition: all var(--transition-fast, 150ms ease);
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      position: relative;
      border: 1px solid transparent;
      outline: none;
    }
    button:focus-visible {
      box-shadow: var(--focus-ring);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }
    /* Sizes */
    .btn-sm {
      height: var(--btn-height-sm, 32px);
      padding: 0 0.75rem;
      font-size: 0.8125rem;
    }
    .btn-md {
      height: var(--btn-height-md, 40px);
      padding: 0 1rem;
      font-size: 0.875rem;
    }
    .btn-lg {
      height: var(--btn-height-lg, 48px);
      padding: 0 1.5rem;
      font-size: 1rem;
    }
    .btn-full {
      width: 100%;
    }
    /* Variants */
    .btn-primary {
      background: linear-gradient(135deg, var(--primary-600, #0284c7), var(--primary-700, #0369a1));
      color: #ffffff;
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--primary-500, #3b82f6), var(--primary-600, #0284c7));
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-800, #1e293b);
      border-color: var(--neutral-200, #e2e8f0);
    }
    .btn-secondary:hover:not(:disabled) {
      background-color: var(--neutral-200, #e2e8f0);
      color: var(--neutral-900, #0f172a);
    }
    .btn-accent {
      background: linear-gradient(135deg, var(--accent-600, #4f46e5), var(--accent-700, #4338ca));
      color: #ffffff;
    }
    .btn-accent:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--accent-500, #6366f1), var(--accent-600, #4f46e5));
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      color: var(--primary-700, #0369a1);
      border-color: var(--primary-300, #93c5fd);
    }
    .btn-outline:hover:not(:disabled) {
      background-color: var(--primary-50, #eff6ff);
      border-color: var(--primary-500, #3b82f6);
    }
    .btn-danger {
      background-color: var(--danger-600, #dc2626);
      color: #ffffff;
    }
    .btn-danger:hover:not(:disabled) {
      background-color: var(--danger-700, #b91c1c);
      box-shadow: var(--shadow-sm);
    }
    .btn-warning {
      background-color: var(--warning-500, #f59e0b);
      color: #ffffff;
    }
    .btn-warning:hover:not(:disabled) {
      background-color: var(--warning-600, #d97706);
    }
    .btn-success {
      background-color: var(--success-600, #059669);
      color: #ffffff;
    }
    .btn-success:hover:not(:disabled) {
      background-color: var(--success-700, #047857);
    }
    .btn-ghost {
      background: transparent;
      color: var(--neutral-700, #334155);
    }
    .btn-ghost:hover:not(:disabled) {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-900, #0f172a);
    }
    /* Spinner */
    .btn-spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  public readonly variant = input<ButtonVariant>('primary');
  public readonly size = input<ButtonSize>('md');
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
  public readonly disabled = input<boolean>(false);
  public readonly loading = input<boolean>(false);
  public readonly fullWidth = input<boolean>(false);
  public readonly icon = input<string>('');
  public readonly iconRight = input<string>('');

  public readonly btnClick = output<MouseEvent>();
  public readonly clicked = output<MouseEvent>();

  protected buttonClasses(): string {
    return [
      `btn-${this.variant()}`,
      `btn-${this.size()}`,
      this.fullWidth() ? 'btn-full' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  protected onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.btnClick.emit(event);
      this.clicked.emit(event);
    }
  }
}
