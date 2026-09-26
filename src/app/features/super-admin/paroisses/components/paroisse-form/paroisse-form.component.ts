import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
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
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../../shared/components/textarea/textarea.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ParoisseDetail } from '../../models/paroisse.model';

@Component({
  selector: 'app-paroisse-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    ButtonComponent,
    CardComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="paroisse-form">
      <!-- Section 1 : Informations Générales -->
      <app-card title="Informations Générales" class="form-card">
        <div class="form-grid">
          <div class="form-col-span-2">
            <app-input
              label="Nom de la Paroisse"
              placeholder="ex: Coeur Immaculé de Marie"
              [required]="true"
              formControlName="nom_paroisse"
              [error]="getFieldError('nom_paroisse')"
            />
          </div>

          <div>
            <app-input
              label="Code Paroisse"
              placeholder="ex: CIM01"
              [required]="true"
              formControlName="code_paroisse"
              hint="Identifiant unique court de la paroisse (ex: STMIC)"
              [error]="getFieldError('code_paroisse')"
            />
          </div>

          <div>
            <app-select
              label="Statut Opérationnel"
              [options]="statutOptions"
              formControlName="statut"
              [error]="getFieldError('statut')"
            />
          </div>
        </div>
      </app-card>

      <!-- Section 2 : Localisation Géographique -->
      <app-card title="Localisation Géographique" class="form-card">
        <div class="form-grid">
          <div>
            <app-input
              label="Diocèse"
              placeholder="ex: Archidiocèse d'Abidjan"
              [required]="true"
              formControlName="diocese"
              [error]="getFieldError('diocese')"
            />
          </div>

          <div>
            <app-input
              label="Doyenné"
              placeholder="ex: Père Jacques Joseph Nomel"
              formControlName="doyenne"
              [error]="getFieldError('doyenne')"
            />
          </div>

          <div>
            <app-input
              label="Ville"
              placeholder="ex: Abidjan"
              formControlName="ville"
              [error]="getFieldError('ville')"
            />
          </div>

          <div>
            <app-input
              label="Commune / Quartier"
              placeholder="ex: Plateau Dokui"
              formControlName="commune"
              [error]="getFieldError('commune')"
            />
          </div>

          <div class="form-col-span-2">
            <app-textarea
              label="Adresse Complète"
              placeholder="ex: Cité Forest, en face de la pharmacie"
              formControlName="adresse"
              [rows]="2"
              [error]="getFieldError('adresse')"
            />
          </div>
        </div>
      </app-card>

      <!-- Section 3 : Coordonnées de Contact -->
      <app-card title="Coordonnées de Contact" class="form-card">
        <div class="form-grid">
          <div>
            <app-input
              label="Numéro de Téléphone"
              placeholder="ex: +225 01 02 03 04 05"
              formControlName="telephone"
              iconPrefix="bi bi-telephone"
              [error]="getFieldError('telephone')"
            />
          </div>

          <div>
            <app-input
              label="Adresse Email"
              type="email"
              placeholder="ex: contact@paroisse.ci"
              formControlName="email"
              iconPrefix="bi bi-envelope"
              [error]="getFieldError('email')"
            />
          </div>

          <div class="form-col-span-2">
            <app-input
              label="Site Internet / Page Web"
              placeholder="ex: https://paroisse.ci"
              formControlName="site_web"
              iconPrefix="bi bi-globe"
              [error]="getFieldError('site_web')"
            />
          </div>
        </div>
      </app-card>

      <!-- Section 4 : Configuration Pastorale & Codes CATHEO -->
      <app-card title="Configuration Pastorale & Codes CATHEO" class="form-card">
        <div class="form-grid">
          <div>
            <app-input
              label="Préfixe Matricule (Lettres majuscules)"
              placeholder="ex: CIM"
              formControlName="prefixe_matricule"
              hint="Format : 2 à 10 lettres majuscules (ex: CIM)"
              [error]="getFieldError('prefixe_matricule')"
            />
          </div>

          <div>
            <app-input
              label="Préfixe Reçu de Paiement"
              placeholder="ex: REC"
              formControlName="prefixe_recu"
              hint="Format : 2 à 10 lettres (ex: REC)"
              [error]="getFieldError('prefixe_recu')"
            />
          </div>

          <div>
            <app-input
              label="Nom du Curé"
              placeholder="ex: Père Patrice BOHUI"
              formControlName="cure_nom"
              [error]="getFieldError('cure_nom')"
            />
          </div>

          <div>
            <app-input
              label="Nom de la Coordination"
              placeholder="ex: Coordination de la Catéchèse"
              formControlName="coordination_nom"
              [error]="getFieldError('coordination_nom')"
            />
          </div>
        </div>
      </app-card>

      <!-- Section 5 : Logos & Identité Visuelle -->
      <app-card title="Logos & Identité Visuelle" class="form-card">
        <div class="logo-upload-container">
          <!-- Logo Paroisse -->
          <div class="logo-box">
            <label class="logo-label">Logo de la Paroisse</label>
            @if (logoParoissePreview()) {
              <div class="preview-wrapper">
                <img [src]="logoParoissePreview()" alt="Logo Paroisse" class="logo-preview-img" />
                <button
                  type="button"
                  (click)="removeLogoParoisse()"
                  class="remove-logo-btn"
                  title="Supprimer ce logo"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            } @else {
              <div class="upload-placeholder">
                <i class="bi bi-image"></i>
                <span>Aucun logo paroisse</span>
              </div>
            }
            <input
              type="file"
              id="file-logo-paroisse"
              accept="image/png, image/jpeg, image/webp"
              (change)="onLogoParoisseSelected($event)"
              class="file-input"
            />
            <label for="file-logo-paroisse" class="choose-file-btn">
              <i class="bi bi-upload"></i>
              <span>Choisir un fichier</span>
            </label>
          </div>

          <!-- Logo Catéchèse -->
          <div class="logo-box">
            <label class="logo-label">Logo de la Catéchèse</label>
            @if (logoCatechesePreview()) {
              <div class="preview-wrapper">
                <img [src]="logoCatechesePreview()" alt="Logo Catéchèse" class="logo-preview-img" />
                <button
                  type="button"
                  (click)="removeLogoCatechese()"
                  class="remove-logo-btn"
                  title="Supprimer ce logo"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            } @else {
              <div class="upload-placeholder">
                <i class="bi bi-image"></i>
                <span>Aucun logo catéchèse</span>
              </div>
            }
            <input
              type="file"
              id="file-logo-catechese"
              accept="image/png, image/jpeg, image/webp"
              (change)="onLogoCatecheseSelected($event)"
              class="file-input"
            />
            <label for="file-logo-catechese" class="choose-file-btn">
              <i class="bi bi-upload"></i>
              <span>Choisir un fichier</span>
            </label>
          </div>
        </div>
      </app-card>

      <!-- Actions de soumission -->
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
          <span>{{ loading() ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
        </app-btn>
      </div>
    </form>
  `,
  styles: [`
    .paroisse-form {
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
    /* Logo upload section */
    .logo-upload-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }
    .logo-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem;
      border: 1px dashed var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      background-color: var(--neutral-50, #f8fafc);
      text-align: center;
    }
    .logo-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      margin-bottom: 0.75rem;
    }
    .preview-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: var(--radius-md, 10px);
      overflow: hidden;
      border: 1px solid var(--border-color, #e2e8f0);
      background-color: #ffffff;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-preview-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .remove-logo-btn {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: rgba(220, 38, 38, 0.85);
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: background-color var(--transition-fast);
    }
    .remove-logo-btn:hover {
      background-color: rgba(185, 28, 28, 1);
    }
    .upload-placeholder {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--border-color, #e2e8f0);
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--neutral-400, #94a3b8);
      font-size: 0.75rem;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }
    .upload-placeholder i {
      font-size: 2rem;
    }
    .file-input {
      display: none;
    }
    .choose-file-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      background-color: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .choose-file-btn:hover {
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--text-primary, #0f172a);
    }
    /* Actions Bar */
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
export class ParoisseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  public readonly initialData = input<ParoisseDetail | null>(null);
  public readonly loading = input<boolean>(false);
  public readonly serverErrors = input<Record<string, string[]>>({});

  public readonly formSubmit = output<FormData | Record<string, any>>();
  public readonly formCancel = output<void>();

  protected readonly logoParoissePreview = signal<string | null>(null);
  protected readonly logoCatechesePreview = signal<string | null>(null);

  protected logoParoisseFile: File | null = null;
  protected logoCatecheseFile: File | null = null;
  protected deleteLogoParoisse = false;
  protected deleteLogoCatechese = false;

  protected readonly statutOptions: SelectOption[] = [
    { label: 'Actif', value: 'actif' },
    { label: 'Suspendu', value: 'suspendu' },
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
      nom_paroisse: ['', [Validators.required, Validators.maxLength(255)]],
      code_paroisse: ['', [Validators.required, Validators.maxLength(50)]],
      statut: ['actif', [Validators.required]],
      diocese: ['', [Validators.required, Validators.maxLength(255)]],
      doyenne: ['', [Validators.maxLength(255)]],
      ville: ['', [Validators.maxLength(255)]],
      commune: ['', [Validators.maxLength(255)]],
      adresse: [''],
      telephone: ['', [Validators.maxLength(50)]],
      email: ['', [Validators.email, Validators.maxLength(255)]],
      site_web: ['', [Validators.maxLength(255)]],
      prefixe_matricule: ['', [Validators.maxLength(10)]],
      prefixe_recu: ['', [Validators.maxLength(10)]],
      cure_nom: ['', [Validators.maxLength(255)]],
      coordination_nom: ['', [Validators.maxLength(255)]],
    });
  }

  private populateForm(data: ParoisseDetail): void {
    this.form.patchValue({
      nom_paroisse: data.nom_paroisse || '',
      code_paroisse: data.code_paroisse || '',
      statut: data.statut || 'actif',
      diocese: data.diocese || '',
      doyenne: data.doyenne || '',
      ville: data.ville || '',
      commune: data.commune || '',
      adresse: data.adresse || '',
      telephone: data.telephone || '',
      email: data.email || '',
      site_web: data.site_web || '',
      prefixe_matricule: data.prefixe_matricule || '',
      prefixe_recu: data.prefixe_recu || '',
      cure_nom: data.cure_nom || '',
      coordination_nom: data.coordination_nom || '',
    });

    if (data.logo_paroisse_url) {
      this.logoParoissePreview.set(data.logo_paroisse_url);
    }
    if (data.logo_catechese_url) {
      this.logoCatechesePreview.set(data.logo_catechese_url);
    }
  }

  protected getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) {
        return 'Ce champ est obligatoire.';
      }
      if (control.errors?.['email']) {
        return 'Format d\'adresse email invalide.';
      }
      if (control.errors?.['maxlength']) {
        return `Longueur maximale dépassée.`;
      }
    }

    const sErrors = this.serverErrors();
    if (sErrors && sErrors[fieldName] && sErrors[fieldName].length > 0) {
      return sErrors[fieldName][0];
    }

    return '';
  }

  protected onLogoParoisseSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.logoParoisseFile = file;
      this.deleteLogoParoisse = false;
      const reader = new FileReader();
      reader.onload = (e) => this.logoParoissePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  protected removeLogoParoisse(): void {
    this.logoParoisseFile = null;
    this.deleteLogoParoisse = true;
    this.logoParoissePreview.set(null);
  }

  protected onLogoCatecheseSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.logoCatecheseFile = file;
      this.deleteLogoCatechese = false;
      const reader = new FileReader();
      reader.onload = (e) => this.logoCatechesePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  protected removeLogoCatechese(): void {
    this.logoCatecheseFile = null;
    this.deleteLogoCatechese = true;
    this.logoCatechesePreview.set(null);
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.value;

    // Use FormData if files or deletions are involved
    if (
      this.logoParoisseFile ||
      this.logoCatecheseFile ||
      this.deleteLogoParoisse ||
      this.deleteLogoCatechese
    ) {
      const formData = new FormData();
      Object.keys(formValues).forEach((key) => {
        const val = formValues[key];
        if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      if (this.logoParoisseFile) {
        formData.append('logo_paroisse', this.logoParoisseFile);
      } else if (this.deleteLogoParoisse) {
        formData.append('supprimer_logo_paroisse', '1');
      }

      if (this.logoCatecheseFile) {
        formData.append('logo_catechese', this.logoCatecheseFile);
      } else if (this.deleteLogoCatechese) {
        formData.append('supprimer_logo_catechese', '1');
      }

      this.formSubmit.emit(formData);
    } else {
      this.formSubmit.emit(formValues);
    }
  }

  public onCancel(): void {
    this.formCancel.emit();
  }
}
