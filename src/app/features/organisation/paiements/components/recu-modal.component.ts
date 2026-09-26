import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PaiementPelerinage } from '../../pelerinages/models/pelerinage.model';
import { formatCfa } from '../../../../shared/utils/format.utils';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';

@Component({
  selector: 'app-recu-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Reçu de Paiement (Format Thermique)"
      size="md"
      (close)="onCancel()"
    >
      @if (paiement(); as p) {
        <!-- Sélecteur de format thermique 80mm ou 58mm -->
        <div class="format-selector-bar">
          <span class="selector-label"><i class="bi bi-printer mr-1"></i> Format d'impression thermique :</span>
          <div class="format-buttons">
            <button
              type="button"
              class="format-btn"
              [class.active]="selectedFormat() === '80mm'"
              (click)="selectedFormat.set('80mm')"
            >
              <strong>80 mm</strong> (Standard)
            </button>
            <button
              type="button"
              class="format-btn"
              [class.active]="selectedFormat() === '58mm'"
              (click)="selectedFormat.set('58mm')"
            >
              <strong>58 mm</strong> (Compact)
            </button>
          </div>
        </div>

        <div class="thermal-receipt-wrapper">
          <div
            class="thermal-receipt"
            [class.format-58mm]="selectedFormat() === '58mm'"
            [class.format-80mm]="selectedFormat() === '80mm'"
            id="printableRecu"
          >
            <!-- En-tête Organisation & Paroisse -->
            <div class="thermal-header">
              <div class="thermal-org-name">{{ orgName() }}</div>
              @if (paroisseName()) {
                <div class="thermal-paroisse">{{ paroisseName() }}</div>
              }
              @if (paroisseVille()) {
                <div class="thermal-sub">{{ paroisseVille() }}</div>
              }
              @if (orgPhone() || orgEmail()) {
                <div class="thermal-contact">
                  {{ orgPhone() ? 'Tél : ' + orgPhone() : '' }}
                  {{ orgPhone() && orgEmail() ? ' · ' : '' }}
                  {{ orgEmail() || '' }}
                </div>
              }
            </div>

            <div class="thermal-divider">
              {{ selectedFormat() === '58mm' ? '====================' : '================================' }}
            </div>

            <!-- Titre du ticket -->
            <div class="thermal-title">
              <span class="thermal-main-title">REÇU DE VERSEMENT</span>
              <span class="thermal-ref">N° {{ p.reference }}</span>
            </div>

            <div class="thermal-divider">
              {{ selectedFormat() === '58mm' ? '--------------------' : '--------------------------------' }}
            </div>

            <!-- Détails du versement -->
            <div class="thermal-body">
              <div class="thermal-line">
                <span class="lbl">Date/Heure :</span>
                <span class="val">{{ p.date_paiement ? (p.date_paiement | date: 'dd/MM/yyyy HH:mm') : (today | date: 'dd/MM/yyyy HH:mm') }}</span>
              </div>

              <div class="thermal-line">
                <span class="lbl">Campagne :</span>
                <span class="val bold">{{ campagneNom() || 'Pèlerinage' }}</span>
              </div>

              <div class="thermal-line">
                <span class="lbl">Participant :</span>
                <span class="val bold uppercase">{{ p.inscription ? (p.inscription.nom + ' ' + (p.inscription.prenoms || '')) : 'Pèlerin' }}</span>
              </div>

              @if (p.inscription; as insc) {
                @if (insc.reference) {
                  <div class="thermal-line">
                    <span class="lbl">Réf. Inscr. :</span>
                    <span class="val">{{ insc.reference }}</span>
                  </div>
                }

                @if (insc.telephone) {
                  <div class="thermal-line">
                    <span class="lbl">Contact :</span>
                    <span class="val">{{ insc.telephone }}</span>
                  </div>
                }
              }

              <div class="thermal-line">
                <span class="lbl">Mode Règl. :</span>
                <span class="val uppercase bold">{{ p.mode_paiement }}</span>
              </div>

              @if (p.observation) {
                <div class="thermal-line">
                  <span class="lbl">Observation :</span>
                  <span class="val">{{ p.observation }}</span>
                </div>
              }
            </div>

            <div class="thermal-divider">
              {{ selectedFormat() === '58mm' ? '====================' : '================================' }}
            </div>

            <!-- Montant versé en grand -->
            <div class="thermal-amount-section">
              <div class="thermal-amount-label">MONTANT PAYÉ</div>
              <div class="thermal-amount-value">{{ formatAmount(p.montant) }} FCFA</div>
            </div>

            <div class="thermal-divider">
              {{ selectedFormat() === '58mm' ? '--------------------' : '--------------------------------' }}
            </div>

            <!-- Caissier et bas de ticket -->
            <div class="thermal-footer">
              @if (p.caissier; as c) {
                <div class="thermal-cashier">
                  <span>Encaissé par : </span>
                  <span class="bold">{{ c.name }}</span>
                </div>
              }
              <div class="thermal-thanks">*** MERCI POUR VOTRE RÈGLEMENT ***</div>
              <div class="thermal-blessing">Que Dieu vous bénisse abondamment !</div>
              <div class="thermal-timestamp">Imprimé le {{ today | date: 'dd/MM/yyyy à HH:mm:ss' }}</div>
            </div>
          </div>
        </div>
      }

      <div modal-footer class="modal-footer-actions">
        <app-btn variant="secondary" (btnClick)="onCancel()">Fermer</app-btn>
        <app-btn
          variant="primary"
          icon="printer"
          (btnClick)="printRecu()"
        >
          Imprimer le ticket ({{ selectedFormat() }})
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .format-selector-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .selector-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-color, #334155);
    }

    .format-buttons {
      display: flex;
      gap: 0.35rem;
    }

    .format-btn {
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      background: #ffffff;
      color: var(--text-color, #475569);
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .format-btn:hover {
      background: var(--bg-surface-elevated, #f1f5f9);
    }

    .format-btn.active {
      background: var(--color-primary, #6366f1);
      border-color: var(--color-primary, #6366f1);
      color: #ffffff;
    }

    .thermal-receipt-wrapper {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
      background: var(--bg-surface-elevated, #f1f5f9);
      border-radius: var(--radius-md, 8px);
    }

    .thermal-receipt {
      width: 100%;
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace, sans-serif;
      line-height: 1.35;
      border: 1px dashed #94a3b8;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      transition: max-width 0.2s ease;
    }

    /* Style format 80mm */
    .thermal-receipt.format-80mm {
      max-width: 340px;
      padding: 1.25rem 1rem;
      font-size: 13px;
    }

    /* Style format 58mm */
    .thermal-receipt.format-58mm {
      max-width: 250px;
      padding: 0.85rem 0.6rem;
      font-size: 11px;
    }

    .thermal-receipt.format-58mm .thermal-org-name {
      font-size: 12px;
    }

    .thermal-receipt.format-58mm .thermal-main-title {
      font-size: 12px;
    }

    .thermal-receipt.format-58mm .thermal-amount-value {
      font-size: 15px;
    }

    .thermal-header {
      text-align: center;
      margin-bottom: 0.5rem;
    }

    .thermal-org-name {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .thermal-paroisse {
      font-size: 13px;
      font-weight: 700;
      margin-top: 2px;
    }

    .thermal-sub {
      font-size: 11px;
      color: #333333;
    }

    .thermal-contact {
      font-size: 11px;
      margin-top: 3px;
      color: #222222;
    }

    .thermal-divider {
      text-align: center;
      font-size: 11px;
      letter-spacing: 1px;
      color: #555555;
      margin: 0.35rem 0;
      white-space: nowrap;
      overflow: hidden;
    }

    .thermal-title {
      text-align: center;
      margin: 0.5rem 0;
    }

    .thermal-main-title {
      display: block;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .thermal-ref {
      display: block;
      font-size: 12px;
      font-weight: 700;
      margin-top: 2px;
    }

    .thermal-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin: 0.5rem 0;
    }

    .thermal-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 12px;
    }

    .thermal-receipt.format-58mm .thermal-line {
      font-size: 10px;
    }

    .thermal-line .lbl {
      color: #333333;
      flex-shrink: 0;
    }

    .thermal-line .val {
      text-align: right;
      word-break: break-word;
    }

    .thermal-amount-section {
      text-align: center;
      padding: 0.6rem 0;
      margin: 0.25rem 0;
      border-top: 1px solid #000000;
      border-bottom: 1px solid #000000;
    }

    .thermal-amount-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .thermal-amount-value {
      font-size: 18px;
      font-weight: 900;
      margin-top: 2px;
    }

    .thermal-footer {
      text-align: center;
      font-size: 11px;
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .thermal-receipt.format-58mm .thermal-footer {
      font-size: 9.5px;
    }

    .thermal-cashier {
      font-size: 11px;
    }

    .thermal-thanks {
      font-weight: 700;
      font-size: 11px;
      margin-top: 0.3rem;
    }

    .thermal-blessing {
      font-style: italic;
      font-size: 10px;
    }

    .thermal-timestamp {
      font-size: 9px;
      color: #555555;
      margin-top: 0.25rem;
    }

    .bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }

    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.75rem;
    }

    /* Styles d'impression thermique dynamique (80mm vs 58mm) */
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      body * {
        visibility: hidden;
      }
      #printableRecu, #printableRecu * {
        visibility: visible;
      }
      #printableRecu {
        position: fixed;
        left: 0;
        top: 0;
        margin: 0 auto !important;
        border: none !important;
        box-shadow: none !important;
        font-family: 'Courier New', Courier, monospace !important;
        color: #000000 !important;
        background: #ffffff !important;
      }
      #printableRecu.format-80mm {
        width: 78mm !important;
        max-width: 78mm !important;
        padding: 3mm !important;
        font-size: 11px !important;
      }
      #printableRecu.format-80mm .thermal-amount-value {
        font-size: 16px !important;
      }
      #printableRecu.format-80mm .thermal-org-name {
        font-size: 13px !important;
      }
      #printableRecu.format-58mm {
        width: 54mm !important;
        max-width: 54mm !important;
        padding: 2mm !important;
        font-size: 9.5px !important;
      }
      #printableRecu.format-58mm .thermal-amount-value {
        font-size: 14px !important;
      }
      #printableRecu.format-58mm .thermal-org-name {
        font-size: 11px !important;
      }
      #printableRecu.format-58mm .thermal-main-title {
        font-size: 11px !important;
      }
      #printableRecu.format-58mm .thermal-sub,
      #printableRecu.format-58mm .thermal-contact {
        font-size: 8.5px !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuModalComponent {
  private readonly orgContext = inject(OrganisationContextService);

  public readonly isOpen = input.required<boolean>();
  public readonly paiement = input<PaiementPelerinage | null>(null);
  public readonly campagneNom = input<string>('');

  public readonly close = output<void>();

  // Format thermique 80mm par défaut avec support 58mm
  public readonly selectedFormat = signal<'80mm' | '58mm'>('80mm');

  public readonly today = new Date();

  public readonly orgName = computed(() => {
    return this.orgContext.context()?.nom || 'CATHEO ESPACE PASTORAL';
  });

  public readonly paroisseName = computed(() => {
    return this.orgContext.paroisse()?.nom_paroisse || '';
  });

  public readonly paroisseVille = computed(() => {
    const p = this.orgContext.paroisse();
    if (!p) return '';
    const parts = [p.ville, p.diocese].filter(Boolean);
    return parts.join(' - ');
  });

  public readonly orgPhone = computed(() => {
    const ctx = this.orgContext.context();
    return ctx?.contact?.telephone || ctx?.responsable?.telephone || '';
  });

  public readonly orgEmail = computed(() => {
    const ctx = this.orgContext.context();
    return ctx?.contact?.email || '';
  });

  public formatAmount(val: number): string {
    return formatCfa(val);
  }

  public printRecu(): void {
    window.print();
  }

  public onCancel(): void {
    this.close.emit();
  }
}


