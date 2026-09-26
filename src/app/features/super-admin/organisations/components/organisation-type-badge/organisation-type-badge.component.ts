import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { OrganisationType } from '../../models/super-admin-organisation.model';

@Component({
  selector: 'app-organisation-type-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <app-badge
      [variant]="badgeVariant()"
      [label]="badgeLabel()"
      [size]="size()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationTypeBadgeComponent {
  public readonly type = input.required<OrganisationType | string>();
  public readonly size = input<'sm' | 'md'>('sm');
  public readonly showLabel = input<boolean>(true);

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.type()) {
      case 'OPPE':
        return 'primary';
      case 'OPPJ':
        return 'info';
      case 'OPPA':
        return 'warning';
      default:
        return 'neutral';
    }
  });

  protected readonly fullTitle = computed<string>(() => {
    const code = String(this.type() || '');
    switch (code) {
      case 'OPPE':
        return 'Office Paroissial de la Pastorale des Enfants';
      case 'OPPJ':
        return 'Office Paroissial de la Pastorale des Jeunes';
      case 'OPPA':
        return 'Office Paroissial de la Pastorale des Adultes';
      default:
        return code;
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    const code = String(this.type() || '');
    if (!this.showLabel()) {
      return code;
    }
    switch (code) {
      case 'OPPE':
        return 'OPPE · Office Paroissial de la Pastorale des Enfants';
      case 'OPPJ':
        return 'OPPJ · Office Paroissial de la Pastorale des Jeunes';
      case 'OPPA':
        return 'OPPA · Office Paroissial de la Pastorale des Adultes';
      default:
        return code;
    }
  });
}
