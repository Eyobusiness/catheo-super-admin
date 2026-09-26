import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { InscriptionStatut } from '../../models/pelerinage.model';

@Component({
  selector: 'app-inscription-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge [variant]="badgeVariant()" [size]="size()">
      {{ badgeLabel() }}
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionStatusBadgeComponent {
  public readonly statut = input.required<InscriptionStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  public readonly badgeVariant = computed(() => {
    switch (this.statut()) {
      case 'payee':
        return 'success';
      case 'partiellement_payee':
        return 'info';
      case 'en_attente':
        return 'warning';
      case 'annulee':
        return 'danger';
      default:
        return 'secondary';
    }
  });

  public readonly badgeLabel = computed(() => {
    switch (this.statut()) {
      case 'payee':
        return 'Payée';
      case 'partiellement_payee':
        return 'Partiellement payée';
      case 'en_attente':
        return 'En attente';
      case 'annulee':
        return 'Annulée';
      default:
        return this.statut();
    }
  });
}
