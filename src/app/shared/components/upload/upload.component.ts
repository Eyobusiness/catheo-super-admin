import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container" [class.is-dragover]="isDragOver()">
      <input
        #fileInput
        type="file"
        [accept]="accept()"
        class="hidden-input"
        (change)="onFileSelected($event)"
      />

      @if (previewUrl()) {
        <div class="preview-container">
          <img [src]="previewUrl()" [alt]="previewAlt()" class="preview-img" />
          <div class="preview-actions">
            <button
              type="button"
              class="upload-btn change-btn"
              (click)="triggerFileInput()"
            >
              <i class="bi bi-arrow-repeat"></i>
              <span>Changer</span>
            </button>
            <button
              type="button"
              class="upload-btn remove-btn"
              (click)="removeFile()"
            >
              <i class="bi bi-trash"></i>
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      } @else {
        <div
          class="dropzone"
          (click)="triggerFileInput()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <div class="dropzone-icon">
            <i class="bi bi-cloud-arrow-up"></i>
          </div>
          <div class="dropzone-text">
            <span class="main-prompt">Cliquez ou glissez-déposez un fichier</span>
            <span class="sub-prompt">{{ hint() }}</span>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <span class="upload-error">{{ errorMessage() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .hidden-input {
      display: none;
    }
    .dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem 1rem;
      border: 2px dashed var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      background-color: var(--neutral-50, #f8fafc);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      text-align: center;
    }
    .dropzone:hover,
    .upload-container.is-dragover .dropzone {
      border-color: var(--primary-500, #0284c7);
      background-color: rgba(2, 132, 199, 0.04);
    }
    .dropzone-icon {
      font-size: 2rem;
      color: var(--primary-600, #0284c7);
    }
    .dropzone-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .main-prompt {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .sub-prompt {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }
    .preview-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background-color: var(--bg-surface, #ffffff);
    }
    .preview-img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .preview-actions {
      display: flex;
      gap: 0.5rem;
    }
    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: var(--radius-sm, 6px);
      cursor: pointer;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      transition: all var(--transition-fast, 150ms ease);
    }
    .change-btn:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--primary-600, #0284c7);
    }
    .remove-btn {
      color: var(--danger-600, #dc2626);
    }
    .remove-btn:hover {
      background: var(--danger-50, #fef2f2);
      border-color: var(--danger-200, #fecaca);
    }
    .upload-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
  public readonly accept = input<string>('image/*');
  public readonly hint = input<string>('Formats supportés : PNG, JPG, WEBP (max 2 Mo)');
  public readonly maxSizeBytes = input<number>(2 * 1024 * 1024); // 2 MB
  public readonly previewAlt = input<string>('Aperçu');
  public readonly initialPreviewUrl = input<string>('');

  public readonly fileSelected = output<File>();
  public readonly fileRemoved = output<void>();

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly previewUrl = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly isDragOver = signal<boolean>(false);

  public ngOnInit(): void {
    if (this.initialPreviewUrl()) {
      this.previewUrl.set(this.initialPreviewUrl());
    }
  }

  protected triggerFileInput(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage.set('');

    if (file.size > this.maxSizeBytes()) {
      const maxMb = (this.maxSizeBytes() / (1024 * 1024)).toFixed(0);
      this.errorMessage.set(`Le fichier dépasse la taille maximale autorisée (${maxMb} Mo).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    this.fileSelected.emit(file);
  }

  protected removeFile(): void {
    this.previewUrl.set('');
    this.errorMessage.set('');
    if (this.fileInputRef()?.nativeElement) {
      this.fileInputRef()!.nativeElement.value = '';
    }
    this.fileRemoved.emit();
  }
}
