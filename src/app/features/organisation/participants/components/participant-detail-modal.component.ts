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
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatCfa } from '../../../../shared/utils/format.utils';
import {
  InscriptionPelerinage,
  PaiementPelerinage,
  ParticipationStatut,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-participant-detail-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      size="lg"
      (close)="onCancel()"
    >
      @if (participant(); as p) {
        <div class="participant-modal-body">
          <!-- 1. En-tête du participant -->
          <div class="participant-header-banner">
            <div class="avatar-box" [class.avatar-f]="p.sexe === 'F'">
              <i class="bi bi-person-fill"></i>
            </div>
            <div class="participant-title-info">
              <h3 class="participant-name">{{ p.nom_complet || (p.nom + ' ' + p.prenoms) }}</h3>
              <div class="participant-meta-row">
                <span class="ref-tag">Réf: <code>{{ p.reference }}</code></span>
                <span class="status-pill" [class]="'status-' + (p.statut_inscription || 'confirmee')">
                  {{ p.statut_inscription || 'Confirmé' }}
                </span>
                <span class="participation-pill" [class]="'part-' + (p.statut_participation || 'inscrit')">
                  {{ p.statut_participation || 'Inscrit' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Synthèse Financière -->
          <div class="finance-grid mt-4">
            <div class="finance-card">
              <span class="finance-label">Tarif appliqué</span>
              <span class="finance-value">{{ formatAmount(p.montant) }} F</span>
              <span class="finance-sub">{{ p.tarif?.libelle || 'Tarif standard' }}</span>
            </div>

            <div class="finance-card">
              <span class="finance-label">Total versé</span>
              <span class="finance-value text-success font-bold">{{ formatAmount(p.montant_paye) }} F</span>
              <span class="finance-sub">{{ p.paiements?.length || 0 }} versement(s)</span>
            </div>

            <div class="finance-card">
              <span class="finance-label">Reste à payer</span>
              <span class="finance-value font-bold" [class.text-danger]="resteAPayer(p) > 0" [class.text-success]="resteAPayer(p) === 0">
                {{ formatAmount(resteAPayer(p)) }} F
              </span>
              <span class="finance-sub">
                {{ resteAPayer(p) === 0 ? 'Solde intégralement payé' : 'Solde restant dû' }}
              </span>
            </div>
          </div>

          <!-- 3. Coordonnées & Détails -->
          <div class="details-section mt-4">
            <h4 class="section-title">Informations Personnelles</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="item-label">Genre :</span>
                <span class="item-val">{{ p.sexe === 'M' ? 'Masculin' : 'Féminin' }}</span>
              </div>
              <div class="info-item">
                <span class="item-label">Âge :</span>
                <span class="item-val">{{ p.age ? (p.age + ' ans') : 'Non renseigné' }}</span>
              </div>
              <div class="info-item">
                <span class="item-label">Téléphone :</span>
                <span class="item-val font-semibold">{{ p.telephone || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="item-label">Adresse :</span>
                <span class="item-val">{{ p.adresse || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="item-label">Taille kit / t-shirt :</span>
                <span class="item-val">{{ p.taille || 'Standard' }}</span>
              </div>
              <div class="info-item">
                <span class="item-label">Date d'inscription :</span>
                <span class="item-val">{{ p.date_inscription ? (p.date_inscription | date: 'dd/MM/yyyy HH:mm') : (p.created_at | date: 'dd/MM/yyyy') }}</span>
              </div>
            </div>

            @if (p.observation) {
              <div class="remarques-box mt-3">
                <span class="remarques-label"><i class="bi bi-chat-quote mr-1"></i> Remarques particulières :</span>
                <p class="remarques-text">{{ p.observation }}</p>
              </div>
            }
          </div>

          <!-- 4. Historique des Règlements & Reçus -->
          <div class="details-section mt-4">
            <h4 class="section-title">Versements & Reçus de Caisse</h4>
            @if (p.paiements && p.paiements.length > 0) {
              <div class="paiements-table-wrap">
                <table class="simple-table">
                  <thead>
                    <tr>
                      <th>Réf. Reçu</th>
                      <th>Date</th>
                      <th>Mode</th>
                      <th class="text-right">Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (pay of p.paiements; track pay.id) {
                      <tr>
                        <td><code>{{ pay.reference }}</code></td>
                        <td>{{ pay.date_paiement | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ pay.mode_paiement }}</td>
                        <td class="text-right font-bold text-success">+{{ formatAmount(pay.montant) }} F</td>
                        <td>
                          <span class="badge-mini status-valide">Validé</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-paiements">
                <i class="bi bi-wallet-fill text-muted"></i>
                <span>Aucun versement n'a encore été enregistré pour ce participant.</span>
              </div>
            }
          </div>

          <!-- 5. Mise à jour de la présence / participation -->
          <div class="participation-action-box mt-4">
            <span class="action-label">Pointage & Statut de participation :</span>
            <div class="action-btn-group">
              <button
                type="button"
                class="btn-part"
                [class.btn-part-active]="p.statut_participation === 'prevue'"
                (click)="updateParticipation('prevue')"
              >
                Prévue
              </button>
              <button
                type="button"
                class="btn-part btn-present"
                [class.btn-part-active]="p.statut_participation === 'presente'"
                (click)="updateParticipation('presente')"
              >
                <i class="bi bi-check-lg mr-1"></i> Présente
              </button>
              <button
                type="button"
                class="btn-part btn-absent"
                [class.btn-part-active]="p.statut_participation === 'absente'"
                (click)="updateParticipation('absente')"
              >
                <i class="bi bi-x-lg mr-1"></i> Absente
              </button>
            </div>
          </div>
        </div>
      }

      <div modal-footer class="modal-footer-actions">
        <app-btn variant="secondary" (btnClick)="onCancel()">Fermer</app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .participant-modal-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .participant-header-banner {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }
    .avatar-box {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--primary-100, #dbeafe);
      color: var(--primary-700, #1d4ed8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .avatar-f {
      background: #fce7f3;
      color: #be185d;
    }
    .participant-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .participant-meta-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.35rem;
      flex-wrap: wrap;
    }
    .ref-tag {
      font-size: 0.8rem;
      color: var(--text-secondary, #475569);
    }
    .status-pill,
    .participation-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      text-transform: capitalize;
    }
    .status-confirmee,
    .status-valide {
      background: #dcfce7;
      color: #15803d;
    }
    .status-annulee {
      background: #fee2e2;
      color: #b91c1c;
    }
    .part-inscrit {
      background: #eff6ff;
      color: #1d4ed8;
    }
    .part-present {
      background: #dcfce7;
      color: #15803d;
    }
    .part-absent {
      background: #fef3c7;
      color: #b45309;
    }
    .part-desiste {
      background: #f1f5f9;
      color: #64748b;
    }
    .finance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .finance-grid {
        grid-template-columns: 1fr;
      }
    }
    .finance-card {
      padding: 1rem;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .finance-label {
      font-size: 0.8rem;
      color: var(--text-secondary, #64748b);
    }
    .finance-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .finance-sub {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.35rem;
      margin-bottom: 0.75rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 0.35rem 0;
      border-bottom: 1px dashed var(--border-color-light, #f1f5f9);
    }
    .item-label {
      color: var(--text-secondary, #64748b);
    }
    .item-val {
      color: var(--text-primary, #0f172a);
    }
    .remarques-box {
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-left: 3px solid var(--primary-500, #3b82f6);
      border-radius: 4px;
    }
    .remarques-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .remarques-text {
      font-size: 0.85rem;
      color: var(--text-secondary, #475569);
      margin: 0.25rem 0 0 0;
    }
    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .simple-table th {
      background: #f8fafc;
      padding: 0.6rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .simple-table td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
    }
    .empty-paiements {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: var(--radius-md, 8px);
      color: var(--text-muted, #64748b);
      font-size: 0.85rem;
      justify-content: center;
    }
    .participation-action-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      flex-wrap: wrap;
    }
    .action-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .action-btn-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .btn-part {
      padding: 0.4rem 0.85rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background: #ffffff;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-part:hover {
      background: #f1f5f9;
    }
    .btn-part-active {
      background: var(--primary-600, #2563eb) !important;
      color: #ffffff !important;
      border-color: var(--primary-600, #2563eb) !important;
    }
    .btn-present.btn-part-active {
      background: #16a34a !important;
      border-color: #16a34a !important;
    }
    .btn-absent.btn-part-active {
      background: #d97706 !important;
      border-color: #d97706 !important;
    }
    .btn-desiste.btn-part-active {
      background: #64748b !important;
      border-color: #64748b !important;
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.75rem;
    }
    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantDetailModalComponent {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input.required<boolean>();
  public readonly participant = input<InscriptionPelerinage | null>(null);
  public readonly campagneId = input<string | number>('');

  public readonly close = output<void>();
  public readonly updated = output<InscriptionPelerinage>();

  public readonly isUpdating = signal<boolean>(false);

  public readonly modalTitle = computed(() => {
    const p = this.participant();
    return p ? `Fiche Participant — ${p.nom_complet || (p.nom + ' ' + p.prenoms)}` : 'Détail du Participant';
  });

  public resteAPayer(p: InscriptionPelerinage): number {
    return Math.max(0, (p.montant || 0) - (p.montant_paye || 0));
  }

  public formatAmount(val?: number): string {
    return formatCfa(val || 0);
  }

  public updateParticipation(statut: ParticipationStatut): void {
    const p = this.participant();
    const cid = this.campagneId() || p?.campagne_pelerinage_id;
    if (!p || !cid) return;

    this.isUpdating.set(true);
    this.pelerinageService.updateParticipation(cid, p.id, statut).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        this.toast.success(
          'Présence mise à jour',
          `Le statut de participation est désormais : ${statut}.`
        );
        this.updated.emit(res);
      },
      error: () => {
        this.isUpdating.set(false);
        this.toast.error('Erreur', 'Impossible de mettre à jour le statut.');
      },
    });
  }

  public onCancel(): void {
    this.close.emit();
  }
}
