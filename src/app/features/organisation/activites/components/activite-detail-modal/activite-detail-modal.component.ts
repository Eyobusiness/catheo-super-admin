import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ActiviteStatusBadgeComponent } from '../activite-status-badge/activite-status-badge.component';
import { Activite } from '../../models/activite.model';

@Component({
  selector: 'app-activite-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    ActiviteStatusBadgeComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle"
      size="lg"
      (close)="onClose()"
    >
      @if (activite(); as a) {
        <div class="detail-container">
          <!-- Carte En-tête Activité -->
          <div class="activity-header-card">
            <div class="icon-circle">
              <i class="bi bi-calendar-event" aria-hidden="true"></i>
            </div>
            <div class="activity-meta">
              <div class="title-row">
                <h3 class="activity-title">{{ a.titre }}</h3>
                <app-activite-status-badge [statut]="a.statut" />
              </div>
              <div class="badges-row mt-1">
                @if (a.code) {
                  <span class="code-badge">{{ a.code }}</span>
                }
                @if (a.type_activite) {
                  <span class="type-pill">
                    <i class="bi bi-tag mr-1" aria-hidden="true"></i>
                    {{ a.type_activite }}
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Barre de progression de l'exécution -->
          <div class="execution-progress-card mt-3">
            <div class="progress-meta">
              <span class="progress-label">
                <i class="bi bi-graph-up-arrow mr-1 text-primary" aria-hidden="true"></i>
                Taux d'exécution
              </span>
              <span class="progress-percent font-bold">{{ a.taux_execution }}%</span>
            </div>
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                [style.width.%]="a.taux_execution"
                [class.bg-success]="a.taux_execution === 100"
                [class.bg-primary]="a.taux_execution < 100"
              ></div>
            </div>
          </div>

          <!-- Grille d'informations -->
          <div class="info-grid mt-4">
            <!-- Bloc 1 : Dates & Lieu -->
            <div class="info-card">
              <h4 class="card-section-title">
                <i class="bi bi-geo-alt-fill mr-2 text-primary" aria-hidden="true"></i>
                Date & Lieu
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Date de début</span>
                  <span class="info-value">{{ a.date_debut | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date de fin</span>
                  <span class="info-value">
                    {{ a.date_fin ? (a.date_fin | date:'dd/MM/yyyy HH:mm') : 'Non définie' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Lieu</span>
                  <span class="info-value">{{ a.lieu || 'Non renseigné' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type d'activité</span>
                  <span class="info-value">{{ a.type_activite || 'Générale' }}</span>
                </div>
              </div>
            </div>

            <!-- Bloc 2 : Responsable Pastoral -->
            <div class="info-card">
              <h4 class="card-section-title">
                <i class="bi bi-person-badge-fill mr-2 text-primary" aria-hidden="true"></i>
                Responsable Désigné
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Responsable</span>
                  <span class="info-value">
                    {{ a.responsable?.nom_complet || 'Non désigné' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Rôle / Fonction</span>
                  <span class="info-value">
                    {{ a.responsable?.fonction || 'Membre' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Téléphone</span>
                  <span class="info-value">
                    {{ a.responsable?.telephone || '—' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Statut activité</span>
                  <span class="info-value">
                    <app-activite-status-badge [statut]="a.statut" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          @if (a.description) {
            <div class="text-block-card mt-3">
              <h4 class="card-section-title">
                <i class="bi bi-card-text mr-2 text-primary" aria-hidden="true"></i>
                Description
              </h4>
              <p class="text-block-content">{{ a.description }}</p>
            </div>
          }

          <!-- Observation -->
          @if (a.observation) {
            <div class="text-block-card mt-3">
              <h4 class="card-section-title">
                <i class="bi bi-chat-left-text mr-2 text-primary" aria-hidden="true"></i>
                Observations Pastorales
              </h4>
              <p class="text-block-content">{{ a.observation }}</p>
            </div>
          }
        </div>
      }

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onClose()">Fermer</app-btn>
        @if (canEdit() && activite(); as a) {
          <app-btn variant="primary" icon="pencil" (btnClick)="onEdit(a)">
            Modifier
          </app-btn>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .detail-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .activity-header-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }

    .icon-circle {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-full, 9999px);
      background: var(--primary-50, #eff6ff);
      color: var(--primary-600, #2563eb);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid var(--primary-200, #bfdbfe);
    }

    .activity-meta {
      flex: 1;
    }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .activity-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .code-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      background: #e2e8f0;
      color: #334155;
      border-radius: 4px;
    }

    .type-pill {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
    }

    .execution-progress-card {
      padding: 0.875rem 1rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }

    .progress-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      color: var(--text-secondary, #64748b);
      font-weight: 500;
    }

    .progress-percent {
      color: var(--text-primary, #0f172a);
    }

    .progress-bar-track {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      transition: width var(--transition-normal, 250ms);
    }

    .bg-primary {
      background-color: var(--primary-600, #2563eb);
    }

    .bg-success {
      background-color: var(--success-600, #16a34a);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .info-card,
    .text-block-card {
      padding: 1rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }

    .card-section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0 0 0.75rem 0;
      display: flex;
      align-items: center;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      font-size: 0.85rem;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: var(--text-secondary, #64748b);
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary, #0f172a);
      font-weight: 600;
      text-align: right;
    }

    .text-block-content {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      line-height: 1.5;
    }

    .modal-actions-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .text-primary {
      color: var(--primary-600, #2563eb);
    }

    .font-bold {
      font-weight: 700;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiviteDetailModalComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly activite = input<Activite | null>(null);
  public readonly canEdit = input<boolean>(false);

  public readonly close = output<void>();
  public readonly edit = output<Activite>();

  protected readonly modalTitle = 'Fiche Activité Pastorale';

  public onClose(): void {
    this.close.emit();
  }

  public onEdit(a: Activite): void {
    this.edit.emit(a);
  }
}
