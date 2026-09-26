import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import {
  OrganisationAdminService,
  OrganisationProfileData,
  ParoisseItem,
} from '../../services/organisation-admin.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-organisation-info-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    InputComponent,
    TextareaComponent,
    StatCardComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="info-page-container">
      <app-page-header
        title="Paramètres & Informations de l'Organisation"
        subtitle="Mise à jour de l'identité pastorale, coordonnées, rattachement paroissial et visuels"
        [badge]="profile()?.type_organisation || 'Organisation'"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="loadProfile()"
          >
            Actualiser
          </app-btn>

          <app-btn
            variant="primary"
            icon="check2-circle"
            [loading]="isSaving()"
            (btnClick)="onSave()"
          >
            Enregistrer les modifications
          </app-btn>
        </div>
      </app-page-header>

      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadProfile()"
          />
        </div>
      }

      @if (!errorMessage() && profile()) {
        <!-- KPI Synthèse -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <app-stat-card
            title="Type d'organisation"
            [value]="profile()?.type_organisation || '—'"
            subtitle="Structure pastorale"
            icon="bi bi-diagram-3-fill"
            theme="primary"
          />

          <app-stat-card
            title="Mode de fonctionnement"
            [value]="profile()?.mode === 'liee' ? 'Liée' : 'Indépendante'"
            [subtitle]="profile()?.mode === 'liee' ? 'Rattachée à une paroisse' : 'Entité diocésaine / autonome'"
            icon="bi bi-link-45deg"
            [theme]="profile()?.mode === 'liee' ? 'success' : 'warning'"
          />

          <app-stat-card
            title="Paroisse de rattachement"
            [value]="currentParoisseNom()"
            [subtitle]="profile()?.mode === 'liee' ? (profile()?.paroisse?.code_paroisse || 'Active') : 'Aucune paroisse'"
            icon="bi bi-building"
            theme="accent"
          />

          <app-stat-card
            title="Statut du compte"
            [value]="profile()?.statut || 'actif'"
            subtitle="Accès opérationnel"
            icon="bi bi-shield-check"
            theme="success"
          />
        </div>

        <form [formGroup]="form" (ngSubmit)="onSave()" class="info-form-card mt-6">
          <!-- 1. IDENTITÉ & LOGO -->
          <div class="form-section">
            <h3 class="section-title">
              <i class="bi bi-image mr-1"></i> Identité visuelle & Dénomination
            </h3>

            <div class="logo-upload-wrap">
              <div class="logo-preview-box">
                @if (logoPreviewUrl() || profile()?.logo_url) {
                  <img
                    [src]="logoPreviewUrl() || profile()?.logo_url"
                    alt="Logo organisation"
                    class="logo-img"
                  />
                } @else {
                  <div class="logo-placeholder">
                    <i class="bi bi-building text-muted"></i>
                  </div>
                }
              </div>

              <div class="logo-upload-details">
                <span class="logo-title">Logo officiel de l'organisation</span>
                <span class="logo-hint">Format PNG, JPG ou WEBP. Taille max : 2 Mo.</span>
                <div class="file-btn-wrap">
                  <label class="btn-file-upload">
                    <i class="bi bi-cloud-arrow-up mr-1"></i> Choisir une nouvelle image
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onLogoSelected($event)"
                      style="display: none;"
                    />
                  </label>
                  @if (selectedLogoFile()) {
                    <span class="file-name-badge">
                      {{ selectedLogoFile()?.name }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <div class="form-grid-2 mt-4">
              <div class="form-group">
                <app-input
                  label="Nom officiel de l'organisation"
                  placeholder="Ex: OPPE Paroisse Saint Jean"
                  [required]="true"
                  formControlName="nom"
                  [error]="getFieldError('nom')"
                />
              </div>

              <div class="form-group">
                <app-input
                  label="Nom du responsable principal"
                  placeholder="Ex: Père Curé / Coordinateur Général"
                  formControlName="responsable"
                  [error]="getFieldError('responsable')"
                />
              </div>
            </div>

            <div class="form-group mt-3">
              <app-textarea
                label="Description & Mission pastorale"
                placeholder="Présentez les objectifs et activités de votre structure..."
                [rows]="3"
                formControlName="description"
                [error]="getFieldError('description')"
              />
            </div>
          </div>

          <!-- 2. MODE & RATTACHEMENT PAROISSIAL (VERROUILLÉ) -->
          <div class="form-section mt-6">
            <div class="section-title-wrap">
              <h3 class="section-title mb-0">
                <i class="bi bi-link-45deg mr-1"></i> Mode d'organisation & Rattachement Paroissial
              </h3>
              <span class="locked-badge">
                <i class="bi bi-lock-fill mr-1"></i> Verrouillé (Super Admin)
              </span>
            </div>

            <div class="locked-notice mt-3 mb-4">
              <i class="bi bi-shield-lock-fill notice-icon"></i>
              <div class="notice-body">
                <span class="notice-title">Attribution gérée par la Super Administration</span>
                <span class="notice-desc">
                  Le mode pastoral et la paroisse de rattachement sont configurés exclusivement par le Super Administrateur depuis son interface. Vous ne pouvez pas modifier ce rattachement vous-même.
                </span>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="locked-field-box">
                <div class="locked-field-top">
                  <span class="locked-field-label">Mode de l'organisation</span>
                  <span class="locked-mini-tag"><i class="bi bi-lock-fill"></i> Fixé</span>
                </div>
                <div class="locked-field-val">
                  <i [class]="profile()?.mode === 'liee' ? 'bi bi-building-check text-success mr-2' : 'bi bi-shield-check text-primary mr-2'"></i>
                  <span class="font-bold">
                    {{ profile()?.mode === 'liee' ? 'Organisation Liée à une Paroisse' : 'Organisation Indépendante' }}
                  </span>
                </div>
                <p class="locked-field-desc">
                  {{ profile()?.mode === 'liee' ? 'Connectée au registre paroissial et aux catéchumènes CATHEO.' : 'Structure autonome sans lien direct avec une paroisse locale.' }}
                </p>
              </div>

              <div class="locked-field-box">
                <div class="locked-field-top">
                  <span class="locked-field-label">Paroisse de rattachement</span>
                  <span class="locked-mini-tag"><i class="bi bi-lock-fill"></i> Fixé</span>
                </div>
                <div class="locked-field-val">
                  @if (profile()?.mode === 'liee') {
                    <i class="bi bi-geo-alt-fill text-danger mr-2"></i>
                    <span class="font-bold text-primary">{{ currentParoisseNom() }}</span>
                    @if (profile()?.paroisse?.code_paroisse) {
                      <span class="paroisse-code-pill ml-2">({{ profile()?.paroisse?.code_paroisse }})</span>
                    }
                  } @else {
                    <i class="bi bi-slash-circle text-muted mr-2"></i>
                    <span class="text-muted font-medium">Aucune paroisse (Organisation Indépendante)</span>
                  }
                </div>
                <p class="locked-field-desc">
                  @if (profile()?.mode === 'liee' && profile()?.paroisse?.ville) {
                    Ville : {{ profile()?.paroisse?.ville }}
                  } @else {
                    Seul le Super Admin peut affecter ou modifier la paroisse de rattachement.
                  }
                </p>
              </div>
            </div>
          </div>

          <!-- 3. COORDONNÉES & CONTACT -->
          <div class="form-section mt-6">
            <h3 class="section-title">
              <i class="bi bi-telephone mr-1"></i> Coordonnées & Contact
            </h3>

            <div class="form-grid-3">
              <div class="form-group">
                <app-input
                  type="tel"
                  label="Numéro de téléphone"
                  placeholder="Ex: 0701020304"
                  formControlName="telephone"
                  [error]="getFieldError('telephone')"
                />
              </div>

              <div class="form-group">
                <app-input
                  type="email"
                  label="Adresse Email officielle"
                  placeholder="Ex: contact@oppe-abidjan.ci"
                  formControlName="email"
                  [error]="getFieldError('email')"
                />
              </div>

              <div class="form-group">
                <app-input
                  label="Adresse géographique / Localisation"
                  placeholder="Ex: Rue des Jardins, Cocody"
                  formControlName="adresse"
                  [error]="getFieldError('adresse')"
                />
              </div>
            </div>
          </div>

          <!-- Bouton enregistrer en bas -->
          <div class="form-actions-bottom mt-6">
            <app-btn
              type="submit"
              variant="primary"
              size="lg"
              icon="check2-circle"
              [loading]="isSaving()"
            >
              Enregistrer les modifications
            </app-btn>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .info-page-container {
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .info-form-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.75rem;
      box-shadow: var(--shadow-sm);
    }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.5rem;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
    }
    .logo-upload-wrap {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.25rem;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      flex-wrap: wrap;
    }
    .logo-preview-box {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #cbd5e1);
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .logo-placeholder i {
      font-size: 2.5rem;
    }
    .logo-upload-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .logo-title {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary, #0f172a);
    }
    .logo-hint {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
    }
    .file-btn-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-file-upload {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 0.9rem;
      background: #ffffff;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary, #0f172a);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-file-upload:hover {
      background: #f1f5f9;
      border-color: var(--primary-400, #60a5fa);
    }
    .file-name-badge {
      font-size: 0.8rem;
      color: var(--primary-700, #1d4ed8);
      background: #eff6ff;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .form-grid-2 {
        grid-template-columns: 1fr 1fr;
      }
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 768px) {
      .form-grid-3 {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .locked-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 9999px;
    }
    .locked-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: var(--radius-md, 8px);
    }
    .notice-icon {
      font-size: 1.1rem;
      color: #d97706;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .notice-body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .notice-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #92400e;
    }
    .notice-desc {
      font-size: 0.75rem;
      color: #78350f;
      line-height: 1.4;
    }
    .locked-field-box {
      background: var(--bg-surface-elevated, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .locked-field-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .locked-field-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .locked-mini-tag {
      font-size: 0.6875rem;
      color: var(--text-muted, #64748b);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .locked-field-val {
      display: flex;
      align-items: center;
      font-size: 0.9375rem;
      color: var(--text-primary, #0f172a);
    }
    .paroisse-code-pill {
      font-size: 0.75rem;
      background: #e0e7ff;
      color: #3730a3;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .locked-field-desc {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0;
    }
    .form-actions-bottom {
      display: flex;
      justify-content: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationInfoPageComponent implements OnInit {
  private readonly adminService = inject(OrganisationAdminService);
  private readonly contextService = inject(OrganisationContextService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly profile = signal<OrganisationProfileData | null>(null);
  public readonly paroisses = signal<ParoisseItem[]>([]);

  public readonly selectedLogoFile = signal<File | null>(null);
  public readonly logoPreviewUrl = signal<string | null>(null);



  public readonly currentParoisseNom = computed(() => {
    const prof = this.profile();
    if (prof?.mode !== 'liee') return 'Aucune paroisse';
    if (prof.paroisse) return prof.paroisse.nom_paroisse;
    const match = this.paroisses().find((p) => p.id === prof.paroisse_id);
    return match?.nom_paroisse || 'Paroisse liée';
  });

  public readonly form = new FormGroup({
    nom: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    responsable: new FormControl<string>('', {
      nonNullable: true,
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
    telephone: new FormControl<string>('', {
      nonNullable: true,
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    adresse: new FormControl<string>('', {
      nonNullable: true,
    }),
    mode: new FormControl<'liee' | 'independant'>('liee', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paroisse_id: new FormControl<string | null>(null),
  });

  public ngOnInit(): void {
    this.form.get('mode')?.valueChanges.subscribe((val) => {
      this.onModeChanged(val as string);
    });
    this.loadProfile();
    this.loadParoisses();
  }

  public loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        const dataAny = data as any;
        const respNom = typeof data.responsable === 'object' && data.responsable !== null
          ? (data.responsable as any).nom
          : (data.responsable || dataAny.responsable_nom || '');
        const tel = data.telephone || dataAny.contact?.telephone || '';
        const mail = data.email || dataAny.contact?.email || '';
        const adr = data.adresse || dataAny.contact?.adresse || '';
        const pId = data.paroisse_id ? String(data.paroisse_id) : (dataAny.paroisse?.id ? String(dataAny.paroisse.id) : null);

        this.form.patchValue({
          nom: data.nom || '',
          responsable: respNom,
          description: data.description || '',
          telephone: tel,
          email: mail,
          adresse: adr,
          mode: data.mode || 'liee',
          paroisse_id: pId,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Impossible de charger les données du profil.');
      },
    });
  }

  public loadParoisses(): void {
    this.adminService.getParoisses().subscribe({
      next: (list) => this.paroisses.set(list),
      error: () => {},
    });
  }

  public onModeChanged(val: string | number): void {
    if (val === 'independant') {
      this.form.patchValue({ paroisse_id: null });
    }
  }

  public onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedLogoFile.set(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreviewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  public getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['email']) return 'Format d’email invalide.';
    return '';
  }

  public onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Champs incomplets', 'Veuillez renseigner les informations obligatoires.');
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();

    const formData = new FormData();
    formData.append('nom', raw.nom.trim());
    formData.append('responsable', raw.responsable.trim());
    formData.append('description', raw.description.trim());
    formData.append('telephone', raw.telephone.trim());
    formData.append('email', raw.email.trim());
    formData.append('adresse', raw.adresse.trim());
    const currentMode = this.profile()?.mode || 'liee';
    formData.append('mode', currentMode);

    const currentParoisseId = this.profile()?.paroisse_id;
    if (currentMode === 'liee' && currentParoisseId) {
      formData.append('paroisse_id', String(currentParoisseId));
    }

    const logo = this.selectedLogoFile();
    if (logo) {
      formData.append('logo', logo);
    }

    this.adminService.updateProfile(formData).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.profile.set(updated);
        this.selectedLogoFile.set(null);
        this.contextService.loadContext().subscribe({ error: () => {} });
        this.toast.success(
          'Profil mis à jour',
          "Les informations de l'organisation ont été enregistrées avec succès."
        );
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || err.message || 'Erreur lors de la sauvegarde.';
        this.toast.error('Erreur', msg);
      },
    });
  }
}
