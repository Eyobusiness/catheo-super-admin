import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { StatutOperationCaisse } from '../../models/caisse.model';

@Component({
  selector: 'app-operation-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <app-badge [variant]="config().variant" [icon]="config().icon">
      {{ config().label }}
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationStatusBadgeComponent {
  public readonly statut = input.required<StatutOperationCaisse | string>();

  public readonly config = computed(() => {
    const s = this.statut()?.toLowerCase();
    switch (s) {
      case 'valide':
        return {
          variant: 'success' as const,
          icon: 'check-circle',
          label: 'Validé',
        };
      case 'annule':
        return {
          variant: 'danger' as const,
          icon: 'x-circle',
          label: 'Annulé',
        };
      default:
        return {
          variant: 'neutral' as const,
          icon: 'dash',
          label: this.statut() || 'Inconnu',
        };
    }
  });
}
