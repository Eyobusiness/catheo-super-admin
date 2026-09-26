import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { TypeOperationCaisse } from '../../models/caisse.model';

@Component({
  selector: 'app-operation-type-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <app-badge [variant]="config().variant" [icon]="config().icon">
      {{ config().label }}
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationTypeBadgeComponent {
  public readonly type = input.required<TypeOperationCaisse | string>();

  public readonly config = computed(() => {
    const t = this.type()?.toLowerCase();
    switch (t) {
      case 'entree':
        return {
          variant: 'success' as const,
          icon: 'arrow-down-left',
          label: 'Entrée',
        };
      case 'sortie':
        return {
          variant: 'danger' as const,
          icon: 'arrow-up-right',
          label: 'Sortie',
        };
      default:
        return {
          variant: 'neutral' as const,
          icon: 'dash',
          label: this.type() || 'Inconnu',
        };
    }
  });
}
