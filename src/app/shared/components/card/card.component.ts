import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="cardClasses()">
      @if (title() || subtitle()) {
        <div class="card-header">
          <div class="header-titles">
            @if (title()) {
              <h3 class="card-title">{{ title() }}</h3>
            }
            @if (subtitle()) {
              <p class="card-subtitle">{{ subtitle() }}</p>
            }
          </div>
          <div class="header-actions">
            <ng-content select="[card-actions]" />
          </div>
        </div>
      }
      <div class="card-body">
        <ng-content />
      </div>
      <div class="card-footer">
        <ng-content select="[card-footer]" />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .app-card {
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 14px);
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition-normal);
      overflow: hidden;
    }
    .card-elevated {
      box-shadow: var(--shadow-md);
    }
    .card-bordered {
      border: 1px solid var(--border-color, #e2e8f0);
      box-shadow: none;
    }
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .card-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      margin: 0.25rem 0 0 0;
    }
    .card-body {
      padding: 1.5rem;
    }
    .card-footer:empty {
      display: none;
    }
    .card-footer {
      padding: 1rem 1.5rem;
      background-color: var(--neutral-50, #f8fafc);
      border-top: 1px solid var(--border-color-light, #f1f5f9);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  public readonly title = input<string>('');
  public readonly subtitle = input<string>('');
  public readonly variant = input<'default' | 'elevated' | 'bordered'>('default');

  protected cardClasses(): string {
    return `app-card card-${this.variant()}`;
  }
}
