import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { EcheanceStatut } from '../../models/abonnement.model';

@Component({
  selector: 'app-echeance-status-badge',
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
export class EcheanceStatusBadgeComponent {
  public readonly statut = input.required<EcheanceStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'payee':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'en_retard':
        return 'danger';
      case 'annulee':
        return 'neutral';
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
      case 'en_retard':
        return 'En retard';
      case 'annulee':
        return 'Annulée';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
