import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
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
import { Formule, FormuleFormData, Periodicite } from '../../models/formule.model';
import { ProduitService } from '../../../produits/services/produit.service';
import { Produit } from '../../../produits/models/produit.model';

@Component({
  selector: 'app-formule-form',
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
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="formule-form">
      <!-- Section 1 : Rattachement Produit & Identification -->
      <app-card title="Rattachement & Identification" class="form-card">
        <div class="form-grid">
          <div>
            <app-select
              label="Produit SaaS associé"
              [options]="produitOptions()"
              formControlName="produit_id"
              [required]="true"
              [error]="getFieldError('produit_id')"
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
              label="Code de la Formule"
              placeholder="ex: CATHEO-STANDARD, OPPE-ANNUEL..."
              [required]="true"
              formControlName="code"
              hint="Identifiant technique unique"
              [error]="getFieldError('code')"
            />
          </div>

          <div>
            <app-input
              label="Nom de la Formule"
              placeholder="ex: Formule Annuelle Standard"
              [required]="true"
              formControlName="nom"
              [error]="getFieldError('nom')"
            />
          </div>

          <div class="form-col-span-2">
            <app-textarea
              label="Description"
              placeholder="Description des fonctionnalités et conditions d'accès de cette formule..."
              formControlName="description"
              [rows]="3"
              [error]="getFieldError('description')"
            />
          </div>
        </div>
      </app-card>

      <!-- Section 2 : Tarification & Périodicité -->
      <app-card title="Tarification & Facturation" class="form-card">
        <div class="form-grid">
          <div class="form-col-span-2">
            <div class="free-toggle-box">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  formControlName="est_gratuite"
                  (change)="onGratuiteChange()"
                  id="est_gratuite"
                />
                <span class="checkbox-label">
                  <strong>Formule Gratuite</strong>
                  <span class="checkbox-subtext">
                    Si cochée, le montant est automatiquement verrouillé à 0 XOF (accès gracieux / découverte)
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <app-select
              label="Périodicité"
              [options]="periodiciteOptions"
              formControlName="periodicite"
              [required]="true"
              [error]="getFieldError('periodicite')"
            />
          </div>

          <div>
            <app-input
              label="Montant (XOF)"
              type="number"
              placeholder="ex: 50000"
              formControlName="montant"
              hint="Montant en Franc CFA (XOF)"
              [error]="getFieldError('montant')"
            />
          </div>

          <div>
            <app-input
              label="Devise"
              placeholder="XOF"
              formControlName="devise"
              [error]="getFieldError('devise')"
            />
          </div>

          <div>
            <app-input
              label="Ordre d'affichage"
              type="number"
              placeholder="ex: 1, 2, 3..."
              formControlName="ordre"
              hint="Ordre d'apparition dans les catalogues"
              [error]="getFieldError('ordre')"
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
          <span>{{ isEdit() ? 'Enregistrer les modifications' : 'Créer la formule' }}</span>
        </app-btn>
      </div>
    </form>
  `,
  styles: [`
    .formule-form {
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
    .free-toggle-box {
      padding: 1rem;
      background-color: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
    }
    .checkbox-container input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--primary-600, #2563eb);
      cursor: pointer;
    }
    .checkbox-label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9375rem;
      color: var(--text-primary, #0f172a);
    }
    .checkbox-subtext {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
      font-weight: normal;
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
export class FormuleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly produitService = inject(ProduitService);

  public readonly initialData = input<Formule | null>(null);
  public readonly presetProduitId = input<string | number | null>(null);
  public readonly loading = input<boolean>(false);
  public readonly isEdit = input<boolean>(false);
  public readonly serverErrors = input<Record<string, string[]>>({});

  public readonly formSubmit = output<FormuleFormData>();
  public readonly formCancel = output<void>();

  protected readonly produitOptions = signal<SelectOption[]>([]);

  protected readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' },
  ];

  protected readonly periodiciteOptions: SelectOption[] = [
    { label: 'Mensuelle', value: 'mensuelle' },
    { label: 'Annuelle', value: 'annuelle' },
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

    effect(() => {
      const presetId = this.presetProduitId();
      if (presetId && !this.initialData()) {
        this.form.patchValue({ produit_id: String(presetId) });
      }
    });
  }

  public ngOnInit(): void {
    this.loadProduits();
    if (this.initialData()) {
      this.populateForm(this.initialData()!);
    }
  }

  private loadProduits(): void {
    this.produitService.getProduits({ all: true }).subscribe({
      next: (res) => {
        const options: SelectOption[] = res.data.map((p: Produit) => ({
          label: `${p.nom} (${p.code})`,
          value: String(p.id),
        }));
        this.produitOptions.set(options);
      },
      error: () => {},
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      produit_id: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      periodicite: ['annuelle', [Validators.required]],
      montant: [0, [Validators.min(0)]],
      devise: [{ value: 'XOF', disabled: true }],
      est_gratuite: [false],
      statut: ['actif', [Validators.required]],
      ordre: [0, [Validators.min(0)]],
    });
  }

  private populateForm(data: Formule): void {
    const isFree = Boolean(data.est_gratuite);
    this.form.patchValue({
      produit_id: String(data.produit_id || ''),
      code: data.code || '',
      nom: data.nom || '',
      description: data.description || '',
      periodicite: data.periodicite || 'annuelle',
      montant: isFree ? 0 : Number(data.montant) || 0,
      devise: data.devise || 'XOF',
      est_gratuite: isFree,
      statut: data.statut || 'actif',
      ordre: data.ordre !== undefined ? data.ordre : 0,
    });

    if (isFree) {
      this.form.get('montant')?.disable();
    } else {
      this.form.get('montant')?.enable();
    }
  }

  protected onGratuiteChange(): void {
    const isFree = this.form.get('est_gratuite')?.value;
    const montantCtrl = this.form.get('montant');
    if (isFree) {
      montantCtrl?.setValue(0);
      montantCtrl?.disable();
    } else {
      montantCtrl?.enable();
    }
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
      if (control.errors?.['min']) {
        return 'La valeur ne peut pas être négative.';
      }
    }
    return '';
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const isFree = Boolean(raw.est_gratuite);
    const payload: FormuleFormData = {
      produit_id: raw.produit_id,
      code: String(raw.code || '').trim().toUpperCase(),
      nom: String(raw.nom || '').trim(),
      description: raw.description ? String(raw.description).trim() : null,
      periodicite: raw.periodicite as Periodicite,
      montant: isFree ? 0 : Number(raw.montant) || 0,
      devise: raw.devise || 'XOF',
      est_gratuite: isFree,
      statut: raw.statut || 'actif',
      ordre: Number(raw.ordre) || 0,
    };

    this.formSubmit.emit(payload);
  }

  public onCancel(): void {
    this.formCancel.emit();
  }
}
