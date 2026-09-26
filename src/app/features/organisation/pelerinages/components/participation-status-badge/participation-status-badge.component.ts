import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { ParticipationStatut } from '../../models/pelerinage.model';

@Component({
  selector: 'app-participation-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge [variant]="badgeVariant()" [size]="size()">
      {{ badgeLabel() }}
    </app-badge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipationStatusBadgeComponent {
  public readonly statut = input.required<ParticipationStatut | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  public readonly badgeVariant = computed(() => {
    switch (this.statut()) {
      case 'presente':
        return 'success';
      case 'prevue':
        return 'secondary';
      case 'absente':
        return 'danger';
      default:
        return 'secondary';
    }
  });

  public readonly badgeLabel = computed(() => {
    switch (this.statut()) {
      case 'presente':
        return 'Présent(e)';
      case 'prevue':
        return 'Prévue';
      case 'absente':
        return 'Absent(e)';
      default:
        return this.statut();
    }
  });
}
