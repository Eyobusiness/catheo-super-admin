import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="input-wrapper" [class.has-error]="!!error()" [class.is-disabled]="disabled()">
      @if (label()) {
        <label [for]="id()" class="input-label">
          {{ label() }}
          @if (required()) {
            <span class="required-mark" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="input-control-wrap">
        @if (iconPrefix()) {
          <span class="input-prefix-icon" aria-hidden="true">
            <i [class]="iconPrefix()"></i>
          </span>
        }

        <input
          [id]="id()"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [required]="required()"
          [value]="val()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() ? id() + '-error' : hint() ? id() + '-hint' : null"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          class="input-control"
          [class.has-prefix]="!!iconPrefix()"
          [class.has-suffix]="!!iconSuffix()"
        />

        @if (iconSuffix()) {
          <span class="input-suffix-icon" aria-hidden="true">
            <i [class]="iconSuffix()"></i>
          </span>
        }
      </div>

      @if (error()) {
        <p [id]="id() + '-error'" class="input-error" role="alert">
          <i class="bi bi-exclamation-circle"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p [id]="id() + '-hint'" class="input-hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .input-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .required-mark {
      color: var(--danger-600, #dc2626);
      margin-left: 0.2rem;
    }
    .input-control-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .input-control {
      width: 100%;
      height: var(--control-height-md, 40px);
      padding: 0 0.875rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      transition: all var(--transition-fast);
    }
    .input-control:hover:not(:disabled) {
      border-color: var(--neutral-400, #94a3b8);
    }
    .input-control:focus {
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--focus-ring);
    }
    .input-control:disabled {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-400, #94a3b8);
      cursor: not-allowed;
    }
    .input-control.has-prefix {
      padding-left: 2.25rem;
    }
    .input-control.has-suffix {
      padding-right: 2.25rem;
    }
    .input-prefix-icon,
    .input-suffix-icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748b);
      font-size: 1rem;
      pointer-events: none;
    }
    .input-prefix-icon {
      left: 0.75rem;
    }
    .input-suffix-icon {
      right: 0.75rem;
    }
    .has-error .input-control {
      border-color: var(--danger-500, #ef4444);
    }
    .has-error .input-control:focus {
      box-shadow: var(--focus-ring-danger);
    }
    .input-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }
    .input-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  public readonly id = input<string>(`input-${Math.random().toString(36).substring(2, 9)}`);
  public readonly label = input<string>('');
  public readonly type = input<string>('text');
  public readonly placeholder = input<string>('');
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly error = input<string>('');
  public readonly hint = input<string>('');
  public readonly iconPrefix = input<string>('');
  public readonly iconSuffix = input<string>('');

  public readonly val = signal<string>('');

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  public writeValue(value: any): void {
    this.val.set(value !== null && value !== undefined ? String(value) : '');
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
