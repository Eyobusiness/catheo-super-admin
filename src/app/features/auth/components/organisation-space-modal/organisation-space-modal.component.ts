import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import {
  ORGANISATION_SPACES,
  OrganisationSpace,
  OrganisationSpaceConfig,
} from '../../models/organisation-space.model';

@Component({
  selector: 'app-organisation-space-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, BadgeComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="'CHOISISSEZ VOTRE ESPACE'"
      [size]="'md'"
      [closable]="false"
      (close)="onDismiss()"
    >
      <div class="space-modal-intro">
        <p class="intro-description">
          Sélectionnez l'espace organisationnel que vous souhaitez utiliser pour votre session pastorale.
        </p>
      </div>

      <div class="modal-spaces-list" role="radiogroup" aria-label="Choix de l'espace organisationnel">
        @for (space of spaces; track space.code) {
          <div
            class="modal-space-item"
            [class.selected]="selectedCode() === space.code"
            [class.disabled]="!space.isAvailable"
            [attr.aria-checked]="selectedCode() === space.code"
            [attr.aria-disabled]="!space.isAvailable"
            role="radio"
            tabindex="{{ space.isAvailable ? 0 : -1 }}"
            (click)="selectSpace(space)"
            (keydown.enter)="selectSpace(space)"
            (keydown.space)="selectSpace(space); $event.preventDefault()"
          >
            <div class="item-radio-col">
              <span class="custom-radio" [class.checked]="selectedCode() === space.code">
                @if (selectedCode() === space.code) {
                  <span class="radio-inner-dot"></span>
                }
              </span>
            </div>

            <div class="item-content-col">
              <div class="item-title-row">
                <span class="item-code">{{ space.code }}</span>
                <span class="item-full-label">{{ space.fullLabel }}</span>
                @if (!space.isAvailable) {
                  <app-badge [variant]="'neutral'" [size]="'sm'">
                    {{ space.badgeText || 'Bientôt disponible' }}
                  </app-badge>
                } @else {
                  <span class="ready-badge">
                    <i class="bi bi-check2"></i> Recommandé
                  </span>
                }
              </div>
              <p class="item-desc">{{ space.description }}</p>
            </div>
          </div>
        }
      </div>

      <div modal-footer class="space-modal-actions">
        <app-btn
          [variant]="'primary'"
          [size]="'md'"
          [fullWidth]="true"
          (btnClick)="confirmSelection()"
        >
          <span>Continuer vers la connexion</span>
          <i class="bi bi-arrow-right"></i>
        </app-btn>
      </div>
    </app-modal>
  `,
  styleUrl: './organisation-space-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationSpaceModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly initialSpace = input<OrganisationSpace>('OPPE');
  public readonly spaceConfirmed = output<OrganisationSpace>();
  public readonly dismissed = output<void>();

  public readonly selectedCode = signal<OrganisationSpace>('OPPE');

  public readonly spaces: OrganisationSpaceConfig[] = [
    ORGANISATION_SPACES.OPPE,
    ORGANISATION_SPACES.OPPJ,
    ORGANISATION_SPACES.OPPA,
  ];

  public selectSpace(space: OrganisationSpaceConfig): void {
    if (space.isAvailable) {
      this.selectedCode.set(space.code);
    }
  }

  protected confirmSelection(): void {
    this.spaceConfirmed.emit(this.selectedCode());
  }

  protected onDismiss(): void {
    // Si la modale est fermée, confirmer le choix par défaut
    this.spaceConfirmed.emit(this.selectedCode());
  }
}
