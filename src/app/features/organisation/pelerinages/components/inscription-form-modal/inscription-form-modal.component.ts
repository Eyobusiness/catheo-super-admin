import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import {
  InscriptionPelerinage,
  StoreInscriptionPayload,
  TarifPelerinage,
} from '../../models/pelerinage.model';
import { PelerinageService } from '../../services/pelerinage.service';
import { CatheoPopulationService } from '../../../catheo-population/services/catheo-population.service';
import { CatechumeneItem } from '../../../catheo-population/models/catheo-population.model';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-inscription-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Inscrire un participant au pèlerinage"
      size="lg"
      (close)="onCancel()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="inscription-form">
        @if (serverError()) {
          <div class="alert-error mb-4" role="alert">
            <i class="bi bi-exclamation-triangle-fill mr-2"></i>
            {{ serverError() }}
          </div>
        }

        <!-- Type de participant -->
        <div class="type-toggle-group mb-4">
          <label class="form-label required mb-1">Type de participant</label>
          <div class="toggle-buttons">
            <button
              type="button"
              class="toggle-btn"
              [class.is-active]="form.get('type_participant')?.value === 'EXTERNE'"
              (click)="setTypeParticipant('EXTERNE')"
            >
              <i class="bi bi-person mr-1"></i>
              Participant Externe
            </button>
            <button
              type="button"
              class="toggle-btn"
              [class.is-active]="form.get('type_participant')?.value === 'CATECHUMENE'"
              (click)="setTypeParticipant('CATECHUMENE')"
            >
              <i class="bi bi-mortarboard mr-1"></i>
              Catéchumène CATHEO
            </button>
          </div>
        </div>

        <div class="form-grid">
          <!-- Sélection du Forfait / Tarif -->
          <div class="form-group col-span-2">
            <label for="tarif_pelerinage_id" class="form-label required">Forfait / Tarif appliqué</label>
            <select
              id="tarif_pelerinage_id"
              formControlName="tarif_pelerinage_id"
              class="form-select"
            >
              <option [ngValue]="null">Sélectionnez un forfait</option>
              @for (t of activeTarifs(); track t.id) {
                <option [ngValue]="t.id">
                  {{ t.libelle }} — {{ t.montant }} {{ t.devise || 'FCFA' }}
                </option>
              }
            </select>
            @if (form.get('tarif_pelerinage_id')?.invalid && form.get('tarif_pelerinage_id')?.touched) {
              <span class="field-error">Veuillez sélectionner un tarif valide.</span>
            }
          </div>

          <!-- Si Catéchumène CATHEO : Sélecteur de catéchumène -->
          @if (form.get('type_participant')?.value === 'CATECHUMENE') {
            <div class="form-group col-span-2">
              <label for="catechumene_id" class="form-label required">Catéchumène de la paroisse</label>
              <select
                id="catechumene_id"
                formControlName="catechumene_id"
                (change)="onCatechumeneSelected($event)"
                class="form-select"
              >
                <option [ngValue]="null">Sélectionnez un catéchumène de l'année active</option>
                @for (c of catechumenes(); track c.inscription_id) {
                  <option [ngValue]="c.catechumene?.id">
                    {{ c.catechumene?.nom_complet }} — {{ c.section?.nom }} ({{ c.niveau?.nom }})
                  </option>
                }
              </select>
              @if (form.get('catechumene_id')?.invalid && form.get('catechumene_id')?.touched) {
                <span class="field-error">Veuillez choisir un catéchumène.</span>
              }
            </div>
          }

          <!-- Si Externe (ou pré-rempli pour catéchumène) -->
          <div class="form-group">
            <label for="nom" class="form-label" [class.required]="isExterne()">Nom</label>
            <input
              id="nom"
              type="text"
              formControlName="nom"
              class="form-input"
              placeholder="Ex : KOUASSI"
            />
            @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
              <span class="field-error">Le nom est obligatoire.</span>
            }
          </div>

          <div class="form-group">
            <label for="prenoms" class="form-label" [class.required]="isExterne()">Prénoms</label>
            <input
              id="prenoms"
              type="text"
              formControlName="prenoms"
              class="form-input"
              placeholder="Ex : Jean-Eudes"
            />
            @if (form.get('prenoms')?.invalid && form.get('prenoms')?.touched) {
              <span class="field-error">Le prénom est obligatoire.</span>
            }
          </div>

          <div class="form-group">
            <label for="sexe" class="form-label">Genre</label>
            <select id="sexe" formControlName="sexe" class="form-select">
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="age" class="form-label" [class.required]="isExterne()">Âge (ans)</label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              formControlName="age"
              class="form-input"
              placeholder="Ex : 24"
            />
            @if (form.get('age')?.invalid && form.get('age')?.touched) {
              <span class="field-error">L'âge est obligatoire (entre 1 et 120 ans).</span>
            }
          </div>

          <div class="form-group">
            <label for="taille" class="form-label" [class.required]="isExterne()">Taille T-shirt / Kit</label>
            <select id="taille" formControlName="taille" class="form-select">
              <option value="">Sélectionner une taille</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXXL">XXXL</option>
            </select>
            @if (form.get('taille')?.invalid && form.get('taille')?.touched) {
              <span class="field-error">La taille est obligatoire (M, L, XL, XXL, XXXL).</span>
            }
          </div>

          <div class="form-group">
            <label for="telephone" class="form-label" [class.required]="isExterne()">Téléphone</label>
            <input
              id="telephone"
              type="tel"
              formControlName="telephone"
              class="form-input"
              placeholder="Ex : 0701020304"
            />
            @if (form.get('telephone')?.invalid && form.get('telephone')?.touched) {
              <span class="field-error">Le numéro de téléphone est obligatoire.</span>
            }
          </div>

          <!-- Contacts d'urgence -->
          <div class="form-group">
            <label for="contact_urgence_nom" class="form-label">Nom du contact d'urgence</label>
            <input
              id="contact_urgence_nom"
              type="text"
              formControlName="contact_urgence_nom"
              class="form-input"
              placeholder="Nom du parent ou proche"
            />
          </div>

          <div class="form-group">
            <label for="contact_urgence_telephone" class="form-label">Tél. urgence</label>
            <input
              id="contact_urgence_telephone"
              type="tel"
              formControlName="contact_urgence_telephone"
              class="form-input"
              placeholder="Numéro joignable 24h/24"
            />
          </div>

          <div class="form-group col-span-2">
            <label for="observation" class="form-label">Observations / Régime particulier</label>
            <textarea
              id="observation"
              rows="2"
              formControlName="observation"
              class="form-textarea"
              placeholder="Allergies, traitement médical ou remarques..."
            ></textarea>
          </div>
        </div>
      </form>

      <div modal-footer class="modal-actions-footer">
        <app-btn variant="secondary" (btnClick)="onCancel()" [disabled]="isSubmitting()">
          Annuler
        </app-btn>
        <app-btn
          variant="primary"
          icon="check-lg"
          [loading]="isSubmitting()"
          (btnClick)="onSubmit()"
        >
          Valider l'inscription
        </app-btn>
      </div>
    </app-modal>
  `,
  styles: [`
    .inscription-form {
      display: flex;
      flex-direction: column;
    }
    .type-toggle-group {
      display: flex;
      flex-direction: column;
    }
    .toggle-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .toggle-btn {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-surface, #ffffff);
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toggle-btn.is-active {
      background: var(--color-primary-light, #e0e7ff);
      border-color: var(--color-primary, #6366f1);
      color: var(--color-primary, #6366f1);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
    }
    .col-span-2 {
      grid-column: span 2;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
    }
    .form-label.required::after {
      content: ' *';
      color: var(--danger-500, #ef4444);
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--text-color, #1e293b);
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
    }
    .alert-error {
      padding: 0.75rem 1rem;
      background-color: var(--danger-50, #fef2f2);
      border: 1px solid var(--danger-200, #fecaca);
      border-radius: var(--radius-md, 8px);
      color: var(--danger-700, #b91c1c);
      font-size: 0.875rem;
    }
    .modal-actions-footer {
      display: flex;
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
export class InscriptionFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pelerinageService = inject(PelerinageService);
  private readonly catheoService = inject(CatheoPopulationService);
  private readonly toast = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagneId = input.required<number | string>();
  public readonly tarifs = input<TarifPelerinage[]>([]);

  public readonly close = output<void>();
  public readonly saved = output<InscriptionPelerinage>();

  public readonly isSubmitting = signal<boolean>(false);
  public readonly serverError = signal<string | null>(null);
  public readonly catechumenes = signal<CatechumeneItem[]>([]);

  public readonly activeTarifs = computed(() =>
    this.tarifs().filter((t) => t.statut === 'actif')
  );

  public readonly form: FormGroup = this.fb.group({
    type_participant: ['EXTERNE', [Validators.required]],
    tarif_pelerinage_id: [null, [Validators.required]],
    catechumene_id: [null],
    nom: ['', [Validators.maxLength(255)]],
    prenoms: ['', [Validators.maxLength(255)]],
    age: [null],
    sexe: ['M'],
    taille: [''],
    telephone: [''],
    adresse: [''],
    contact_urgence_nom: [''],
    contact_urgence_telephone: [''],
    observation: [''],
  });

  public isExterne = computed(
    () => this.form.get('type_participant')?.value === 'EXTERNE'
  );

  public ngOnInit(): void {
    this.loadCatheoPopulation();
    this.updateValidators('EXTERNE');
  }

  public setTypeParticipant(type: 'EXTERNE' | 'CATECHUMENE'): void {
    this.form.patchValue({ type_participant: type });
    this.updateValidators(type);
  }

  private updateValidators(type: 'EXTERNE' | 'CATECHUMENE'): void {
    const nomCtrl = this.form.get('nom');
    const prenomsCtrl = this.form.get('prenoms');
    const ageCtrl = this.form.get('age');
    const telCtrl = this.form.get('telephone');
    const tailleCtrl = this.form.get('taille');
    const catCtrl = this.form.get('catechumene_id');

    if (type === 'EXTERNE') {
      nomCtrl?.setValidators([Validators.required, Validators.maxLength(255)]);
      prenomsCtrl?.setValidators([Validators.required, Validators.maxLength(255)]);
      ageCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(120)]);
      telCtrl?.setValidators([Validators.required, Validators.maxLength(30)]);
      tailleCtrl?.setValidators([Validators.required]);
      catCtrl?.clearValidators();
      catCtrl?.setValue(null);
    } else {
      nomCtrl?.clearValidators();
      prenomsCtrl?.clearValidators();
      ageCtrl?.clearValidators();
      telCtrl?.clearValidators();
      tailleCtrl?.clearValidators();
      catCtrl?.setValidators([Validators.required]);
    }
    nomCtrl?.updateValueAndValidity();
    prenomsCtrl?.updateValueAndValidity();
    ageCtrl?.updateValueAndValidity();
    telCtrl?.updateValueAndValidity();
    tailleCtrl?.updateValueAndValidity();
    catCtrl?.updateValueAndValidity();
  }

  public onCatechumeneSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const catVal = this.form.get('catechumene_id')?.value ?? select.value;
    const item = this.catechumenes().find(
      (c) => String(c.catechumene?.id) === String(catVal) || String(c.catechumene?.uuid) === String(catVal)
    );
    if (item && item.catechumene) {
      this.form.patchValue({
        catechumene_id: item.catechumene.id,
        nom: item.catechumene.nom,
        prenoms: item.catechumene.prenoms,
        sexe: item.catechumene.sexe || 'M',
        telephone: item.catechumene.telephone || '',
        contact_urgence_nom: item.catechumene.nom_pere || item.catechumene.nom_mere || '',
        contact_urgence_telephone: item.catechumene.contact_parent || '',
      });
    }
  }

  private loadCatheoPopulation(): void {
    this.catheoService.getPopulation({ per_page: 100 }).subscribe({
      next: (res) => this.catechumenes.set(res.data),
      error: () => {},
    });
  }

  public resetForm(): void {
    this.serverError.set(null);
    this.form.reset({
      type_participant: 'EXTERNE',
      tarif_pelerinage_id: null,
      catechumene_id: null,
      nom: '',
      prenoms: '',
      age: null,
      sexe: 'M',
      taille: '',
      telephone: '',
      adresse: '',
      contact_urgence_nom: '',
      contact_urgence_telephone: '',
      observation: '',
    });
    this.updateValidators('EXTERNE');
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const f = this.form.value;
    const payload: StoreInscriptionPayload = {
      tarif_pelerinage_id: Number(f.tarif_pelerinage_id),
      type_participant: f.type_participant,
      catechumene_id: f.catechumene_id ? Number(f.catechumene_id) : null,
      nom: f.nom?.trim() || null,
      prenoms: f.prenoms?.trim() || null,
      age: f.age ? Number(f.age) : null,
      sexe: f.sexe || 'M',
      taille: f.taille || null,
      telephone: f.telephone?.trim() || null,
      adresse: f.adresse?.trim() || null,
      contact_urgence_nom: f.contact_urgence_nom?.trim() || null,
      contact_urgence_telephone: f.contact_urgence_telephone?.trim() || null,
      observation: f.observation?.trim() || null,
    };

    this.pelerinageService.createInscription(this.campagneId(), payload).subscribe({
      next: (inscription) => {
        this.isSubmitting.set(false);
        this.toast.success(
          'Inscription enregistrée',
          `Inscription enregistrée avec succès (Réf: ${inscription.reference}).`
        );
        this.saved.emit(inscription);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          err?.error?.message || "Erreur lors de l'enregistrement de l'inscription."
        );
      },
    });
  }

  public onCancel(): void {
    this.resetForm();
    this.close.emit();
  }
}
