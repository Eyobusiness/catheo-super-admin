import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { PaiementStatut } from '../../models/paiement.model';

@Component({
  selector: 'app-paiement-status-badge',
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
export class PaiementStatusBadgeComponent {
  public readonly statut = input.required<PaiementStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'valide':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'annule':
        return 'danger';
      case 'rembourse':
        return 'info';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'valide':
        return 'Validé';
      case 'en_attente':
        return 'En attente';
      case 'annule':
        return 'Annulé';
      case 'rembourse':
        return 'Remboursé';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
