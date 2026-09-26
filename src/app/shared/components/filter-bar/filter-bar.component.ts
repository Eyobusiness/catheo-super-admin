import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchInputComponent } from '../search-input/search-input.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [SearchInputComponent, ButtonComponent],
  template: `
    <div class="filter-bar-container">
      <div class="filter-bar-search">
        @if (showSearch()) {
          <app-search-input
            [placeholder]="searchPlaceholder()"
            (search)="searchChange.emit($event)"
          />
        }
      </div>

      <div class="filter-bar-controls">
        <ng-content />

        @if (hasActiveFilters()) {
          <app-btn
            [variant]="'ghost'"
            [size]="'sm'"
            (btnClick)="resetFilters.emit()"
            class="reset-btn"
          >
            <i class="bi bi-x-circle"></i>
            <span>Réinitialiser</span>
          </app-btn>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      margin-bottom: 1rem;
    }
    .filter-bar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 14px);
      box-shadow: var(--shadow-xs);
      flex-wrap: wrap;
    }
    .filter-bar-search {
      flex: 1;
      min-width: 260px;
    }
    .filter-bar-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .reset-btn {
      color: var(--danger-600, #dc2626) !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  public readonly showSearch = input<boolean>(true);
  public readonly searchPlaceholder = input<string>('Rechercher...');
  public readonly hasActiveFilters = input<boolean>(false);

  public readonly searchChange = output<string>();
  public readonly resetFilters = output<void>();
}
