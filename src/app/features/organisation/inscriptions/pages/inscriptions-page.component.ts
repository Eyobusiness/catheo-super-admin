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
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { CatheoImportModalComponent } from '../components/catheo-import-modal.component';
import { PelerinageService } from '../../pelerinages/services/pelerinage.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CatechumeneItem } from '../../catheo-population/models/catheo-population.model';
import {
  CampagnePelerinage,
  StoreInscriptionPayload,
  TarifPelerinage,
} from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-inscriptions-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    CatheoImportModalComponent,
  ],
  template: `
    <div class="inscriptions-page-container">
      <app-page-header
        title="Enregistrement d'Inscription"
        subtitle="Formulaire de saisie directe d'un participant au pèlerinage paroissial"
        badge="Inscriptions"
      >
        <div page-actions class="header-actions">
          @if (isModeLiee()) {
            <app-btn
              variant="secondary"
              icon="cloud-arrow-down"
              (btnClick)="openCatheoImport()"
            >
              Importer depuis CATHEO
            </app-btn>
          }
          <app-btn
            variant="ghost"
            icon="people"
            (btnClick)="navigateToParticipants()"
          >
            Voir les participants
          </app-btn>
        </div>
      </app-page-header>

      <!-- Cartes de synthèse -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Campagne active"
          [value]="currentCampagneNom()"
          subtitle="Campagne sélectionnée"
          icon="bi bi-compass"
          theme="primary"
        />

        <app-stat-card
          title="Capacité d'accueil"
          [value]="currentCampagneCapacite()"
          subtitle="Places prévues"
          icon="bi bi-person-check"
          theme="accent"
        />

        <app-stat-card
          title="Inscriptions enregistrées"
          [value]="currentCampagneInscrits()"
          subtitle="Dossiers reçus"
          icon="bi bi-journal-check"
          theme="success"
        />

        <app-stat-card
          title="Mode organisation"
          [value]="orgModeLabel()"
          [subtitle]="isModeLiee() ? 'Passerelle CATHEO connectée' : 'Organisation autonome'"
          icon="bi bi-diagram-3"
          [theme]="isModeLiee() ? 'primary' : 'warning'"
        />
      </div>

      <!-- Formulaire principal -->
      <div class="form-wrapper-card mt-6">
        <div class="form-card-header">
          <div class="header-title-box">
            <i class="bi bi-person-plus-fill header-icon"></i>
            <div>
              <h3 class="form-title">Dossier d'inscription du participant</h3>
              <p class="form-subtitle">Remplissez les informations d'identité, la formule tarifaire et l'éventuel acompte.</p>
            </div>
          </div>

          @if (isModeLiee()) {
            <button
              type="button"
              class="btn-catheo-badge"
              (click)="openCatheoImport()"
              title="Pré-remplir les champs avec un catéchumène"
            >
              <i class="bi bi-lightning-charge-fill mr-1"></i>
              Importer de la Catéchèse
            </button>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="inscription-form">
          <!-- 1. CAMPAGNE ET TARIF -->
          <div class="form-section">
            <span class="section-title">
              <i class="bi bi-flag-fill mr-1"></i> 1. Destination & Tarification
            </span>
            <div class="form-grid-2">
              <div class="form-group">
                <app-select
                  label="Campagne de pèlerinage"
                  [required]="true"
                  [options]="campagneOptions()"
                  formControlName="campagne_id"
                  [error]="getFieldError('campagne_id')"
                />
              </div>

              <div class="form-group">
                <app-select
                  label="Catégorie tarifaire"
                  [required]="true"
                  [options]="tarifOptions()"
                  formControlName="tarif_pelerinage_id"
                  [error]="getFieldError('tarif_pelerinage_id')"
                />
              </div>
            </div>
          </div>

          <!-- 2. IDENTITÉ DU PARTICIPANT -->
          <div class="form-section">
            <span class="section-title">
              <i class="bi bi-person-vcard-fill mr-1"></i> 2. Identité du participant
            </span>
            <div class="form-grid-2">
              <div class="form-group">
                <app-input
                  label="Nom"
                  placeholder="Ex: KOUADIO"
                  [required]="true"
                  formControlName="nom"
                  [error]="getFieldError('nom')"
                />
              </div>

              <div class="form-group">
                <app-input
                  label="Prénoms"
                  placeholder="Ex: Emmanuel Jean"
                  [required]="true"
                  formControlName="prenoms"
                  [error]="getFieldError('prenoms')"
                />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <app-select
                  label="Genre / Sexe"
                  [required]="true"
                  [options]="sexeOptions"
                  formControlName="sexe"
                  [error]="getFieldError('sexe')"
                />
              </div>

              <div class="form-group">
                <app-input
                  type="date"
                  label="Date de naissance"
                  formControlName="date_naissance"
                  [error]="getFieldError('date_naissance')"
                />
              </div>

              <div class="form-group">
                <app-input
                  type="tel"
                  label="Téléphone de contact"
                  placeholder="Ex: 0701020304"
                  [required]="true"
                  formControlName="telephone"
                  [error]="getFieldError('telephone')"
                />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <app-input
                  type="email"
                  label="Adresse Email (optionnel)"
                  placeholder="Ex: pelerin@eglise.ci"
                  formControlName="email"
                  [error]="getFieldError('email')"
                />
              </div>

              <div class="form-group">
                <app-select
                  label="Taille du kit / T-shirt (optionnel)"
                  [options]="tailleOptions"
                  formControlName="taille"
                  [error]="getFieldError('taille')"
                />
              </div>
            </div>
          </div>

          <!-- 3. RÈGLEMENT INITIAL / ACOMPTE -->
          <div class="form-section">
            <span class="section-title">
              <i class="bi bi-cash-stack mr-1"></i> 3. Paiement initial ou Acompte (Optionnel)
            </span>
            <div class="form-grid-2">
              <div class="form-group">
                <app-input
                  type="number"
                  label="Montant versé aujourd'hui (FCFA)"
                  placeholder="Ex: 25000 (laisser vide si 0)"
                  formControlName="montant_initial"
                  [error]="getFieldError('montant_initial')"
                />
              </div>

              <div class="form-group">
                <app-select
                  label="Mode de règlement initial"
                  [options]="modePaiementOptions"
                  formControlName="mode_paiement"
                  [error]="getFieldError('mode_paiement')"
                />
              </div>
            </div>
          </div>

          <!-- 4. REMARQUES & CONDITIONS PARTICULIÈRES -->
          <div class="form-section">
            <span class="section-title">
              <i class="bi bi-chat-square-text-fill mr-1"></i> 4. Informations médicales ou remarques
            </span>
            <div class="form-group">
              <app-textarea
                label="Observations médicales ou contraintes alimentaires"
                placeholder="Ex: Allergies, traitement en cours, contact d'urgence..."
                [rows]="3"
                formControlName="remarques"
                [error]="getFieldError('remarques')"
              />
            </div>
          </div>

          <!-- Actions formulaire -->
          <div class="form-submit-row">
            <app-btn
              type="button"
              variant="secondary"
              (btnClick)="onResetForm()"
              [disabled]="isSubmitting()"
            >
              Réinitialiser
            </app-btn>

            <app-btn
              type="submit"
              variant="primary"
              size="lg"
              icon="check2-circle"
              [loading]="isSubmitting()"
            >
              Enregistrer l'inscription
            </app-btn>
          </div>
        </form>
      </div>

      <!-- Modal d'importation CATHEO -->
      <app-catheo-import-modal
        [isOpen]="isCatheoModalOpen()"
        (close)="closeCatheoModal()"
        (selected)="onCatheoItemSelected($event)"
      />
    </div>
  `,
  styles: [`
    .inscriptions-page-container {
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .form-wrapper-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .form-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      flex-wrap: wrap;
    }
    .header-title-box {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon {
      font-size: 2rem;
      color: var(--primary-600, #2563eb);
    }
    .form-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .form-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary, #64748b);
      margin: 0.2rem 0 0 0;
    }
    .btn-catheo-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-catheo-badge:hover {
      background: #dbeafe;
      border-color: #93c5fd;
      transform: translateY(-1px);
    }
    .inscription-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      padding-bottom: 0.5rem;
      display: flex;
      align-items: center;
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
    .form-submit-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionsPageComponent implements OnInit {
  private readonly pelerinageService = inject(PelerinageService);
  private readonly contextService = inject(OrganisationContextService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly isSubmitting = signal<boolean>(false);
  public readonly campagnes = signal<CampagnePelerinage[]>([]);
  public readonly selectedCampagneId = signal<string>('');
  public readonly tarifs = signal<TarifPelerinage[]>([]);
  public readonly isCatheoModalOpen = signal<boolean>(false);

  public readonly orgContext = this.contextService.context;
  public readonly isModeLiee = computed(() => {
    const org = this.orgContext();
    return org?.mode === 'liee' || !!org?.paroisse_id;
  });

  public readonly orgModeLabel = computed(() => {
    return this.isModeLiee() ? 'Liée à la Paroisse' : 'Indépendante';
  });

  public readonly currentCampagne = computed(() => {
    return this.campagnes().find((c) => String(c.id) === this.selectedCampagneId()) || null;
  });

  public readonly currentCampagneNom = computed(() => {
    const c = this.currentCampagne();
    return c ? `${c.nom} (${c.destination})` : 'Aucune';
  });

  public readonly currentCampagneCapacite = computed(() => {
    const c = this.currentCampagne();
    return c ? `${c.capacite || 0} places` : '—';
  });

  public readonly currentCampagneInscrits = computed(() => {
    const c = this.currentCampagne();
    return c ? `${c.total_inscrits || 0} inscrits` : '—';
  });

  public readonly campagneOptions = computed<SelectOption[]>(() => {
    return this.campagnes().map((c) => ({
      label: `${c.nom} — ${c.destination} (${c.statut})`,
      value: String(c.id),
    }));
  });

  public readonly tarifOptions = computed<SelectOption[]>(() => {
    return this.tarifs().map((t) => ({
      label: `${t.libelle} — ${t.montant.toLocaleString('fr-FR')} FCFA`,
      value: String(t.id),
    }));
  });

  public readonly sexeOptions: SelectOption[] = [
    { label: 'Masculin (M)', value: 'M' },
    { label: 'Féminin (F)', value: 'F' },
  ];

  public readonly tailleOptions: SelectOption[] = [
    { label: 'Non spécifié', value: '' },
    { label: 'Enfant (6-8 ans)', value: '6-8 ans' },
    { label: 'Enfant (10-12 ans)', value: '10-12 ans' },
    { label: 'Adolescent / S', value: 'S' },
    { label: 'M (Moyen)', value: 'M' },
    { label: 'L (Large)', value: 'L' },
    { label: 'XL (Extra Large)', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
  ];

  public readonly modePaiementOptions: SelectOption[] = [
    { label: 'Espèces', value: 'especes' },
    { label: 'Mobile Money (Wave / Orange / MTN)', value: 'mobile_money' },
    { label: 'Chèque', value: 'cheque' },
    { label: 'Virement bancaire', value: 'virement' },
  ];

  public readonly form = new FormGroup({
    campagne_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    tarif_pelerinage_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    nom: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    prenoms: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    sexe: new FormControl<'M' | 'F'>('M', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    date_naissance: new FormControl<string | null>(null),
    telephone: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(150)],
    }),
    taille: new FormControl<string>('', {
      nonNullable: true,
    }),
    montant_initial: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
    mode_paiement: new FormControl<string>('especes', {
      nonNullable: true,
    }),
    remarques: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  public ngOnInit(): void {
    this.form.get('campagne_id')?.valueChanges.subscribe((cid) => {
      if (cid) {
        this.onCampagneSelected(cid);
      }
    });
    this.loadCampagnes();
  }

  public loadCampagnes(): void {
    this.pelerinageService.getCampagnes().subscribe({
      next: ({ data }) => {
        this.campagnes.set(data);
        if (data.length > 0 && !this.selectedCampagneId()) {
          const first = String(data[0].id);
          this.selectedCampagneId.set(first);
          this.form.patchValue({ campagne_id: first });
          this.loadTarifs(first);
        }
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les campagnes.');
      },
    });
  }

  public loadTarifs(campagneId: string): void {
    if (!campagneId) return;
    this.pelerinageService.getTarifs(campagneId).subscribe({
      next: (list) => {
        const activeOnly = list.filter((t) => t.statut === 'actif');
        this.tarifs.set(activeOnly.length > 0 ? activeOnly : list);
        if (list.length > 0) {
          this.form.patchValue({ tarif_pelerinage_id: String(list[0].id) });
        }
      },
    });
  }

  public onCampagneSelected(val: string | number): void {
    const cid = String(val);
    this.selectedCampagneId.set(cid);
    this.loadTarifs(cid);
  }

  public getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Ce champ est obligatoire.';
    if (control.errors['email']) return 'Email invalide.';
    if (control.errors['min']) return 'Montant invalide.';
    return '';
  }

  public openCatheoImport(): void {
    this.isCatheoModalOpen.set(true);
  }

  public closeCatheoModal(): void {
    this.isCatheoModalOpen.set(false);
  }

  public onCatheoItemSelected(item: CatechumeneItem): void {
    const c = item.catechumene;
    if (c) {
      this.form.patchValue({
        nom: c.nom || '',
        prenoms: c.prenoms || '',
        sexe: c.sexe || 'M',
        date_naissance: c.date_naissance || null,
        telephone: c.telephone || c.contact_parent || '',
      });
      this.toast.success(
        'Données importées',
        `${c.nom} ${c.prenoms} a été pré-rempli dans le formulaire.`
      );
    }
    this.isCatheoModalOpen.set(false);
  }

  private calculateAge(dateStr: string): number | null {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Champs incomplets', 'Veuillez vérifier les champs obligatoires.');
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const payload: StoreInscriptionPayload = {
      nom: raw.nom.trim(),
      prenoms: raw.prenoms.trim(),
      sexe: raw.sexe,
      age: raw.date_naissance ? this.calculateAge(raw.date_naissance) : null,
      telephone: raw.telephone.trim(),
      email: raw.email.trim() || undefined,
      tarif_pelerinage_id: Number(raw.tarif_pelerinage_id),
      taille: raw.taille.trim() || undefined,
      observation: raw.remarques.trim() || undefined,
    };

    const campagneId = raw.campagne_id;

    this.pelerinageService.createInscription(campagneId, payload).subscribe({
      next: (ins) => {
        // Si un montant initial est spécifié, enregistrer le premier paiement
        const montantInit = raw.montant_initial ? Number(raw.montant_initial) : 0;
        if (montantInit > 0) {
          this.pelerinageService
            .createPaiement(campagneId, ins.id, {
              montant: montantInit,
              mode_paiement: raw.mode_paiement as any,
              observation: 'Acompte initial à l’inscription',
            })
            .subscribe({
              next: () => {
                this.finishInscription(ins.nom_complet || `${ins.nom} ${ins.prenoms}`);
              },
              error: () => {
                this.toast.warning(
                  'Inscription créée',
                  "L'inscription a été créée mais l'enregistrement de l'acompte initial a échoué. Vous pourrez l'ajouter depuis la caisse."
                );
                this.finishInscription(ins.nom_complet || `${ins.nom} ${ins.prenoms}`);
              },
            });
        } else {
          this.finishInscription(ins.nom_complet || `${ins.nom} ${ins.prenoms}`);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || err.message || "Erreur lors de l'enregistrement.";
        this.toast.error('Erreur', msg);
      },
    });
  }

  private finishInscription(nom: string): void {
    this.isSubmitting.set(false);
    this.toast.success(
      'Inscription validée',
      `Le participant ${nom} a été inscrit avec succès au pèlerinage.`
    );
    this.router.navigate(['/organisation/participants']);
  }

  public onResetForm(): void {
    const currentCid = this.selectedCampagneId();
    const currentTid = this.tarifs().length > 0 ? String(this.tarifs()[0].id) : '';
    this.form.reset({
      campagne_id: currentCid,
      tarif_pelerinage_id: currentTid,
      sexe: 'M',
      mode_paiement: 'especes',
    });
  }

  public navigateToParticipants(): void {
    this.router.navigate(['/organisation/participants']);
  }
}
