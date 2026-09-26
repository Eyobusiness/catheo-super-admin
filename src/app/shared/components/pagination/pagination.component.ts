import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PageChangeEvent } from '../../models/pagination.model';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (total() > 0) {
      <div class="pagination-container" aria-label="Pagination">
        <div class="pagination-info">
          <span>Affichage de <strong>{{ from() }}</strong> à <strong>{{ to() }}</strong> sur <strong>{{ total() }}</strong> éléments</span>
        </div>

        <div class="pagination-controls">
          <!-- Per page selector -->
          @if (showPerPage()) {
            <div class="per-page-select">
              <label for="per-page-sel" class="per-page-label">Par page :</label>
              <select
                id="per-page-sel"
                [value]="perPage()"
                (change)="onPerPageChange($event)"
                class="per-page-dropdown"
                aria-label="Nombre d'éléments par page"
              >
                @for (size of perPageOptions(); track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
            </div>
          }

          <!-- Previous Button -->
          <button
            type="button"
            [disabled]="currentPage() <= 1"
            (click)="goToPage(currentPage() - 1)"
            class="page-btn page-nav-btn"
            aria-label="Page précédente"
          >
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </button>

          <!-- Numeric Page Links -->
          <div class="page-numbers">
            @for (p of displayedPages(); track p) {
              @if (p === -1) {
                <span class="page-ellipsis" aria-hidden="true">…</span>
              } @else {
                <button
                  type="button"
                  [class.is-active]="p === currentPage()"
                  [attr.aria-current]="p === currentPage() ? 'page' : null"
                  (click)="goToPage(p)"
                  class="page-btn page-num-btn"
                >
                  {{ p }}
                </button>
              }
            }
          </div>

          <!-- Next Button -->
          <button
            type="button"
            [disabled]="currentPage() >= totalPages()"
            (click)="goToPage(currentPage() + 1)"
            class="page-btn page-nav-btn"
            aria-label="Page suivante"
          >
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-surface, #ffffff);
      border-top: 1px solid var(--border-color-light, #f1f5f9);
      flex-wrap: wrap;
    }
    .pagination-info {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .pagination-info strong {
      color: var(--text-primary, #0f172a);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .per-page-select {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-right: 0.75rem;
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .per-page-dropdown {
      height: 32px;
      padding: 0 0.5rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      cursor: pointer;
    }
    .page-numbers {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .page-btn:hover:not(:disabled) {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--text-primary, #0f172a);
    }
    .page-btn.is-active {
      background: var(--primary-600, #0284c7);
      border-color: var(--primary-600, #0284c7);
      color: #ffffff;
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
    .page-ellipsis {
      padding: 0 0.25rem;
      color: var(--text-muted, #64748b);
    }
    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  public readonly currentPage = input<number>(1);
  public readonly perPage = input<number>(15);
  public readonly total = input<number>(0);
  public readonly perPageOptions = input<number[]>([10, 15, 25, 50, 100]);
  public readonly showPerPage = input<boolean>(true);

  public readonly pageChange = output<PageChangeEvent>();

  public readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.total() / this.perPage()));
  });

  protected readonly from = computed(() => {
    if (this.total() === 0) return 0;
    return (this.currentPage() - 1) * this.perPage() + 1;
  });

  protected readonly to = computed(() => {
    return Math.min(this.total(), this.currentPage() * this.perPage());
  });

  protected readonly displayedPages = computed<(number | -1)[]>(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: (number | -1)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1);

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push(-1);
    pages.push(total);

    return pages;
  });

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.pageChange.emit({ page, perPage: this.perPage() });
  }

  protected onPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPerPage = parseInt(target.value, 10);
    this.pageChange.emit({ page: 1, perPage: newPerPage });
  }
}
