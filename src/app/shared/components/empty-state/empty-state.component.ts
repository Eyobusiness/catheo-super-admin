import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state-wrap">
      <div class="empty-state-icon" aria-hidden="true">
        <i [class]="icon()"></i>
      </div>
      <h3 class="empty-state-title">{{ title() }}</h3>
      @if (description()) {
        <p class="empty-state-desc">{{ description() }}</p>
      }
      <div class="empty-state-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .empty-state-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3.5rem 1.5rem;
      background: var(--bg-surface, #ffffff);
      border: 1.5px dashed var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 14px);
      max-width: 600px;
      margin: 1.5rem auto;
    }
    .empty-state-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary-50, #eff6ff);
      color: var(--primary-600, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1.25rem;
    }
    .empty-state-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0 0 0.5rem 0;
    }
    .empty-state-desc {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      max-width: 440px;
      line-height: 1.5;
      margin: 0;
    }
    .empty-state-actions {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-state-actions:empty {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  public readonly icon = input<string>('bi bi-inbox');
  public readonly title = input.required<string>();
  public readonly description = input<string>('');
}
