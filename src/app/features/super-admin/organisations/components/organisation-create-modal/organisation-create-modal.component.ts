import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { SuperAdminOrganisationService } from '../../services/super-admin-organisation.service';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-organisation-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Nouvelle organisation"
      size="lg"
      (close)="onCancel()"
    >
      @if (generalError()) {
        <div class="alert-error" role="alert">
          <i class="bi bi-exclamation-triangle-fill mr-2" aria-hidden="true"></i>
          <span>{{ generalError() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <div class="form-grid">
          <!-- Bloc 1 — Informations Générales -->
          <div class="section-divider col-span-2 first-section">
            <h4 class="section-title">Informations Générales</h4>
          </div>

          <div class="form-group">
            <app-select
              id="org-type"
              label="Type d'organisation"
              [required]="true"
              [options]="typeOptions"
              formControlName="type_organisation"
              [error]="getFieldError('type_organisation')"
            />
          </div>

          <div class="form-group">
            <app-input
              id="org-nom"
              label="Nom de l'organisation"
              placeholder="Ex : OPPE Saint Michel Archange"
              [required]="true"
              formControlName="nom"
              [error]="getFieldError('nom')"
            />
          </div>

          <div class="form-group col-span-2">
            <app-input
              id="org-description"
              label="Description / Missions"
              placeholder="Mission pastorale, catéchèse ou groupe cible..."
              formControlName="description"
              [error]="getFieldError('description')"
            />
          </div>

          <!-- Bloc 2 — Rattachement Paroissial -->
          <div class="section-divider col-span-2">
            <h4 class="section-title">Rattachement</h4>
          </div>

          <div class="form-group col-span-2">
            <app-select
              id="org-paroisse"
              label="Paroisse de rattachement"
              hint="Choisissez une paroisse pour lier l'organisation, ou laissez 'Aucune' pour une organisation indépendante."
              [options]="paroisseOptions()"
              formControlName="paroisse_id"
              [error]="getFieldError('paroisse_id')"
            />
          </div>

          <!-- Bloc 3 — Coordonnées -->
          <div class="section-divider col-span-2">
            <h4 class="section-title">Coordonnées de l'Organisation</h4>
          </div>

          <div class="form-group">
            <app-input
              id="org-telephone"
              type="tel"
              label="Téléphone de contact"
              placeholder="+225 01 02 03 04 05"
              formControlName="telephone"
              [error]="getFieldError('telephone')"
            />
          </div>

          <div class="form-group">
            <app-input
              id="org-email"
              type="email"
              label="Email de contact"
              placeholder="contact@organisation.org"
              formControlName="email"
              [error]="getFieldError('email')"
            />
          </div>

          <div class="form-group col-span-2">
            <app-input
              id="org-adresse"
              label="Adresse géographique"
              placeholder="Ex : Bâtiment Pastoral, Cocody Angré"
              formControlName="adresse"
              [error]="getFieldError('adresse')"
            />
          </div>

          <!-- Bloc 4 — Responsable -->
          <div class="section-divider col-span-2">
            <h4 class="section-title">Responsable Principal</h4>
          </div>

          <div class="form-group col-span-2">
            <app-input
              id="org-resp-nom"
              label="Nom du responsable"
              placeholder="Ex : Sœur Marie-Claire"
              formControlName="responsable_nom"
              [error]="getFieldError('responsable_nom')"
            />
          </div>

          <div class="form-group">
            <app-input
              id="org-resp-telephone"
              type="tel"
              label="Téléphone du responsable"
              placeholder="+225 07 00 00 00 00"
              formControlName="responsable_telephone"
              [error]="getFieldError('responsable_telephone')"
            />
          </div>

          <div class="form-group">
            <app-input
              id="org-resp-email"
              type="email"
              label="Email du responsable"
              placeholder="responsable@organisation.org"
              formControlName="responsable_email"
              [error]="getFieldError('responsable_email')"
            />
          </div>

          <!-- Bloc 5 — Logo & Identité Visuelle -->
          <div class="section-divider col-span-2">
            <h4 class="section-title">Logo & Identité Visuelle</h4>
          </div>

          <div class="form-group col-span-2 logo-upload-wrapper">
            <div class="logo-preview-row">
              @if (logoPreview()) {
                <img [src]="logoPreview()" alt="Logo preview" class="logo-preview-img" />
              } @else {
                <div class="logo-placeholder">
                  <i class="bi bi-image"></i>
                </div>
              }
              <div class="logo-actions">
                <input
                  type="file"
                  #logoInput
                  (change)="onFileSelected($event)"
                  accept="image/png, image/jpeg, image/webp"
                  style="display: none;"
                />
                <app-btn
                  variant="outline"
                  size="sm"
                  (btnClick)="logoInput.click()"
                >
                  <i class="bi bi-cloud-arrow-up me-1"></i>
                  <span>{{ logoPreview() ? 'Remplacer le logo' : 'Téléverser un logo' }}</span>
                </app-btn>

                @if (logoPreview()) {
                  <app-btn
                    variant="ghost"
                    size="sm"
                    (btnClick)="removeLogo()"
                  >
                    <i class="bi bi-trash text-danger"></i>
                    <span>Supprimer</span>
                  </app-btn>
                }
              </div>
            </div>
            <span class="upload-hint">Formats acceptés : PNG, JPG, WebP. Taille maximale : 2 Mo.</span>
          </div>
        </div>
      </form>

      <div modal-footer class="modal-actions">
        <app-btn
          variant="secondary"
          [disabled]="loading()"
          (btnClick)="onCancel()"
        >
          Annuler
        </app-btn>

        <app-btn
          variant="primary"
          [loading]="loading()"
          [disabled]="loading()"
          (btnClick)="onSubmit()"
        >
          Créer l'organisation
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .alert-error {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md, 8px);
      color: #b91c1c;
      font-size: 0.875rem;
    }
    .mr-2 {
      margin-right: 0.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .col-span-2 {
      grid-column: span 2;
    }
    .section-divider {
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      margin-top: 0.25rem;
    }
    .first-section {
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }
    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }
    .logo-upload-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .logo-preview-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logo-preview-img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .logo-placeholder {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-md, 8px);
      background-color: var(--bg-muted, #f8fafc);
      border: 1px dashed var(--border-color, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #94a3b8);
      font-size: 1.5rem;
    }
    .logo-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .upload-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .col-span-2 {
        grid-column: span 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationCreateModalComponent implements OnInit {
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();
  public readonly created = output<void>();

  protected readonly loading = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly serverFieldErrors = signal<Record<string, string[]>>({});
  protected readonly logoPreview = signal<string | null>(null);
  protected logoFile: File | null = null;

  protected readonly typeOptions: SelectOption[] = [
    { label: 'OPPE — Office Paroissial de la Pastorale des Enfants', value: 'OPPE' },
    { label: 'OPPJ — Office Paroissial de la Pastorale des Jeunes', value: 'OPPJ' },
    { label: 'OPPA — Office Paroissial de la Pastorale des Adultes', value: 'OPPA' },
  ];

  protected readonly paroisseOptions = signal<SelectOption[]>([
    { label: 'Aucune (Organisation indépendante)', value: '' },
  ]);

  protected readonly form: FormGroup = new FormGroup({
    type_organisation: new FormControl<string>('OPPE', [Validators.required]),
    nom: new FormControl<string>('', [Validators.required, Validators.maxLength(255)]),
    description: new FormControl<string>(''),
    paroisse_id: new FormControl<string>(''),
    telephone: new FormControl<string>(''),
    email: new FormControl<string>('', [Validators.email]),
    adresse: new FormControl<string>(''),
    responsable_nom: new FormControl<string>(''),
    responsable_telephone: new FormControl<string>(''),
    responsable_email: new FormControl<string>('', [Validators.email]),
  });

  public ngOnInit(): void {
    this.loadParoisses();
  }

  private loadParoisses(): void {
    this.paroisseService.getParoisses({ per_page: 100 }).subscribe({
      next: (res) => {
        const options: SelectOption[] = [
          { label: 'Aucune (Organisation indépendante)', value: '' },
          ...(res.data || []).map((p) => ({
            label: `${p.nom_paroisse} (${p.code_paroisse || p.ville || 'Paroisse'})`,
            value: p.id,
          })),
        ];
        this.paroisseOptions.set(options);
      },
      error: () => {
        // Fallback keep default "Aucune"
      },
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.toast.error('Erreur', 'Le logo ne doit pas dépasser 2 Mo.');
        return;
      }
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.logoPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  protected removeLogo(): void {
    this.logoFile = null;
    this.logoPreview.set(null);
  }

  protected getFieldError(fieldName: string): string {
    const serverErr = this.serverFieldErrors()[fieldName];
    if (serverErr && serverErr.length > 0) {
      return serverErr[0];
    }
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['email']) return 'Adresse email invalide.';
    if (control.errors['maxlength']) return 'Longueur maximale dépassée.';
    return '';
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.generalError.set(null);
    this.serverFieldErrors.set({});

    const rawValues = this.form.value;
    const isIndependent = !rawValues.paroisse_id || rawValues.paroisse_id === '';

    let payload: FormData | Record<string, any>;

    if (this.logoFile) {
      const formData = new FormData();
      formData.append('type_organisation', rawValues.type_organisation);
      formData.append('nom', rawValues.nom);
      if (rawValues.description) formData.append('description', rawValues.description);
      if (isIndependent) {
        formData.append('independant', '1');
      } else {
        formData.append('paroisse_id', rawValues.paroisse_id);
      }
      if (rawValues.telephone) formData.append('telephone', rawValues.telephone);
      if (rawValues.email) formData.append('email', rawValues.email);
      if (rawValues.adresse) formData.append('adresse', rawValues.adresse);
      if (rawValues.responsable_nom) formData.append('responsable_nom', rawValues.responsable_nom);
      if (rawValues.responsable_telephone) formData.append('responsable_telephone', rawValues.responsable_telephone);
      if (rawValues.responsable_email) formData.append('responsable_email', rawValues.responsable_email);
      formData.append('logo', this.logoFile);
      payload = formData;
    } else {
      payload = {
        type_organisation: rawValues.type_organisation,
        nom: rawValues.nom,
        description: rawValues.description || null,
        paroisse_id: isIndependent ? null : rawValues.paroisse_id,
        independant: isIndependent ? true : false,
        telephone: rawValues.telephone || null,
        email: rawValues.email || null,
        adresse: rawValues.adresse || null,
        responsable_nom: rawValues.responsable_nom || null,
        responsable_telephone: rawValues.responsable_telephone || null,
        responsable_email: rawValues.responsable_email || null,
      };
    }

    this.orgService.createOrganisation(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Succès', 'Organisation créée avec succès.');
        this.resetForm();
        this.created.emit();
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 422 && err.error?.errors) {
          this.serverFieldErrors.set(err.error.errors);
          this.generalError.set(err.error.message || 'Veuillez corriger les erreurs de saisie.');
        } else {
          this.generalError.set(err.error?.message || 'Erreur lors de la création de l\'organisation.');
        }
      },
    });
  }

  public onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.form.reset({
      type_organisation: 'OPPE',
      nom: '',
      description: '',
      paroisse_id: '',
      telephone: '',
      email: '',
      adresse: '',
      responsable_nom: '',
      responsable_telephone: '',
      responsable_email: '',
    });
    this.logoFile = null;
    this.logoPreview.set(null);
    this.generalError.set(null);
    this.serverFieldErrors.set({});
  }
}
