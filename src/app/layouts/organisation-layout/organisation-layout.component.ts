import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebar } from '../../shared/ui/components/layout/app-sidebar/app-sidebar.component';
import { AppHeader } from '../../shared/ui/components/layout/app-header/app-header.component';
import { AppFooter } from '../../shared/ui/components/layout/app-footer/app-footer.component';

@Component({
  selector: 'app-organisation-layout',
  imports: [RouterOutlet, AppSidebar, AppHeader, AppFooter],
  template: `
    <div class="organisation-layout">
      <app-sidebar />
      <div class="main-body-wrapper">
        <app-header />
        <main class="page-content">
          <router-outlet />
        </main>
        <app-footer />
      </div>
    </div>
  `,
  styles: [`
    .organisation-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-app);
    }
    .main-body-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 100vh;
    }
    .page-content {
      flex: 1;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationLayoutComponent {}
