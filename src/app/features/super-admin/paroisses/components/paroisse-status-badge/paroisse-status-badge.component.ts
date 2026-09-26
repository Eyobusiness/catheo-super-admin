import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { ParoisseStatut } from '../../models/paroisse.model';

@Component({
  selector: 'app-paroisse-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge
      [variant]="badgeVariant()"
      [label]="badgeLabel()"
      [dot]="true"
      [size]="size()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoisseStatusBadgeComponent {
  public readonly statut = input<ParoisseStatut | string | undefined>('actif');
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'success';
      case 'suspendu':
        return 'warning';
      case 'inactif':
        return 'danger';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'Actif';
      case 'suspendu':
        return 'Suspendu';
      case 'inactif':
        return 'Inactif';
      default:
        return this.statut() ? String(this.statut()) : 'Inconnu';
    }
  });
}
