import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { CampagneStatut } from '../../models/pelerinage.model';

@Component({
  selector: 'app-campagne-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge [variant]="badgeVariant()" [size]="size()">
      {{ badgeLabel() }}
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneStatusBadgeComponent {
  public readonly statut = input.required<CampagneStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  public readonly badgeVariant = computed(() => {
    switch (this.statut()) {
      case 'ouverte':
        return 'success';
      case 'brouillon':
        return 'secondary';
      case 'cloturee':
        return 'info';
      case 'terminee':
        return 'primary';
      case 'annulee':
        return 'danger';
      default:
        return 'secondary';
    }
  });

  public readonly badgeLabel = computed(() => {
    switch (this.statut()) {
      case 'ouverte':
        return 'Ouverte';
      case 'brouillon':
        return 'Brouillon';
      case 'cloturee':
        return 'Clôturée';
      case 'terminee':
        return 'Terminée';
      case 'annulee':
        return 'Annulée';
      default:
        return this.statut();
    }
  });
}
