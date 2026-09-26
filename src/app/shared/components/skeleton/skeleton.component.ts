import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="skeleton-item"
      [class.circle]="variant() === 'circle'"
      [class.rect]="variant() === 'rect'"
      [class.text]="variant() === 'text'"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="customRadius()"
    ></div>
  `,
  styles: [`
    :host {
      display: inline-block;
      width: 100%;
    }
    .skeleton-item {
      background: linear-gradient(
        90deg,
        var(--neutral-100, #f1f5f9) 25%,
        var(--neutral-200, #e2e8f0) 37%,
        var(--neutral-100, #f1f5f9) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
      border-radius: var(--radius-sm, 6px);
      display: block;
    }
    .skeleton-item.circle {
      border-radius: 50% !important;
    }
    @keyframes shimmer {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  public readonly variant = input<'text' | 'rect' | 'circle'>('text');
  public readonly width = input<string>('100%');
  public readonly height = input<string>('1rem');
  public readonly borderRadius = input<string>('');

  protected customRadius(): string {
    if (this.variant() === 'circle') return '50%';
    return this.borderRadius() || (this.variant() === 'rect' ? '8px' : '4px');
  }
}
