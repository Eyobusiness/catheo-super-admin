import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppCard } from '../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-organisation-dashboard',
  imports: [CommonModule, RouterLink, AppCard, AppButton],
  templateUrl: './organisation-dashboard.component.html',
  styleUrl: './organisation-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationDashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);

  public readonly org = this.authService.currentOrganisation;

  public readonly orgTitle = computed(() => {
    const o = this.org();
    if (!o) return 'Organisation Pastorale';
    return `${o.nom} (${o.type_organisation})`;
  });

  public readonly stats = signal({
    total_membres: 0,
    membres_actifs: 0,
    activites_en_cours: 0,
    pelerinages_actifs: 0,
    solde_caisse: 0,
    catheo_connecte: true
  });

  public ngOnInit(): void {
    // Initialisation
  }
}
