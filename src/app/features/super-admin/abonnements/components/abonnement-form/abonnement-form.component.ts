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
import { AbonnementFormData } from '../../models/abonnement.model';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { FormuleService } from '../../../formules/services/formule.service';
import { SuperAdminOrganisationService } from '../../../organisations/services/super-admin-organisation.service';
import { AbonnementService } from '../../services/abonnement.service';
import { Paroisse } from '../../../paroisses/models/paroisse.model';
import { Formule } from '../../../formules/models/formule.model';
import { SuperAdminOrganisation } from '../../../organisations/models/super-admin-organisation.model';

@Component({
  selector: 'app-abonnement-form',
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
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="abonnement-form">
      <!-- Section 1 : Cible & Formule SaaS -->
      <app-card title="Souscription & Module SaaS" class="form-card">
        <div class="form-grid">
          <!-- Switch Bénéficiaire : Paroisse vs Organisation -->
          <div class="form-col-span-2">
            <label class="toggle-group-label">Type de bénéficiaire</label>
            <div class="target-switch-container">
              <button
                type="button"
                class="target-btn"
                [class.is-active]="targetType() === 'paroisse'"
                (click)="setTargetType('paroisse')"
              >
                <i class="bi bi-building me-1"></i>
                <span>Paroisse (CATHEO)</span>
              </button>

              <button
                type="button"
                class="target-btn"
                [class.is-active]="targetType() === 'organisation'"
                (click)="setTargetType('organisation')"
              >
                <i class="bi bi-diagram-3 me-1"></i>
                <span>Organisation (OPPE, OPPJ, OPPA)</span>
              </button>
            </div>
          </div>

          @if (targetType() === 'paroisse') {
            <div class="form-col-span-2">
              <app-select
                label="Paroisse souscriptrice"
                [options]="paroisseOptions()"
                formControlName="paroisse_configuration_id"
                [required]="true"
                [error]="getFieldError('paroisse_configuration_id')"
              />
            </div>
          } @else {
            <div class="form-col-span-2">
              <app-select
                label="Organisation souscriptrice (OPPE, OPPJ, OPPA)"
                [options]="organisationOptions()"
                formControlName="organisation_id"
                [required]="true"
                [error]="getFieldError('organisation_id')"
              />
            </div>
          }

          <div class="form-col-span-2">
            <app-select
              label="Formule d'abonnement éligible"
              [options]="formuleOptions()"
              formControlName="formule_id"
              [required]="true"
              [error]="getFieldError('formule_id')"
            />
          </div>


          <!-- Aperçu de la formule choisie -->
          @if (selectedFormule()) {
            <div class="form-col-span-2">
              <div class="formule-summary-card" [class.is-free]="selectedFormule()!.est_gratuite">
                <div class="summary-header">
                  <div class="product-badge">
                    <i class="bi bi-box-seam"></i>
                    <span>{{ selectedFormule()!.produit?.nom || 'Produit SaaS' }} ({{ selectedFormule()!.produit?.code }})</span>
                  </div>
                  <span class="period-badge">
                    {{ selectedFormule()!.periodicite === 'annuelle' ? 'Périodicité Annuelle' : 'Périodicité Mensuelle' }}
                  </span>
                </div>

                <div class="summary-body">
                  @if (selectedFormule()!.est_gratuite) {
                    <div class="free-banner">
                      <span class="free-tag">FORMULE GRATUITE</span>
                      <p class="summary-notice">
                        Montant de l'abonnement : <strong>0 XOF</strong>. L'abonnement sera activé directement dès sa création, sans génération d'échéance ni facture.
                      </p>
                    </div>
                  } @else {
                    <div class="paid-banner">
                      <div class="price-line">
                        <span class="amount-val">{{ selectedFormule()!.montant | number }} {{ selectedFormule()!.devise }}</span>
                        <span class="period-val">/ {{ selectedFormule()!.periodicite }}</span>
                      </div>
                      <p class="summary-notice">
                        Le montant contractuel sera automatiquement figé lors de la souscription. L'abonnement sera placé en statut <em>« En attente »</em> et une première échéance de facturation sera émise par le backend.
                      </p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </app-card>

      <!-- Section 2 : Conditions contractuelles & Dates -->
      <app-card title="Conditions Contractuelles" class="form-card">
        <div class="form-grid">
          <div>
            <app-input
              label="Date d'effet (Début)"
              type="date"
              formControlName="date_debut"
              hint="Par défaut : date du jour"
              [error]="getFieldError('date_debut')"
            />
          </div>

          <div>
            <app-input
              label="Date d'échéance (Fin)"
              type="date"
              formControlName="date_fin"
              hint="Optionnel (calculée selon la périodicité si non renseignée)"
              [error]="getFieldError('date_fin')"
            />
          </div>

          <div class="form-col-span-2">
            <label class="checkbox-container">
              <input
                type="checkbox"
                formControlName="renouvellement_automatique"
                id="renouvellement_auto"
              />
              <span class="checkbox-label">
                <strong>Renouvellement automatique</strong>
                <span class="checkbox-subtext">
                  Générer automatiquement une nouvelle échéance à l'arrivée du terme contractuel.
                </span>
              </span>
            </label>
          </div>

          <div class="form-col-span-2">
            <app-textarea
              label="Observations administratives (optionnel)"
              placeholder="Notes, référence de convention paroissiale ou conditions particulières..."
              formControlName="observation"
              [rows]="3"
              [error]="getFieldError('observation')"
            />
          </div>
        </div>
      </app-card>

      <!-- Barre d'actions -->
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
          <span>Créer la souscription</span>
        </app-btn>
      </div>
    </form>
  `,
  styles: [`
    .abonnement-form {
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
    .formule-summary-card {
      padding: 1.25rem;
      background-color: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .formule-summary-card.is-free {
      background-color: var(--success-50, #f0fdf4);
      border-color: var(--success-200, #bbf7d0);
    }
    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .product-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--text-primary, #0f172a);
    }
    .period-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      background-color: var(--neutral-200, #e2e8f0);
      color: var(--text-secondary, #475569);
    }
    .free-banner {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .free-tag {
      display: inline-block;
      width: fit-content;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--success-700, #15803d);
      background-color: var(--success-100, #dcfce7);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      letter-spacing: 0.05em;
    }
    .paid-banner {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .price-line {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }
    .amount-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .period-val {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .summary-notice {
      font-size: 0.8125rem;
      color: var(--text-secondary, #475569);
      margin: 0;
      line-height: 1.4;
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
    .toggle-group-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin-bottom: 0.5rem;
      display: block;
    }
    .target-switch-container {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .target-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      color: var(--text-secondary, #475569);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .target-btn.is-active {
      background-color: #eff6ff;
      border-color: var(--color-primary-500, #3b82f6);
      color: var(--color-primary-700, #1d4ed8);
      font-weight: 600;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbonnementFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paroisseService = inject(ParoisseService);
  private readonly formuleService = inject(FormuleService);
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly abonnementService = inject(AbonnementService);

  public readonly loading = input<boolean>(false);
  public readonly serverErrors = input<Record<string, string[]>>({});

  public readonly formSubmit = output<any>();
  public readonly formCancel = output<void>();

  public readonly targetType = signal<'paroisse' | 'organisation'>('paroisse');
  protected readonly paroisseOptions = signal<SelectOption[]>([]);
  protected readonly organisationOptions = signal<SelectOption[]>([]);
  protected readonly formuleOptions = signal<SelectOption[]>([]);
  private readonly rawFormules = signal<Formule[]>([]);

  protected readonly selectedFormule = signal<Formule | null>(null);

  protected form!: FormGroup;

  constructor() {
    this.initForm();
  }

  public ngOnInit(): void {
    this.loadParoisses();
    this.loadOrganisations();
    this.loadFormulesCatheo();
  }

  public setTargetType(type: 'paroisse' | 'organisation'): void {
    this.targetType.set(type);
    this.form.get('formule_id')?.setValue('');
    this.selectedFormule.set(null);

    if (type === 'paroisse') {
      this.form.get('paroisse_configuration_id')?.setValidators([Validators.required]);
      this.form.get('organisation_id')?.clearValidators();
      this.loadFormulesCatheo();
    } else {
      this.form.get('organisation_id')?.setValidators([Validators.required]);
      this.form.get('paroisse_configuration_id')?.clearValidators();
      const currentOrgId = this.form.get('organisation_id')?.value;
      if (currentOrgId) {
        this.loadFormulesForOrganisation(currentOrgId);
      } else {
        this.formuleOptions.set([]);
      }
    }

    this.form.get('paroisse_configuration_id')?.updateValueAndValidity();
    this.form.get('organisation_id')?.updateValueAndValidity();
  }

  private initForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form = this.fb.group({
      paroisse_configuration_id: ['', [Validators.required]],
      organisation_id: [''],
      formule_id: ['', [Validators.required]],
      date_debut: [today],
      date_fin: [''],
      renouvellement_automatique: [true],
      observation: [''],
    });

    this.form.get('organisation_id')?.valueChanges.subscribe((orgId) => {
      if (this.targetType() === 'organisation' && orgId) {
        this.loadFormulesForOrganisation(orgId);
      }
    });

    this.form.get('formule_id')?.valueChanges.subscribe((val) => {
      this.onFormuleSelected(val);
    });
  }

  private loadParoisses(): void {
    this.paroisseService.getParoisses({ per_page: 100 }).subscribe({
      next: (res) => {
        const opts: SelectOption[] = res.data.map((p: Paroisse) => ({
          label: `${p.nom_paroisse} (${p.code_paroisse}) - ${p.ville}`,
          value: String((p as any).uuid || p.id),
        }));
        this.paroisseOptions.set(opts);
      },
      error: () => {},
    });
  }

  private loadOrganisations(): void {
    this.orgService.getOrganisations({ per_page: 100 }).subscribe({
      next: (res) => {
        const opts: SelectOption[] = res.data.map((o: SuperAdminOrganisation) => {
          const modeLabel = o.mode === 'independant' ? '[Indépendante]' : `[Paroisse: ${o.paroisse?.nom || '-'}]`;
          return {
            label: `${o.nom} (${o.type_organisation}) ${modeLabel}`,
            value: String(o.uuid || o.id),
          };
        });
        this.organisationOptions.set(opts);
      },
      error: () => {},
    });
  }

  private loadFormulesCatheo(): void {
    this.formuleService.getFormules({ all: true, statut: 'actif', produit: 'CATHEO' }).subscribe({
      next: (res: any) => {
        const list: Formule[] = Array.isArray(res) ? res : (res?.data || []);
        this.rawFormules.set(list);
        const opts: SelectOption[] = list.map((f: Formule) => {
          const tarif = f.est_gratuite
            ? 'Gratuit'
            : `${Number(f.montant).toLocaleString('fr-FR')} ${f.devise}`;
          return {
            label: `${f.nom} [${f.produit_nom || f.produit?.nom || 'CATHEO'}] — ${tarif} (${f.periodicite})`,
            value: String(f.uuid || f.id),
          };
        });
        this.formuleOptions.set(opts);
      },
      error: () => {},
    });
  }

  private loadFormulesForOrganisation(orgUuid: string): void {
    this.abonnementService.getOrganisationFormules(orgUuid).subscribe({
      next: (list: any[]) => {
        this.rawFormules.set(list);
        const opts: SelectOption[] = list.map((f: any) => {
          const tarif = f.est_gratuite
            ? 'Gratuit'
            : `${Number(f.montant).toLocaleString('fr-FR')} ${f.devise}`;
          return {
            label: `${f.nom} [${f.produit_nom || f.produit_code || 'Organisation'}] — ${tarif} (${f.periodicite})`,
            value: String(f.uuid || f.id),
          };
        });
        this.formuleOptions.set(opts);
      },
      error: () => {
        this.formuleOptions.set([]);
      },
    });
  }

  protected onFormuleSelected(formuleIdVal: string | number): void {
    const list = this.rawFormules() || [];
    const match = list.find(
      (f) => String(f.id) === String(formuleIdVal) || f.uuid === String(formuleIdVal)
    );
    this.selectedFormule.set(match || null);
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
    }
    return '';
  }

  public onSubmit(): void {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const isOrg = this.targetType() === 'organisation';

    const payload: any = {
      target_type: this.targetType(),
      formule_id: val.formule_id,
      date_debut: val.date_debut ? val.date_debut : null,
      date_fin: val.date_fin ? val.date_fin : null,
      renouvellement_automatique: Boolean(val.renouvellement_automatique),
      observation: val.observation ? String(val.observation).trim() : null,
    };

    if (isOrg) {
      payload.organisation_id = val.organisation_id;
    } else {
      payload.paroisse_configuration_id = val.paroisse_configuration_id;
    }

    this.formSubmit.emit(payload);
  }

  public onCancel(): void {
    this.formCancel.emit();
  }
}

