import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { AbonnementStatut } from '../../models/abonnement.model';

@Component({
  selector: 'app-abonnement-status-badge',
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
export class AbonnementStatusBadgeComponent {
  public readonly statut = input.required<AbonnementStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'suspendu':
        return 'neutral';
      case 'expire':
        return 'neutral';
      case 'resilie':
        return 'danger';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'Actif';
      case 'en_attente':
        return 'En attente';
      case 'suspendu':
        return 'Suspendu';
      case 'expire':
        return 'Expiré';
      case 'resilie':
        return 'Résilié';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
