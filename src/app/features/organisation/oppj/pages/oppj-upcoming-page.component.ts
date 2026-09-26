import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-oppj-upcoming-page',
  standalone: true,
  imports: [PageHeaderComponent, CardComponent, EmptyStateComponent, ButtonComponent],
  template: `
    <app-page-header
      title="Office Paroissial de la Pastorale des Jeunes (OPPJ)"
      subtitle="Pastorale des jeunes, mouvements diocésains et aumôneries scolaires"
      badgeText="Bientôt disponible"
      badgeVariant="warning"
    >
      <div actions>
        <app-btn variant="secondary" icon="arrow-left" (btnClick)="backToOppe()">
          Retour à l'Espace OPPE
        </app-btn>
      </div>
    </app-page-header>

    <div class="mt-4">
      <app-card>
        <app-empty-state
          title="Module OPPJ en Préparation"
          description="L'espace dédié à la pastorale des jeunes (SEC-JEUNES) sera activé dans une prochaine mise à jour de la plateforme Cathéo. Seul l'espace OPPE est actuellement actif pour les inscriptions et le catéchisme des enfants."
          actionText="Accéder à l'espace OPPE"
          icon="hourglass-split"
          (action)="backToOppe()"
        />
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OppjUpcomingPageComponent {
  private readonly router = inject(Router);

  public backToOppe(): void {
    this.router.navigate(['/organisation/dashboard']);
  }
}
