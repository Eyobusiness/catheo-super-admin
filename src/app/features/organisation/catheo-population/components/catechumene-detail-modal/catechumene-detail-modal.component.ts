import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { SectionBadgeComponent } from '../section-badge/section-badge.component';
import { CatechumeneItem } from '../../models/catheo-population.model';

@Component({
  selector: 'app-catechumene-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    SectionBadgeComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle"
      size="lg"
      (close)="onClose()"
    >
      @if (item(); as item) {
        <div class="detail-container">
          <!-- Carte En-tête Profil -->
          @if (item.catechumene; as cat) {
            <div class="profile-header-card">
              <div class="avatar-circle">
                {{ cat.prenoms.charAt(0) || 'C' }}{{ cat.nom.charAt(0) || '' }}
              </div>
              <div class="profile-meta">
                <div class="title-row">
                  <h3 class="profile-name">{{ cat.nom_complet }}</h3>
                  @if (item.section) {
                    <app-section-badge [code]="item.section.code" />
                  }
                </div>
                <div class="badges-row mt-1">
                  @if (cat.matricule) {
                    <span class="matricule-badge">{{ cat.matricule }}</span>
                  }
                  @if (item.niveau) {
                    <span class="meta-pill">
                      <i class="bi bi-mortarboard mr-1" aria-hidden="true"></i>
                      {{ item.niveau.nom }}
                    </span>
                  }
                  @if (item.classe) {
                    <span class="meta-pill">
                      <i class="bi bi-diagram-2 mr-1" aria-hidden="true"></i>
                      {{ item.classe.nom }}
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Grille d'informations -->
          <div class="info-grid mt-4">
            <!-- Bloc 1 : Inscription Pastorale -->
            <div class="info-card">
              <h4 class="card-section-title">
                <i class="bi bi-bookmark-check-fill mr-2 text-primary" aria-hidden="true"></i>
                Inscription Pastorale
              </h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Année catéchétique</span>
                  <span class="info-value font-bold">
                    {{ item.annee_catechese?.libelle || 'Active' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Section</span>
                  <span class="info-value">{{ item.section?.nom || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Niveau</span>
                  <span class="info-value">{{ item.niveau?.nom || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Classe</span>
                  <span class="info-value">{{ item.classe?.nom || 'Non assignée' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Code inscription</span>
                  <span class="info-value font-mono">{{ item.code_inscription || '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Statut</span>
                  <span class="info-value">
                    <app-badge variant="success" size="sm">
                      {{ item.statut_inscription || 'Inscrit' }}
                    </app-badge>
                  </span>
                </div>
              </div>
            </div>

            <!-- Bloc 2 : État Civil & Identité -->
            @if (item.catechumene; as cat) {
              <div class="info-card">
                <h4 class="card-section-title">
                  <i class="bi bi-person-lines-fill mr-2 text-primary" aria-hidden="true"></i>
                  État Civil & Coordonnées
                </h4>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Genre</span>
                    <span class="info-value">
                      {{ cat.sexe === 'M' ? 'Masculin' : cat.sexe === 'F' ? 'Féminin' : '—' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date de naissance</span>
                    <span class="info-value">
                      {{ cat.date_naissance ? (cat.date_naissance | date:'dd/MM/yyyy') : 'Non renseignée' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Téléphone</span>
                    <span class="info-value">{{ cat.telephone || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">{{ cat.email || '—' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Bloc 3 : Parents & Famille -->
          @if (item.catechumene; as cat) {
            @if (cat.nom_pere || cat.nom_mere || cat.contact_parent) {
              <div class="info-card mt-3">
                <h4 class="card-section-title">
                  <i class="bi bi-people-fill mr-2 text-primary" aria-hidden="true"></i>
                  Parents & Contacts d'Urgence
                </h4>
                <div class="info-list">
                  @if (cat.nom_pere) {
                    <div class="info-item">
                      <span class="info-label">Nom du père</span>
                      <span class="info-value">{{ cat.nom_pere }}</span>
                    </div>
                  }
                  @if (cat.nom_mere) {
                    <div class="info-item">
                      <span class="info-label">Nom de la mère</span>
                      <span class="info-value">{{ cat.nom_mere }}</span>
                    </div>
                  }
                  @if (cat.contact_parent) {
                    <div class="info-item">
                      <span class="info-label">Contact parent / tuteur</span>
                      <span class="info-value font-bold">{{ cat.contact_parent }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onClose()">Fermer</app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .detail-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .profile-name {
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

    .matricule-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      background: #e2e8f0;
      color: #1e293b;
      border-radius: 4px;
    }

    .meta-pill {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
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

    .info-card {
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

    .font-mono {
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneDetailModalComponent {
  public readonly isOpen = input.required<boolean>();
  public readonly item = input<CatechumeneItem | null>(null);

  public readonly close = output<void>();

  protected readonly modalTitle = 'Fiche Catéchumène (CATHEO)';

  public onClose(): void {
    this.close.emit();
  }
}
