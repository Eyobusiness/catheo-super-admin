import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { SectionCode } from '../../models/catheo-population.model';

@Component({
  selector: 'app-section-badge',
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
export class SectionBadgeComponent {
  public readonly code = input.required<SectionCode | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.code()) {
      case 'SEC-ENFANTS-PRI':
        return 'info';
      case 'SEC-ENFANTS-COL':
        return 'primary';
      case 'SEC-JEUNES':
        return 'success';
      case 'SEC-ADULTES':
        return 'warning';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.code()) {
      case 'SEC-ENFANTS-PRI':
        return 'Primaire';
      case 'SEC-ENFANTS-COL':
        return 'Collège';
      case 'SEC-JEUNES':
        return 'Jeunes';
      case 'SEC-ADULTES':
        return 'Adultes';
      default:
        return String(this.code() || '—');
    }
  });
}
