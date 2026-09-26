import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ORGANISATION_SPACES,
  OrganisationSpace,
  OrganisationSpaceConfig,
} from '../../models/organisation-space.model';

@Component({
  selector: 'app-organisation-space-selector',
  standalone: true,
  imports: [],
  template: `
    <div class="space-selector-container" role="radiogroup" aria-label="Espaces Pastoraux">
      <div class="space-selector-header">
        <span class="space-selector-title">Choisissez votre espace</span>
        <span class="space-selector-req">*</span>
      </div>
      <div class="space-buttons-group">
        @for (space of spacesList; track space.code) {
          <button
            type="button"
            class="space-btn"
            [class.active]="selectedSpace() === space.code"
            [class.selected]="selectedSpace() === space.code"
            [attr.aria-checked]="selectedSpace() === space.code"
            [title]="space.code + ' — ' + space.fullLabel"
            role="radio"
            (click)="selectSpace(space)"
          >
            <span class="space-code">{{ space.code }}</span>
            <span class="space-label">{{ getSpaceShortLabel(space.code) }}</span>
            @if (selectedSpace() === space.code) {
              <i class="bi bi-check2 check-icon"></i>
            }
          </button>
        }
      </div>

      @if (currentSpaceConfig(); as current) {
        <div class="space-definition-badge" role="status">
          <i class="bi bi-info-circle-fill"></i>
          <span class="def-code">{{ current.code }} :</span>
          <span class="def-text">{{ current.fullLabel }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './organisation-space-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationSpaceSelectorComponent {
  public readonly selectedSpace = input<OrganisationSpace | null>(null);
  public readonly spaceChange = output<OrganisationSpace>();

  protected readonly spacesList: OrganisationSpaceConfig[] = [
    ORGANISATION_SPACES.OPPE,
    ORGANISATION_SPACES.OPPJ,
    ORGANISATION_SPACES.OPPA,
  ];

  protected readonly currentSpaceConfig = computed<OrganisationSpaceConfig | null>(() => {
    const s = this.selectedSpace();
    return s && ORGANISATION_SPACES[s] ? ORGANISATION_SPACES[s] : null;
  });

  protected getSpaceShortLabel(code: OrganisationSpace): string {
    switch (code) {
      case 'OPPE':
        return 'Enfants';
      case 'OPPJ':
        return 'Jeunes';
      case 'OPPA':
        return 'Adultes';
      default:
        return '';
    }
  }

  protected selectSpace(space: OrganisationSpaceConfig): void {
    this.spaceChange.emit(space.code);
  }
}
