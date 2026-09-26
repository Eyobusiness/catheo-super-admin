import { ChangeDetectionStrategy, Component, ElementRef, HostListener, input, output, signal } from '@angular/core';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  template: `
    <div class="dropdown-wrapper">
      <button
        type="button"
        [class]="'dropdown-trigger ' + triggerClass()"
        (click)="toggle()"
        [attr.aria-expanded]="isOpen()"
        aria-haspopup="true"
      >
        <ng-content select="[dropdown-trigger]" />
        @if (!hasCustomTrigger()) {
          <span>{{ label() }}</span>
          <i class="bi bi-chevron-down dropdown-arrow" [class.is-open]="isOpen()" aria-hidden="true"></i>
        }
      </button>

      @if (isOpen()) {
        <div class="dropdown-menu" role="menu" (click)="$event.stopPropagation()">
          @for (item of items(); track item.id) {
            <button
              type="button"
              role="menuitem"
              [disabled]="item.disabled"
              [class.is-danger]="item.danger"
              (click)="onItemClick(item)"
              class="dropdown-item"
            >
              @if (item.icon) {
                <i [class]="item.icon + ' item-icon'" aria-hidden="true"></i>
              }
              <span>{{ item.label }}</span>
            </button>
          }
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
    .dropdown-wrapper {
      position: relative;
    }
    .dropdown-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .dropdown-trigger:hover {
      background-color: var(--neutral-50, #f8fafc);
      border-color: var(--neutral-300, #cbd5e1);
    }
    .dropdown-arrow {
      font-size: 0.75rem;
      transition: transform var(--transition-fast);
    }
    .dropdown-arrow.is-open {
      transform: rotate(180deg);
    }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      min-width: 180px;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-lg);
      padding: 0.35rem 0;
      z-index: 1000;
      animation: dropdownFade var(--transition-fast);
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      color: var(--text-primary, #0f172a);
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }
    .dropdown-item:hover:not(:disabled) {
      background-color: var(--neutral-100, #f1f5f9);
    }
    .dropdown-item.is-danger {
      color: var(--danger-600, #dc2626);
    }
    .dropdown-item.is-danger:hover:not(:disabled) {
      background-color: var(--danger-50, #fef2f2);
    }
    .dropdown-item:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .item-icon {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
    }
    .dropdown-item.is-danger .item-icon {
      color: var(--danger-600, #dc2626);
    }

    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  public readonly label = input<string>('Actions');
  public readonly items = input<DropdownItem[]>([]);
  public readonly triggerClass = input<string>('');
  public readonly hasCustomTrigger = input<boolean>(false);

  public readonly itemSelected = output<DropdownItem>();

  protected readonly isOpen = signal<boolean>(false);

  constructor(private readonly elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    this.isOpen.set(false);
  }

  public toggle(): void {
    this.isOpen.update((v) => !v);
  }

  public close(): void {
    this.isOpen.set(false);
  }

  protected onItemClick(item: DropdownItem): void {
    if (!item.disabled) {
      this.itemSelected.emit(item);
      this.close();
    }
  }
}
