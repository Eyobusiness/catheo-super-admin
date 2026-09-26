import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="select-wrapper" [class.has-error]="!!error()" [class.is-disabled]="disabled()">
      @if (label()) {
        <label [for]="id()" class="select-label">
          {{ label() }}
          @if (required()) {
            <span class="required-mark" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="select-control-wrap">
        <select
          [id]="id()"
          [disabled]="disabled()"
          [required]="required()"
          [value]="val()"
          (change)="onSelectChange($event)"
          (blur)="onBlur()"
          class="select-control"
        >
          @if (placeholder()) {
            <option value="" disabled [selected]="!val()">{{ placeholder() }}</option>
          }
          @for (opt of options(); track opt.value) {
            <option [value]="opt.value" [disabled]="opt.disabled">{{ opt.label }}</option>
          }
        </select>
        <span class="select-arrow" aria-hidden="true">
          <i class="bi bi-chevron-down"></i>
        </span>
      </div>

      @if (error()) {
        <p class="select-error" role="alert">
          <i class="bi bi-exclamation-circle"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p class="select-hint">{{ hint() }}</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .select-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .required-mark {
      color: var(--danger-600, #dc2626);
      margin-left: 0.2rem;
    }
    .select-control-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .select-control {
      width: 100%;
      height: var(--control-height-md, 40px);
      padding: 0 2.25rem 0 0.875rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .select-control:hover:not(:disabled) {
      border-color: var(--neutral-400, #94a3b8);
    }
    .select-control:focus {
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--focus-ring);
    }
    .select-control:disabled {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-400, #94a3b8);
      cursor: not-allowed;
    }
    .select-arrow {
      position: absolute;
      right: 0.875rem;
      color: var(--text-muted, #64748b);
      font-size: 0.8125rem;
      pointer-events: none;
    }
    .has-error .select-control {
      border-color: var(--danger-500, #ef4444);
    }
    .has-error .select-control:focus {
      box-shadow: var(--focus-ring-danger);
    }
    .select-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }
    .select-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor {
  public readonly id = input<string>(`select-${Math.random().toString(36).substring(2, 9)}`);
  public readonly label = input<string>('');
  public readonly placeholder = input<string>('-- Sélectionner --');
  public readonly options = input<SelectOption[]>([]);
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly error = input<string>('');
  public readonly hint = input<string>('');

  protected readonly val = signal<any>('');

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  public writeValue(value: any): void {
    this.val.set(value !== null && value !== undefined ? value : '');
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  protected onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.val.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
