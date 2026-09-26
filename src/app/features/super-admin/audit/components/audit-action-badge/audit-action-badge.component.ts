import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { AuditActionType } from '../../models/audit.model';

@Component({
  selector: 'app-audit-action-badge',
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
export class AuditActionBadgeComponent {
  public readonly action = input.required<AuditActionType | string>();
  public readonly size = input<'sm' | 'md'>('sm');

  protected readonly badgeVariant = computed<BadgeVariant>(() => {
    switch (this.action()) {
      case 'create':
        return 'success';
      case 'update':
        return 'warning';
      case 'delete':
        return 'danger';
      case 'login':
        return 'info';
      case 'logout':
        return 'neutral';
      case 'export':
        return 'secondary';
      default:
        return 'neutral';
    }
  });

  protected readonly badgeLabel = computed<string>(() => {
    switch (this.action()) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      case 'login':
        return 'Connexion';
      case 'logout':
        return 'Déconnexion';
      case 'export':
        return 'Export';
      default:
        return String(this.action() || 'Action');
    }
  });
}
