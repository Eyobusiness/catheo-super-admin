import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading-state-wrap" role="status" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-message">{{ message() }}</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .loading-state-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      gap: 1rem;
    }
    .loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--primary-100, #dbeafe);
      border-top-color: var(--primary-600, #0284c7);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-message {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  public readonly message = input<string>('Chargement des données en cours...');
}
