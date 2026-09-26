import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="error-state-wrap" role="alert">
      <div class="error-icon" aria-hidden="true">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <h3 class="error-title">{{ title() }}</h3>
      <p class="error-message">{{ message() }}</p>
      @if (showRetry()) {
        <div class="error-actions">
          <app-btn [variant]="'outline'" [size]="'sm'" (btnClick)="retry.emit()">
            <i class="bi bi-arrow-clockwise"></i>
            <span>{{ retryText() }}</span>
          </app-btn>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .error-state-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--danger-100, #fee2e2);
      border-radius: var(--radius-lg, 14px);
      max-width: 560px;
      margin: 1.5rem auto;
    }
    .error-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--danger-50, #fef2f2);
      color: var(--danger-600, #dc2626);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1rem;
    }
    .error-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0 0 0.5rem 0;
    }
    .error-message {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      max-width: 440px;
      line-height: 1.5;
      margin: 0;
    }
    .error-actions {
      margin-top: 1.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  public readonly title = input<string>('Une erreur est survenue');
  public readonly message = input<string>("Impossible de charger les données pour le moment. Veuillez réessayer.");
  public readonly showRetry = input<boolean>(true);
  public readonly retryText = input<string>('Réessayer');

  public readonly retry = output<void>();
}
