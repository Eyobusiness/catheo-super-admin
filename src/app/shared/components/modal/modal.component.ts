import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div
          class="modal-dialog"
          [class]="'modal-' + size()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? 'modal-title' : null"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="modal-header">
            @if (title()) {
              <h3 id="modal-title" class="modal-title">{{ title() }}</h3>
            }
            @if (closable()) {
              <button
                type="button"
                (click)="emitClose()"
                class="modal-close-btn"
                aria-label="Fermer la boîte de dialogue"
              >
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            }
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <ng-content />
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 1050;
      animation: fadeIn var(--transition-fast);
    }
    .modal-dialog {
      background: var(--bg-surface, #ffffff);
      border-radius: var(--radius-xl, 20px);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp var(--transition-normal);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .modal-sm { max-width: 420px; }
    .modal-md { max-width: 580px; }
    .modal-lg { max-width: 800px; }
    .modal-xl { max-width: 1080px; }
    .modal-full { max-width: 95vw; height: 90vh; }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #64748b);
      font-size: 1rem;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }
    .modal-close-btn:hover {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--danger-600, #dc2626);
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer:empty {
      display: none;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      background-color: var(--neutral-50, #f8fafc);
      border-top: 1px solid var(--border-color-light, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly title = input<string>('');
  public readonly size = input<ModalSize>('md');
  public readonly closable = input<boolean>(true);
  public readonly closeOnBackdrop = input<boolean>(true);

  public readonly close = output<void>();
  public readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.isOpen() && this.closable()) {
      this.emitClose();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && this.closable()) {
      this.emitClose();
    }
  }

  protected emitClose(): void {
    this.close.emit();
    this.closed.emit();
  }
}
