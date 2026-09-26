import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { MembreStatusBadgeComponent } from '../membre-status-badge/membre-status-badge.component';
import { Membre } from '../../models/membre.model';

@Component({
  selector: 'app-membre-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    MembreStatusBadgeComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle"
      size="lg"
      (close)="onClose()"
    >
      @if (membre(); as m) {
        <div class="detail-container">
          <!-- Carte En-tête Profil -->
          <div class="profile-header-card">
            <div class="avatar-circle">
              {{ m.prenoms.charAt(0) }}{{ m.nom.charAt(0) }}
            </div>
            <div class="profile-meta">
              <div class="name-row">
                <h3 class="profile-name">{{ m.nom_complet }}</h3>
                <app-membre-status-badge [statut]="m.statut" />
              </div>
              <p class="profile-role">
                <i class="bi bi-person-badge mr-1" aria-hidden="true"></i>
                {{ m.fonction || 'Membre de l’organisation' }}
              </p>
            </div>
          </div>

          <!-- Grille d'informations -->
          <div class="info-grid mt-4">
            <!-- Bloc 1 : Coordonnées -->
            <div class="info-card">
              <h4 class="card-section-title">
                <i class="bi bi-telephone-fill mr-2 text-primary" aria-hidden="true"></i>
                Coordonnées
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Téléphone</span>
                  <span class="info-value">{{ m.telephone || 'Non renseigné' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ m.email || 'Non renseigné' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Quartier</span>
                  <span class="info-value">{{ m.quartier || 'Non renseigné' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Adresse</span>
                  <span class="info-value">{{ m.adresse || 'Non renseignée' }}</span>
                </div>
              </div>
            </div>

            <!-- Bloc 2 : Informations personnelles & pastorales -->
            <div class="info-card">
              <h4 class="card-section-title">
                <i class="bi bi-calendar-event mr-2 text-primary" aria-hidden="true"></i>
                Informations Personnelles
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Genre</span>
                  <span class="info-value">
                    @if (m.sexe === 'M') {
                      <app-badge variant="neutral" size="sm">Masculin</app-badge>
                    } @else {
                      <app-badge variant="neutral" size="sm">Féminin</app-badge>
                    }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date de naissance</span>
                  <span class="info-value">{{ m.date_naissance || 'Non renseignée' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date d'adhésion</span>
                  <span class="info-value">{{ m.date_entree || 'Non renseignée' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Statut</span>
                  <span class="info-value">
                    <app-membre-status-badge [statut]="m.statut" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bloc Observation -->
          @if (m.observation) {
            <div class="observation-card mt-4">
              <h4 class="card-section-title">
                <i class="bi bi-chat-left-text mr-2 text-primary" aria-hidden="true"></i>
                Observation
              </h4>
              <p class="observation-text">{{ m.observation }}</p>
            </div>
          }
        </div>
      }

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onClose()">Fermer</app-btn>
        @if (canManage() && membre(); as m) {
          <app-btn variant="primary" icon="pencil" (btnClick)="onEdit(m)">
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
      gap: 1rem;
    }

    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }

    .avatar-circle {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full, 9999px);
      background: var(--primary-600, #2563eb);
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .profile-meta {
      flex: 1;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .profile-name {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }

    .profile-role {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
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
    .observation-card {
      padding: 1rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }

    .card-section-title {
      font-size: 0.9rem;
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

    .observation-text {
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembreDetailModalComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly membre = input<Membre | null>(null);
  public readonly canManage = input<boolean>(false);

  public readonly close = output<void>();
  public readonly edit = output<Membre>();

  protected readonly modalTitle = 'Fiche Membre de l’Organisation';

  public onClose(): void {
    this.close.emit();
  }

  public onEdit(m: Membre): void {
    this.edit.emit(m);
  }
}
