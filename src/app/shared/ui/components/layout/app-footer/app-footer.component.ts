import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  private readonly authService: AuthService = inject(AuthService);

  protected readonly currentYear = signal<number>(new Date().getFullYear());

  protected readonly spaceLabel = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return 'Cathéo Plateforme Centrale';
    }
    const o = this.authService.currentOrganisation();
    if (o) {
      return `${o.nom} (${o.type_organisation}) - ${o.paroisse?.nom_paroisse || 'Paroisse'}`;
    }
    return 'Cathéo Pastorale';
  });
}
