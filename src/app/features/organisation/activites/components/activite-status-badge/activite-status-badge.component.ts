import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { ActiviteStatut } from '../../models/activite.model';

@Component({
  selector: 'app-activite-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge
      [variant]="badgeVariant()"
      [label]="badgeLabel()"
      [size]="size()"
      [dot]="true"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiviteStatusBadgeComponent {
  public readonly statut = input.required<ActiviteStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'planifiee':
        return 'info';
      case 'en_cours':
        return 'warning';
      case 'terminee':
        return 'success';
      case 'annulee':
        return 'danger';
      case 'brouillon':
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'brouillon':
        return 'Brouillon';
      case 'planifiee':
        return 'Planifiée';
      case 'en_cours':
        return 'En cours';
      case 'terminee':
        return 'Terminée';
      case 'annulee':
        return 'Annulée';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
