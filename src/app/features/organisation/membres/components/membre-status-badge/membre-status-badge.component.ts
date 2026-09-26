import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { MembreStatut } from '../../models/membre.model';

@Component({
  selector: 'app-membre-status-badge',
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
export class MembreStatusBadgeComponent {
  public readonly statut = input.required<MembreStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'success';
      case 'inactif':
        return 'neutral';
      case 'suspendu':
        return 'danger';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.statut()) {
      case 'actif':
        return 'Actif';
      case 'inactif':
        return 'Inactif';
      case 'suspendu':
        return 'Suspendu';
      default:
        return String(this.statut() || 'Inconnu');
    }
  });
}
