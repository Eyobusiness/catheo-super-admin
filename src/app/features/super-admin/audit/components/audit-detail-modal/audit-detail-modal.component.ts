import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { AuditActionBadgeComponent } from '../audit-action-badge/audit-action-badge.component';
import { AuditLog } from '../../models/audit.model';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'mot_de_passe',
  'token',
  'secret',
  'hash',
  'api_key',
  'remember_token',
  'authorization',
  'key',
];

@Component({
  selector: 'app-audit-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    AuditActionBadgeComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="lg"
      (close)="onClose()"
    >
      @if (log()) {
        <div class="audit-detail-container">
          <!-- En-tête de synthèse -->
          <div class="summary-card">
            <div class="summary-item">
              <span class="label">Action</span>
              <div class="mt-1">
                <app-audit-action-badge [action]="log()!.action" size="md" />
              </div>
            </div>

            <div class="summary-item">
              <span class="label">Date & Heure</span>
              <span class="value font-medium">{{ formattedDate() }}</span>
            </div>

            <div class="summary-item">
              <span class="label">Auteur de l'action</span>
              <span class="value font-medium">{{ authorName() }}</span>
              @if (authorEmail()) {
                <span class="subtext">{{ authorEmail() }}</span>
              }
            </div>

            <div class="summary-item">
              <span class="label">Entité / Ressource</span>
              <span class="value font-medium">{{ log()!.entite_type }}</span>
              @if (log()!.entite_id) {
                <span class="subtext">ID : {{ log()!.entite_id }}</span>
              }
            </div>

            <div class="summary-item">
              <span class="label">Adresse IP</span>
              <span class="value font-mono">{{ log()!.ip_address || 'Non enregistrée' }}</span>
            </div>

            <div class="summary-item">
              <span class="label">Référence UUID</span>
              <span class="value font-mono font-xs">{{ log()!.id }}</span>
            </div>
          </div>

          @if (log()!.user_agent) {
            <div class="user-agent-box">
              <span class="label">User-Agent</span>
              <span class="ua-text font-mono font-xs">{{ log()!.user_agent }}</span>
            </div>
          }

          <!-- Diff Valeurs : Anciennes vs Nouvelles -->
          <div class="values-comparison">
            <div class="value-column">
              <div class="column-header">
                <i class="bi bi-clock-history me-1"></i>
                <span>Anciennes Valeurs</span>
              </div>
              <div class="code-box">
                @if (sanitizedOldValues()) {
                  <pre><code>{{ sanitizedOldValues() | json }}</code></pre>
                } @else {
                  <span class="empty-hint">Aucune ancienne valeur consignée.</span>
                }
              </div>
            </div>

            <div class="value-column">
              <div class="column-header">
                <i class="bi bi-check2-circle me-1"></i>
                <span>Nouvelles Valeurs</span>
              </div>
              <div class="code-box">
                @if (sanitizedNewValues()) {
                  <pre><code>{{ sanitizedNewValues() | json }}</code></pre>
                } @else {
                  <span class="empty-hint">Aucune nouvelle valeur consignée.</span>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <div modal-footer class="modal-actions">
        <app-btn variant="secondary" (btnClick)="onClose()">Fermer</app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .audit-detail-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .summary-card {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .label {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 600;
    }
    .value {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
    }
    .subtext {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
    }
    .font-medium {
      font-weight: 500;
    }
    .font-mono {
      font-family: monospace;
    }
    .font-xs {
      font-size: 0.75rem;
      word-break: break-all;
    }
    .mt-1 {
      margin-top: 0.25rem;
    }
    .user-agent-box {
      padding: 0.75rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .ua-text {
      color: var(--text-secondary, #475569);
      line-height: 1.4;
    }
    .values-comparison {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .values-comparison {
        grid-template-columns: 1fr;
      }
    }
    .value-column {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }
    .column-header {
      padding: 0.5rem 0.75rem;
      background-color: var(--bg-muted, #f8fafc);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      display: flex;
      align-items: center;
    }
    .me-1 {
      margin-right: 0.35rem;
    }
    .code-box {
      padding: 0.75rem;
      background-color: #ffffff;
      min-height: 120px;
      max-height: 240px;
      overflow-y: auto;
      font-size: 0.8125rem;
    }
    .code-box pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: monospace;
      color: #1e293b;
    }
    .empty-hint {
      color: var(--text-muted, #94a3b8);
      font-style: italic;
      font-size: 0.8125rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly log = input<AuditLog | null>(null);

  public readonly close = output<void>();

  protected readonly modalTitle = computed<string>(() => {
    const l = this.log();
    if (!l) return 'Détail de l’événement d’audit';
    return `Audit · ${l.action.toUpperCase()} sur ${l.entite_type}`;
  });

  protected readonly formattedDate = computed<string>(() => {
    const l = this.log();
    if (!l?.created_at) return '-';
    const d = new Date(l.created_at);
    return isNaN(d.getTime())
      ? l.created_at
      : `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`;
  });

  protected readonly authorName = computed<string>(() => {
    const l = this.log();
    return l?.user?.name || 'Système / Automatique';
  });

  protected readonly authorEmail = computed<string>(() => {
    return this.log()?.user?.email || '';
  });

  /**
   * Caviardage automatique et rigoureux de toutes données sensibles
   */
  protected readonly sanitizedOldValues = computed<Record<string, any> | null>(() => {
    return this.maskSensitiveData(this.log()?.anciennes_valeurs);
  });

  protected readonly sanitizedNewValues = computed<Record<string, any> | null>(() => {
    return this.maskSensitiveData(this.log()?.nouvelles_valeurs);
  });

  protected onClose(): void {
    this.close.emit();
  }

  private maskSensitiveData(data?: Record<string, any> | null): Record<string, any> | null {
    if (!data || typeof data !== 'object') return null;

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));

      if (isSensitive) {
        sanitized[key] = '********';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.maskSensitiveData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
