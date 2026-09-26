import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  template: `
    <div class="search-input-wrap">
      <span class="search-icon" aria-hidden="true">
        <i class="bi bi-search"></i>
      </span>
      <input
        type="search"
        [placeholder]="placeholder()"
        [value]="query()"
        (input)="onInput($event)"
        (keydown.escape)="clear()"
        class="search-field"
        aria-label="Recherche"
      />
      @if (query()) {
        <button
          type="button"
          (click)="clear()"
          class="clear-btn"
          aria-label="Effacer la recherche"
        >
          <i class="bi bi-x-circle-fill"></i>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      width: 100%;
      max-width: 360px;
    }
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .search-icon {
      position: absolute;
      left: 0.875rem;
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
      pointer-events: none;
    }
    .search-field {
      width: 100%;
      height: var(--control-height-md, 40px);
      padding: 0 2.25rem 0 2.35rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-full, 9999px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      transition: all var(--transition-fast);
    }
    .search-field:focus {
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--focus-ring);
    }
    .clear-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--neutral-400, #94a3b8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      font-size: 0.875rem;
    }
    .clear-btn:hover {
      color: var(--neutral-700, #334155);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  public readonly placeholder = input<string>('Rechercher...');
  public readonly search = output<string>();

  protected readonly query = signal<string>('');
  private debounceTimer: any = null;

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.query.set(val);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(val.trim());
    }, 300);
  }

  public clear(): void {
    this.query.set('');
    clearTimeout(this.debounceTimer);
    this.search.emit('');
  }
}
