import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="date-picker-wrapper" [class.has-error]="!!error()" [class.is-disabled]="disabled()">
      @if (label()) {
        <label [for]="id()" class="date-label">
          {{ label() }}
          @if (required()) {
            <span class="required-mark" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="date-control-wrap">
        <input
          [id]="id()"
          type="date"
          [min]="minDate()"
          [max]="maxDate()"
          [disabled]="disabled()"
          [required]="required()"
          [value]="val()"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          class="date-control"
        />
        <span class="date-icon" aria-hidden="true">
          <i class="bi bi-calendar-event"></i>
        </span>
      </div>

      @if (error()) {
        <p class="date-error" role="alert">
          <i class="bi bi-exclamation-circle"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p class="date-hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .date-picker-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .date-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .required-mark {
      color: var(--danger-600, #dc2626);
      margin-left: 0.2rem;
    }
    .date-control-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .date-control {
      width: 100%;
      height: var(--control-height-md, 40px);
      padding: 0 2.5rem 0 0.875rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      transition: all var(--transition-fast);
    }
    .date-control:hover:not(:disabled) {
      border-color: var(--neutral-400, #94a3b8);
    }
    .date-control:focus {
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--focus-ring);
    }
    .date-control:disabled {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-400, #94a3b8);
      cursor: not-allowed;
    }
    .date-icon {
      position: absolute;
      right: 0.875rem;
      color: var(--text-muted, #64748b);
      pointer-events: none;
    }
    .has-error .date-control {
      border-color: var(--danger-500, #ef4444);
    }
    .date-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }
    .date-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements ControlValueAccessor {
  public readonly id = input<string>(`date-${Math.random().toString(36).substring(2, 9)}`);
  public readonly label = input<string>('');
  public readonly minDate = input<string>('');
  public readonly maxDate = input<string>('');
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly error = input<string>('');
  public readonly hint = input<string>('');

  protected readonly val = signal<string>('');

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  public writeValue(value: any): void {
    this.val.set(value ? String(value) : '');
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  protected onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.val.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
