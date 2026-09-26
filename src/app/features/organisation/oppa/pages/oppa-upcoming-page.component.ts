import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-oppa-upcoming-page',
  standalone: true,
  imports: [PageHeaderComponent, CardComponent, EmptyStateComponent, ButtonComponent],
  template: `
    <app-page-header
      title="Office Paroissial de la Pastorale des Adultes (OPPA)"
      subtitle="Catéchuménat des adultes, Communautés Ecclésiales de Base et formation continue"
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
          title="Module OPPA en Préparation"
          description="L'espace dédié à la pastorale des adultes (SEC-ADULTES) sera activé dans une prochaine version. Aucune fonctionnalité n'est encore exposée pour cette section."
          actionText="Accéder à l'espace OPPE"
          icon="hourglass-split"
          (action)="backToOppe()"
        />
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OppaUpcomingPageComponent {
  private readonly router = inject(Router);

  public backToOppe(): void {
    this.router.navigate(['/organisation/dashboard']);
  }
}
