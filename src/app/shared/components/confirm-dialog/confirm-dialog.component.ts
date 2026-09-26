import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="title()"
      [size]="'sm'"
      [closable]="!loading()"
      (closed)="onCancel()"
    >
      <div class="confirm-content">
        <div [class]="'confirm-icon-wrap variant-' + variant()" aria-hidden="true">
          <i [class]="getIcon()"></i>
        </div>
        <p class="confirm-message">{{ message() }}</p>
      </div>

      <div modal-footer class="confirm-footer">
        <app-btn
          [variant]="'secondary'"
          [size]="'md'"
          [disabled]="loading()"
          (btnClick)="onCancel()"
        >
          {{ cancelText() }}
        </app-btn>

        <app-btn
          [variant]="variant() === 'danger' ? 'danger' : variant() === 'warning' ? 'warning' : 'primary'"
          [size]="'md'"
          [loading]="loading()"
          (btnClick)="onConfirm()"
        >
          {{ confirmText() }}
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0.5rem 0;
      gap: 1rem;
    }
    .confirm-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .variant-danger {
      background-color: var(--danger-50, #fef2f2);
      color: var(--danger-600, #dc2626);
    }
    .variant-warning {
      background-color: var(--warning-50, #fffbeb);
      color: var(--warning-600, #d97706);
    }
    .variant-info {
      background-color: var(--info-50, #f0f9ff);
      color: var(--info-600, #0284c7);
    }
    .confirm-message {
      font-size: 0.9375rem;
      color: var(--text-secondary, #475569);
      line-height: 1.5;
      margin: 0;
    }
    .confirm-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly title = input<string>('Confirmation');
  public readonly message = input<string>('Êtes-vous sûr de vouloir effectuer cette action ?');
  public readonly variant = input<ConfirmVariant>('danger');
  public readonly confirmText = input<string>('Confirmer');
  public readonly cancelText = input<string>('Annuler');
  public readonly loading = input<boolean>(false);

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();

  protected getIcon(): string {
    switch (this.variant()) {
      case 'danger':
        return 'bi bi-trash3';
      case 'warning':
        return 'bi bi-exclamation-triangle';
      case 'info':
      default:
        return 'bi bi-info-circle';
    }
  }

  public onConfirm(): void {
    if (!this.loading()) {
      this.confirmed.emit();
    }
  }

  public onCancel(): void {
    if (!this.loading()) {
      this.cancelled.emit();
    }
  }
}
