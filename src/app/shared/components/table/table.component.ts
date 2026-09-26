import { ChangeDetectionStrategy, Component, TemplateRef, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TableColumn, TableSort } from '../../models/table.model';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="table-container">
      <div class="table-responsive">
        <table class="app-data-table" [attr.aria-busy]="loading()">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  [style.width]="col.width || null"
                  [style.text-align]="col.align || 'left'"
                  [class.is-sortable]="col.sortable"
                  (click)="onColumnHeaderClick(col)"
                >
                  <div class="th-content" [style.justify-content]="col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'">
                    <span>{{ col.label }}</span>
                    @if (col.sortable) {
                      <span class="sort-indicator" aria-hidden="true">
                        @if (currentSort()?.column === col.key) {
                          <i [class]="currentSort()?.direction === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down'"></i>
                        } @else {
                          <i class="bi bi-arrow-down-up sort-idle"></i>
                        }
                      </span>
                    }
                  </div>
                </th>
              }
              @if (hasActions()) {
                <th class="th-actions" style="text-align: right; width: 120px;">Actions</th>
              }
            </tr>
          </thead>

          <tbody>
            @if (loading()) {
              @for (n of [1, 2, 3, 4, 5]; track n) {
                <tr class="loading-skeleton-row">
                  @for (col of columns(); track col.key) {
                    <td><div class="skeleton-cell"></div></td>
                  }
                  @if (hasActions()) {
                    <td><div class="skeleton-cell" style="width: 60px; margin-left: auto;"></div></td>
                  }
                </tr>
              }
            } @else if (data().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length + (hasActions() ? 1 : 0)" class="empty-table-cell">
                  <div class="empty-table-content">
                    <i [class]="emptyIcon() + ' empty-icon'"></i>
                    <p class="empty-title">{{ emptyMessage() }}</p>
                    <p class="empty-sub">{{ emptySubtitle() }}</p>
                  </div>
                </td>
              </tr>
            } @else {
              @for (row of data(); track trackByFn(row)) {
                <tr class="table-row">
                  @for (col of columns(); track col.key) {
                    <td [style.text-align]="col.align || 'left'">
                      @if (isStatusOrBadgeColumn(col)) {
                        <span class="table-badge" [class]="getBadgeClass(formatCellValue(col, row))">
                          {{ formatCellValue(col, row) }}
                        </span>
                      } @else {
                        {{ formatCellValue(col, row) }}
                      }
                    </td>
                  }
                  @if (hasActions() && rowActionsTemplate()) {
                    <td class="td-actions" style="text-align: right;">
                      <ng-container *ngTemplateOutlet="rowActionsTemplate()!; context: { $implicit: row }" />
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .table-container {
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 14px);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .app-data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    thead tr {
      background-color: var(--neutral-50, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    th {
      padding: 0.875rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #64748b);
      white-space: nowrap;
      user-select: none;
    }
    th.is-sortable {
      cursor: pointer;
    }
    th.is-sortable:hover {
      color: var(--primary-600, #0284c7);
    }
    .th-content {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .sort-indicator {
      font-size: 0.8rem;
    }
    .sort-idle {
      opacity: 0.3;
    }
    tbody tr.table-row {
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      transition: background-color var(--transition-fast);
    }
    tbody tr.table-row:last-child {
      border-bottom: none;
    }
    tbody tr.table-row:hover {
      background-color: var(--neutral-50, #f8fafc);
    }
    td {
      padding: 1rem 1.25rem;
      color: var(--text-primary, #0f172a);
      vertical-align: middle;
    }
    /* Empty State */
    .empty-table-cell {
      padding: 3.5rem 1.5rem;
      text-align: center;
    }
    .empty-table-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-icon {
      font-size: 2.25rem;
      color: var(--neutral-400, #94a3b8);
      margin-bottom: 0.75rem;
    }
    .empty-title {
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
      font-size: 1rem;
    }
    .empty-sub {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      margin: 0.25rem 0 0 0;
    }
    /* Skeletons */
    .skeleton-cell {
      height: 16px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      border-radius: var(--radius-sm, 6px);
      animation: skeleton-shimmer 1.5s infinite;
    }
    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    /* Table Status Badges */
    .table-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--radius-full, 9999px);
      line-height: 1.2;
      text-transform: capitalize;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .badge-success {
      background: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
      border: 1px solid var(--success-200, #a7f3d0);
    }
    .badge-danger {
      background: var(--danger-50, #fef2f2);
      color: var(--danger-700, #b91c1c);
      border: 1px solid var(--danger-200, #fecaca);
    }
    .badge-warning {
      background: var(--warning-50, #fffbeb);
      color: var(--warning-700, #b45309);
      border: 1px solid var(--warning-200, #fde68a);
    }
    .badge-primary {
      background: var(--primary-50, #eff6ff);
      color: var(--primary-700, #0369a1);
      border: 1px solid var(--primary-200, #bfdbfe);
    }
    .badge-neutral {
      background: var(--neutral-100, #f1f5f9);
      color: var(--neutral-700, #334155);
      border: 1px solid var(--neutral-200, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T = any> {
  public readonly columns = input.required<TableColumn<T>[]>();
  public readonly data = input<T[]>([]);
  public readonly loading = input<boolean>(false);
  public readonly emptyMessage = input<string>('Aucune donnée trouvée');
  public readonly emptySubtitle = input<string>('Aucun élément ne correspond à ces critères.');
  public readonly emptyIcon = input<string>('bi bi-inbox');
  public readonly hasActions = input<boolean>(false);
  public readonly rowActionsTemplate = input<TemplateRef<any> | null>(null);

  public readonly sortChange = output<TableSort>();

  protected readonly currentSort = signal<TableSort | null>(null);

  protected trackByFn(row: any): any {
    return row.id || row.uuid || row.code || row;
  }

  protected onColumnHeaderClick(col: TableColumn<T>): void {
    if (!col.sortable) return;

    const current = this.currentSort();
    let nextDirection: 'asc' | 'desc' = 'asc';

    if (current && current.column === col.key) {
      nextDirection = current.direction === 'asc' ? 'desc' : 'asc';
    }

    const sort: TableSort = { column: col.key, direction: nextDirection };
    this.currentSort.set(sort);
    this.sortChange.emit(sort);
  }

  protected isStatusOrBadgeColumn(col: TableColumn<T>): boolean {
    if (col.badge) return true;
    const k = (col.key || '').toLowerCase();
    return k === 'statut' || k.includes('statut') || k.endsWith('_statut');
  }

  protected getBadgeClass(val: string): string {
    const v = (val || '').toLowerCase().trim();
    if (['actif', 'active', 'valide', 'confirme', 'confirmee', 'payee', 'solde', 'soldé', 'presente', 'présente', 'terminee', 'terminée'].includes(v)) {
      return 'badge-success';
    }
    if (['inactif', 'inactive', 'annule', 'annulée', 'annulee', 'suspendu', 'suspendue', 'absente', 'revoque', 'révoqué', 'rejete', 'rejeté'].includes(v)) {
      return 'badge-danger';
    }
    if (['en_attente', 'en attente', 'partiel', 'partielle', 'partiellement_payee', 'partiellement payée', 'brouillon', 'planifiee', 'planifiée', 'ouverte'].includes(v)) {
      return 'badge-warning';
    }
    if (['en_cours', 'en cours', 'prevue', 'prévue'].includes(v)) {
      return 'badge-primary';
    }
    return 'badge-neutral';
  }

  protected formatCellValue(col: TableColumn<T>, row: any): string {
    const rawVal = row[col.key];
    if (col.formatter) {
      return col.formatter(rawVal, row);
    }
    if (rawVal === null || rawVal === undefined || rawVal === '') {
      return '-';
    }
    return String(rawVal);
  }
}
