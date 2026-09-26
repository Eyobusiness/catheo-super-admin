import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="textarea-wrapper" [class.has-error]="!!error()" [class.is-disabled]="disabled()">
      @if (label()) {
        <label [for]="id()" class="textarea-label">
          {{ label() }}
          @if (required()) {
            <span class="required-mark" aria-hidden="true">*</span>
          }
        </label>
      }

      <textarea
        [id]="id()"
        [placeholder]="placeholder()"
        [rows]="rows()"
        [attr.maxlength]="maxlength() || null"
        [disabled]="disabled()"
        [required]="required()"
        [value]="val()"
        (input)="onInputChange($event)"
        (blur)="onBlur()"
        class="textarea-control"
      ></textarea>

      <div class="textarea-footer">
        @if (error()) {
          <p class="textarea-error" role="alert">
            <i class="bi bi-exclamation-circle"></i>
            <span>{{ error() }}</span>
          </p>
        } @else if (hint()) {
          <p class="textarea-hint">{{ hint() }}</p>
        }
        @if (maxlength()) {
          <span class="char-counter">{{ val().length }} / {{ maxlength() }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .textarea-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
    }
    .textarea-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .required-mark {
      color: var(--danger-600, #dc2626);
      margin-left: 0.2rem;
    }
    .textarea-control {
      width: 100%;
      padding: 0.75rem 0.875rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      color: var(--text-primary, #0f172a);
      font-size: 0.875rem;
      outline: none;
      resize: vertical;
      min-height: 80px;
      transition: all var(--transition-fast);
    }
    .textarea-control:hover:not(:disabled) {
      border-color: var(--neutral-400, #94a3b8);
    }
    .textarea-control:focus {
      border-color: var(--primary-600, #0284c7);
      box-shadow: var(--focus-ring);
    }
    .textarea-control:disabled {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--neutral-400, #94a3b8);
      cursor: not-allowed;
    }
    .has-error .textarea-control {
      border-color: var(--danger-500, #ef4444);
    }
    .textarea-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .textarea-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }
    .textarea-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    .char-counter {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin-left: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent implements ControlValueAccessor {
  public readonly id = input<string>(`textarea-${Math.random().toString(36).substring(2, 9)}`);
  public readonly label = input<string>('');
  public readonly placeholder = input<string>('');
  public readonly rows = input<number>(4);
  public readonly maxlength = input<number | null>(null);
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly error = input<string>('');
  public readonly hint = input<string>('');

  protected readonly val = signal<string>('');

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
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    this.val.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
