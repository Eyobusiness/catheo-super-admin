import {
  OnInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../../shared/components/select/select.component';
import { SuperAdminOrganisationService } from '../../services/super-admin-organisation.service';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  SuperAdminOrganisation,
  UpdateOrganisationInfoDto,
} from '../../models/super-admin-organisation.model';

@Component({
  selector: 'app-organisation-edit-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
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
          <div class="form-group col-span-2">
            <app-input
              id="org-nom"
              label="Nom de l'organisation"
              placeholder="Ex : OPPE Sainte Monique (Office Paroissial de la Pastorale des Enfants)"
              [required]="true"
              formControlName="nom"
              [error]="getFieldError('nom')"
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

          <div class="form-group">
            <app-input
              id="org-telephone"
              type="tel"
              label="Téléphone de contact"
              placeholder="+225 01 00 00 00 00"
              formControlName="telephone"
              [error]="getFieldError('telephone')"
            />
          </div>

          <div class="form-group col-span-2">
            <app-input
              id="org-adresse"
              label="Adresse géographique"
              placeholder="Ex : Bâtiment Pastoral, 1er étage"
              formControlName="adresse"
              [error]="getFieldError('adresse')"
            />
          </div>

          <div class="form-group col-span-2">
            <app-input
              id="org-description"
              label="Description / Objet"
              placeholder="Description des missions de cet espace..."
              formControlName="description"
              [error]="getFieldError('description')"
            />
          </div>

          <div class="section-divider col-span-2">
            <h4 class="section-title">Rattachement Paroissial</h4>
          </div>

          <div class="form-group col-span-2">
            <app-select
              id="org-edit-paroisse"
              label="Paroisse de rattachement"
              hint="Sélectionnez une paroisse ou laissez 'Aucune' pour une organisation indépendante."
              [options]="paroisseOptions()"
              formControlName="paroisse_id"
              [error]="getFieldError('paroisse_id')"
            />
          </div>

          <div class="section-divider col-span-2">
            <h4 class="section-title">Coordonnées du Responsable</h4>
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
              id="org-resp-email"
              type="email"
              label="Email du responsable"
              placeholder="responsable@organisation.org"
              formControlName="responsable_email"
              [error]="getFieldError('responsable_email')"
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

          <div class="section-divider col-span-2">
            <h4 class="section-title">Logo & Identité Visuelle</h4>
          </div>

          <div class="form-group col-span-2 logo-upload-wrapper">
            <div class="logo-preview-row">
              @if (logoPreview() || currentLogoUrl()) {
                <img [src]="logoPreview() || currentLogoUrl()" alt="Logo preview" class="logo-preview-img" />
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
                  <span>{{ logoPreview() || currentLogoUrl() ? 'Remplacer le logo' : 'Téléverser un logo' }}</span>
                </app-btn>

                @if (logoPreview() || currentLogoUrl()) {
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
          Enregistrer les modifications
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
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
      margin-top: 0.5rem;
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
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationEditModalComponent implements OnInit {
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly organisation = input.required<SuperAdminOrganisation>();

  public readonly close = output<void>();
  public readonly organisationUpdated = output<any>();

  protected readonly loading = signal<boolean>(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly validationErrors = signal<Record<string, string[]>>({});

  protected readonly currentLogoUrl = signal<string | null>(null);
  protected readonly logoPreview = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly deleteLogoFlag = signal<boolean>(false);

  protected readonly paroisseOptions = signal<SelectOption[]>([
    { label: 'Aucune (Organisation indépendante)', value: '' },
  ]);

  protected readonly form = new FormGroup({
    nom: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    telephone: new FormControl<string>('', { nonNullable: true }),
    adresse: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    paroisse_id: new FormControl<string>('', { nonNullable: true }),
    responsable_nom: new FormControl<string>('', { nonNullable: true }),
    responsable_email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    responsable_telephone: new FormControl<string>('', { nonNullable: true }),
  });

  public ngOnInit(): void {
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
    });
  }

  constructor() {
    effect(() => {
      const org = this.organisation();
      if (org) {
        const rawOrg = org as any;
        const paroisseUuid =
          rawOrg.paroisse_configuration?.uuid ||
          rawOrg.paroisse?.uuid ||
          (rawOrg.mode === 'independant' ? '' : (rawOrg.paroisse_id || rawOrg.paroisse_configuration_id || ''));

        this.form.patchValue({
          nom: org.nom || '',
          email: org.email || '',
          telephone: org.telephone || '',
          adresse: org.adresse || '',
          description: org.description || '',
          paroisse_id: paroisseUuid || '',
          responsable_nom: org.responsable_nom || org.responsable?.nom || '',
          responsable_email: org.responsable_email || org.responsable?.email || '',
          responsable_telephone: org.responsable_telephone || org.responsable?.telephone || '',
        });
        this.currentLogoUrl.set(org.logo_url || org.logo || null);
        this.logoPreview.set(null);
        this.selectedFile.set(null);
        this.deleteLogoFlag.set(false);
      }
    });
  }

  protected modalTitle(): string {
    return `Modifier l'organisation · ${this.organisation().nom}`;
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.generalError.set('Le fichier sélectionné dépasse la taille limite de 2 Mo.');
        return;
      }
      this.selectedFile.set(file);
      this.deleteLogoFlag.set(false);

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected removeLogo(): void {
    this.selectedFile.set(null);
    this.logoPreview.set(null);
    this.currentLogoUrl.set(null);
    this.deleteLogoFlag.set(true);
  }

  protected getFieldError(fieldName: string): string {
    const serverErrors = this.validationErrors()[fieldName];
    if (serverErrors && serverErrors.length > 0) {
      return serverErrors[0];
    }
    const ctrl = this.form.get(fieldName);
    if (ctrl && ctrl.touched && ctrl.invalid) {
      if (ctrl.errors?.['required']) return 'Ce champ est obligatoire.';
      if (ctrl.errors?.['email']) return 'Format d’email invalide.';
    }
    return '';
  }

  protected onCancel(): void {
    if (!this.loading()) {
      this.generalError.set(null);
      this.validationErrors.set({});
      this.close.emit();
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.generalError.set(null);
    this.validationErrors.set({});

    const raw = this.form.getRawValue();
    const orgId = this.organisation().uuid || this.organisation().id;

    if (this.selectedFile() || this.deleteLogoFlag()) {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('nom', raw.nom.trim());
      if (raw.email.trim()) formData.append('email', raw.email.trim());
      if (raw.telephone.trim()) formData.append('telephone', raw.telephone.trim());
      if (raw.adresse.trim()) formData.append('adresse', raw.adresse.trim());
      if (raw.description.trim()) formData.append('description', raw.description.trim());
      formData.append('paroisse_id', raw.paroisse_id.trim());
      if (!raw.paroisse_id.trim()) formData.append('independant', '1');
      if (raw.responsable_nom.trim()) formData.append('responsable_nom', raw.responsable_nom.trim());
      if (raw.responsable_email.trim()) formData.append('responsable_email', raw.responsable_email.trim());
      if (raw.responsable_telephone.trim()) formData.append('responsable_telephone', raw.responsable_telephone.trim());

      if (this.selectedFile()) {
        formData.append('logo', this.selectedFile()!);
      }
      if (this.deleteLogoFlag()) {
        formData.append('supprimer_logo', '1');
      }

      this.orgService.updateOrganisation(orgId, formData).subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err) => this.handleError(err),
      });
    } else {
      const payload: UpdateOrganisationInfoDto = {
        nom: raw.nom.trim(),
        email: raw.email.trim() || undefined,
        telephone: raw.telephone.trim() || undefined,
        adresse: raw.adresse.trim() || undefined,
        description: raw.description.trim() || undefined,
        paroisse_id: raw.paroisse_id.trim() || null,
        independant: !raw.paroisse_id.trim(),
        responsable_nom: raw.responsable_nom.trim() || undefined,
        responsable_email: raw.responsable_email.trim() || undefined,
        responsable_telephone: raw.responsable_telephone.trim() || undefined,
      };

      this.orgService.updateOrganisation(orgId, payload).subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err) => this.handleError(err),
      });
    }
  }

  private handleSuccess(res: any): void {
    this.loading.set(false);
    this.toast.show(
      'success',
      'Organisation mise à jour',
      'Les coordonnées, informations et logo ont été enregistrés avec succès.'
    );
    this.organisationUpdated.emit(res);
    this.close.emit();
  }

  private handleError(err: any): void {
    this.loading.set(false);
    if (err.status === 422 && err.error?.errors) {
      this.validationErrors.set(err.error.errors);
      this.generalError.set(err.error.message || 'Vérifiez les données saisies.');
    } else if (err.status === 403) {
      this.generalError.set('Action non autorisée. Privilèges Super Admin requis.');
    } else {
      this.generalError.set(err.error?.message || 'Erreur lors de la mise à jour.');
    }
  }
}

