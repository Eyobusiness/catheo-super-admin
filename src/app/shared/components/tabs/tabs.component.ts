import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number | string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="tabs-nav" [attr.aria-label]="ariaLabel()">
      <div class="tabs-list" role="tablist">
        @for (tab of tabs(); track tab.id) {
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.is-active]="activeId() === tab.id"
            [class.is-disabled]="tab.disabled"
            [attr.aria-selected]="activeId() === tab.id"
            [disabled]="tab.disabled"
            (click)="selectTab(tab.id)"
          >
            @if (tab.icon) {
              <i [class]="tab.icon + ' tab-icon'"></i>
            }
            <span class="tab-label">{{ tab.label }}</span>
            @if (tab.badge !== undefined && tab.badge !== null) {
              <span class="tab-badge">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .tabs-nav {
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .tabs-list {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: thin;
      padding-bottom: -1px;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #64748b);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast, 150ms ease);
    }
    .tab-btn:hover:not(.is-disabled) {
      color: var(--text-primary, #0f172a);
      border-bottom-color: var(--neutral-300, #cbd5e1);
    }
    .tab-btn.is-active {
      color: var(--primary-600, #0284c7);
      font-weight: 600;
      border-bottom-color: var(--primary-600, #0284c7);
    }
    .tab-btn.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .tab-icon {
      font-size: 1rem;
    }
    .tab-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      background: var(--neutral-100, #f1f5f9);
      color: var(--text-secondary, #64748b);
    }
    .tab-btn.is-active .tab-badge {
      background: rgba(2, 132, 199, 0.12);
      color: var(--primary-700, #0369a1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  public readonly tabs = input.required<TabItem[]>();
  public readonly activeId = input.required<string>();
  public readonly ariaLabel = input<string>('Onglets de navigation');
  public readonly tabChange = output<string>();

  protected selectTab(id: string): void {
    this.tabChange.emit(id);
  }
}
