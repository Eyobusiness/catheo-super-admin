import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="page-header-container">
      @if (breadcrumbs().length > 0) {
        <nav class="breadcrumb-nav" aria-label="Fil d'ariane">
          <ol class="breadcrumb-list">
            @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
              <li class="breadcrumb-item" [class.is-active]="last" [attr.aria-current]="last ? 'page' : null">
                @if (!last && crumb.path) {
                  <a [routerLink]="crumb.path" class="breadcrumb-link">{{ crumb.label }}</a>
                  <i class="bi bi-chevron-right breadcrumb-separator" aria-hidden="true"></i>
                } @else {
                  <span>{{ crumb.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>
      }

      <div class="page-header-main">
        <div class="page-title-wrap">
          <div class="title-with-badge">
            <h1 class="page-title">{{ title() }}</h1>
            @if (badge()) {
              <span class="page-title-badge">{{ badge() }}</span>
            }
          </div>
          @if (subtitle()) {
            <p class="page-subtitle">{{ subtitle() }}</p>
          }
        </div>

        <div class="page-header-actions">
          <ng-content select="[page-actions]" />
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      margin-bottom: 1.5rem;
    }
    .page-header-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .breadcrumb-nav {
      font-size: 0.8125rem;
    }
    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      list-style: none;
      gap: 0.35rem;
      margin: 0;
      padding: 0;
    }
    .breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-muted, #64748b);
    }
    .breadcrumb-item.is-active {
      color: var(--text-primary, #0f172a);
      font-weight: 600;
    }
    .breadcrumb-link {
      color: var(--text-muted, #64748b);
      text-decoration: none;
      transition: color var(--transition-fast);
    }
    .breadcrumb-link:hover {
      color: var(--primary-600, #0284c7);
    }
    .breadcrumb-separator {
      font-size: 0.65rem;
      color: var(--neutral-400, #94a3b8);
    }
    .page-header-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .page-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .title-with-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
    }
    .page-title-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--primary-50, #eff6ff);
      color: var(--primary-700, #0369a1);
      border: 1px solid var(--primary-200, #bfdbfe);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    .page-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  public readonly title = input.required<string>();
  public readonly subtitle = input<string>('');
  public readonly badge = input<string>('');
  public readonly breadcrumbs = input<BreadcrumbItem[]>([]);
}
