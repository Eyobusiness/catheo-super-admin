import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { TrashItem } from '../../../trash/models/trash.model';

@Component({
  selector: 'app-dashboard-trash-preview',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <app-card title="Corbeille & Purge" subtitle="Aperçu des éléments supprimés et restaurables">
      <div class="trash-preview-content">
        <div class="trash-icon-wrap">
          <i class="bi bi-trash3-fill"></i>
        </div>

        <div class="trash-counters-row">
          <div class="counter-box total">
            <span class="count-num">{{ totalDeleted() }}</span>
            <span class="count-lbl">Total Supprimés</span>
          </div>

          <div class="counter-box restorable">
            <span class="count-num">{{ restorableCount() }}</span>
            <span class="count-lbl">Restaurables</span>
          </div>

          <div class="counter-box pending">
            <span class="count-num">{{ toVerifyCount() }}</span>
            <span class="count-lbl">À vérifier</span>
          </div>
        </div>

        @if (recentDeleted().length > 0) {
          <div class="recent-list">
            <span class="recent-header">Dernières suppressions :</span>
            @for (item of recentDeleted().slice(0, 3); track item.id) {
              <div class="recent-item">
                <span class="item-name">{{ item.element }}</span>
                <span class="item-module">{{ item.module }}</span>
              </div>
            }
          </div>
        }

        <div class="trash-action-row">
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="openTrash()"
            class="w-full"
          >
            <i class="bi bi-arrow-up-right-square me-1"></i>
            <span>Ouvrir la corbeille</span>
          </app-btn>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .trash-preview-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .trash-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md, 8px);
      background: #fef2f2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin: 0 auto;
    }
    .trash-counters-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
    }
    .counter-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 0.5rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      text-align: center;
    }
    .counter-box.total {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .counter-box.restorable {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .counter-box.pending {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .count-num {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      line-height: 1.1;
    }
    .counter-box.restorable .count-num { color: #1d4ed8; }
    .counter-box.pending .count-num { color: #b45309; }
    .count-lbl {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      text-transform: uppercase;
      margin-top: 0.25rem;
    }
    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      background: var(--neutral-50, #f8fafc);
      padding: 0.75rem;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .recent-header {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted, #94a3b8);
      margin-bottom: 0.15rem;
    }
    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      gap: 0.5rem;
    }
    .item-name {
      color: var(--text-primary, #0f172a);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-module {
      font-size: 0.6875rem;
      padding: 0.1rem 0.35rem;
      background: #e2e8f0;
      border-radius: 3px;
      color: #334155;
    }
    .trash-action-row {
      margin-top: 0.25rem;
    }
    .w-full {
      width: 100%;
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTrashPreviewComponent {
  private readonly router = inject(Router);

  public readonly totalDeleted = input<number>(0);
  public readonly restorableCount = input<number>(0);
  public readonly toVerifyCount = input<number>(0);
  public readonly recentDeleted = input<TrashItem[]>([]);

  protected openTrash(): void {
    this.router.navigate(['/super-admin/trash']);
  }
}
