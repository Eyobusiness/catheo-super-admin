import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout-container">
      <div class="auth-card-wrapper">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, rgba(2, 132, 199, 0.08) 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, rgba(79, 70, 229, 0.08) 0%, transparent 40%),
                  var(--bg-app);
      padding: 1.5rem;
    }
    .auth-card-wrapper {
      width: 100%;
      max-width: 440px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
