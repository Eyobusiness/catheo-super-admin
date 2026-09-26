import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../../shared/components/textarea/textarea.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { Produit, ProduitFormData } from '../../models/produit.model';

@Component({
  selector: 'app-produit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    ButtonComponent,
    CardComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="produit-form">
      <app-card title="Informations du Produit" class="form-card">
        <div class="form-grid">
          <div>
            <app-input
              label="Code du Produit"
              placeholder="ex: CATHEO, OPPE, OPPJ..."
              [required]="true"
              formControlName="code"
              hint="Identifiant unique (ex: CATHEO, OPPE, OPPJ, OPPA)"
              [error]="getFieldError('code')"
            />
          </div>

          <div>
            <app-input
              label="Nom du Produit"
              placeholder="ex: CATHEO"
              [required]="true"
              formControlName="nom"
              [error]="getFieldError('nom')"
            />
          </div>

          <div>
            <app-select
              label="Statut"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>

          <div>
            <app-input
              label="Icône (nom ou classe)"
              placeholder="ex: book-open, smile, users..."
              formControlName="icone"
              hint="Nom de l'icône représentative"
              [error]="getFieldError('icone')"
            />
          </div>

          <div class="form-col-span-2">
            <app-textarea
              label="Description"
              placeholder="Description détaillée du module applicatif..."
              formControlName="description"
              [rows]="4"
              [error]="getFieldError('description')"
            />
          </div>
        </div>
      </app-card>

      <!-- Actions Bar -->
      <div class="form-actions-bar">
        <app-btn
          [variant]="'secondary'"
          [size]="'md'"
          [disabled]="loading()"
          (btnClick)="onCancel()"
        >
          Annuler
        </app-btn>

        <app-btn
          [variant]="'primary'"
          [size]="'md'"
          [loading]="loading()"
          type="submit"
        >
          <i class="bi bi-check-lg"></i>
          <span>{{ isEdit() ? 'Enregistrer les modifications' : 'Créer le produit' }}</span>
        </app-btn>
      </div>
    </form>
  `,
  styles: [`
    .produit-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
    }
    .form-card {
      margin-bottom: 0.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .form-col-span-2 {
      grid-column: span 2;
    }
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-col-span-2 {
        grid-column: span 1;
      }
    }
    .form-actions-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  public readonly initialData = input<Produit | null>(null);
  public readonly loading = input<boolean>(false);
  public readonly isEdit = input<boolean>(false);
  public readonly serverErrors = input<Record<string, string[]>>({});

  public readonly formSubmit = output<ProduitFormData>();
  public readonly formCancel = output<void>();

  protected readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
  ];

  protected form!: FormGroup;

  constructor() {
    this.initForm();

    effect(() => {
      const data = this.initialData();
      if (data) {
        this.populateForm(data);
      }
    });
  }

  public ngOnInit(): void {
    if (this.initialData()) {
      this.populateForm(this.initialData()!);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      icone: ['', [Validators.maxLength(100)]],
      statut: ['actif', [Validators.required]],
    });
  }

  private populateForm(data: Produit): void {
    this.form.patchValue({
      code: data.code || '',
      nom: data.nom || '',
      description: data.description || '',
      icone: data.icone || '',
      statut: data.statut || 'actif',
    });
  }

  protected getFieldError(fieldName: string): string {
    const sErrors = this.serverErrors();
    if (sErrors && sErrors[fieldName] && sErrors[fieldName].length > 0) {
      return sErrors[fieldName][0];
    }

    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) {
        return 'Ce champ est obligatoire.';
      }
      if (control.errors?.['maxlength']) {
        const max = control.errors['maxlength'].requiredLength;
        return `Maximum ${max} caractères.`;
      }
    }
    return '';
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const payload: ProduitFormData = {
      code: String(val.code || '').trim().toUpperCase(),
      nom: String(val.nom || '').trim(),
      description: val.description ? String(val.description).trim() : null,
      icone: val.icone ? String(val.icone).trim() : null,
      statut: val.statut || 'actif',
    };

    this.formSubmit.emit(payload);
  }

  public onCancel(): void {
    this.formCancel.emit();
  }
}
