import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { FactureStatut } from '../../models/facture.model';

@Component({
  selector: 'app-facture-status-badge',
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
export class FactureStatusBadgeComponent {
  public readonly statut = input.required<FactureStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'payee':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'annulee':
        return 'danger';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'payee':
        return 'Payée';
      case 'en_attente':
        return 'En attente';
      case 'annulee':
        return 'Annulée';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
