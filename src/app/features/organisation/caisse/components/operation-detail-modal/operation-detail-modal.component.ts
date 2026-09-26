import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { OperationTypeBadgeComponent } from '../operation-type-badge/operation-type-badge.component';
import { OperationStatusBadgeComponent } from '../operation-status-badge/operation-status-badge.component';
import { OperationCaisse } from '../../models/caisse.model';
import { formatCfa } from '../../../../../shared/utils/format.utils';

@Component({
  selector: 'app-operation-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    OperationTypeBadgeComponent,
    OperationStatusBadgeComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Détail de l'opération de caisse"
      size="md"
      (close)="onClose()"
    >
      @if (operation(); as op) {
        <div class="operation-detail" id="printable-operation-receipt">
          <div class="receipt-header">
            <div class="receipt-badge-line">
              <app-operation-type-badge [type]="op.type_operation" />
              <app-operation-status-badge [statut]="op.statut" />
            </div>
            <div class="receipt-amount" [class.is-sortie]="op.type_operation === 'sortie'">
              {{ op.type_operation === 'sortie' ? '-' : '+' }} {{ formatAmount(op.montant) }}
            </div>
            <div class="receipt-ref">
              Référence : <strong>{{ op.reference }}</strong>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Date & Heure</span>
              <span class="detail-value">
                {{ op.date_operation ? (op.date_operation | date: 'dd/MM/yyyy HH:mm') : '—' }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Libellé / Origine</span>
              <span class="detail-value">{{ op.libelle || '—' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Mode de règlement</span>
              <span class="detail-value mode-badge">{{ op.mode_reglement || '—' }}</span>
            </div>

            @if (op.operateur) {
              <div class="detail-row">
                <span class="detail-label">Enregistré par</span>
                <span class="detail-value">{{ op.operateur.name }}</span>
              </div>
            }

            <div class="detail-row">
              <span class="detail-label">Devise</span>
              <span class="detail-value">{{ op.devise || 'XOF' }}</span>
            </div>
          </div>
        </div>
      }

      <div modal-footer class="modal-footer-actions">
        <app-btn variant="secondary" icon="printer" (btnClick)="printReceipt()">
          Imprimer reçu
        </app-btn>
        <app-btn variant="primary" (btnClick)="onClose()">
          Fermer
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .operation-detail {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .receipt-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.25rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      gap: 0.5rem;
    }
    .receipt-badge-line {
      display: flex;
      gap: 0.5rem;
    }
    .receipt-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--success-600, #16a34a);
      letter-spacing: -0.02em;
    }
    .receipt-amount.is-sortie {
      color: var(--danger-600, #dc2626);
    }
    .receipt-ref {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      background: var(--bg-surface, #ffffff);
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--border-color, #e2e8f0);
      font-size: 0.875rem;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-label {
      font-weight: 500;
      color: var(--text-muted, #64748b);
    }
    .detail-value {
      font-weight: 600;
      color: var(--text-color, #1e293b);
      text-align: right;
    }
    .mode-badge {
      text-transform: capitalize;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-operation-receipt, #printable-operation-receipt * {
        visibility: visible;
      }
      #printable-operation-receipt {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly operation = input<OperationCaisse | null>(null);
  public readonly close = output<void>();

  public formatAmount(amount: number): string {
    return formatCfa(amount);
  }

  public onClose(): void {
    this.close.emit();
  }

  public printReceipt(): void {
    window.print();
  }
}
