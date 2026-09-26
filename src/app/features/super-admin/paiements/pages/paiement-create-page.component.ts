import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { PaiementService } from '../services/paiement.service';
import { EcheanceService } from '../services/echeance.service';
import { EcheanceAbonnement } from '../models/echeance.model';
import { CreatePaiementData } from '../models/paiement.model';
import { PaiementFormComponent } from '../components/paiement-form/paiement-form.component';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';

@Component({
  selector: 'app-paiement-create-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    ErrorStateComponent,
    PaiementFormComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Enregistrer un nouveau règlement"
        subtitle="Saisie d'un encaissement d'échéance d'abonnement SaaS"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Paiements', path: '/super-admin/paiements' },
          { label: 'Nouveau' }
        ]"
      >
        <div page-actions>
          <app-btn
            variant="outline"
            size="md"
            (btnClick)="goBack()"
          >
            <i class="bi bi-arrow-left me-1"></i>
            <span>Retour à la liste</span>
          </app-btn>
        </div>
      </app-page-header>

      @if (loadingEcheance()) {
        <div class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement de l'échéance...</span>
          </div>
          <p class="mt-2 text-muted">Récupération des données financières de l'échéance...</p>
        </div>
      } @else if (hasError()) {
        <app-error-state
          title="Erreur de chargement"
          [message]="errorMessage()"
          (retry)="initPage()"
        />
      } @else {
        <!-- Si aucune échéance n'est sélectionnée, afficher le sélecteur d'échéances -->
        @if (!selectedEcheance()) {
          <app-card title="Sélectionnez l'échéance à régler" class="mb-4">
            <div class="echeance-selector-box">
              <p class="selector-instructions">
                Veuillez sélectionner l'échéance d'abonnement pour laquelle vous souhaitez enregistrer un versement :
              </p>

              @if (echeanceOptions().length === 0) {
                <div class="alert alert-info">
                  <i class="bi bi-info-circle me-2"></i>
                  Aucune échéance en attente de paiement n'a été trouvée.
                </div>
              } @else {
                <div class="select-row">
                  <label class="form-label font-semibold mb-1" for="echeance-select">
                    Échéance en attente de règlement
                  </label>
                  <select
                    id="echeance-select"
                    class="filter-select w-100"
                    (change)="onSelectEcheanceChange($event)"
                  >
                    <option value="">-- Choisir une échéance --</option>
                    @for (opt of echeanceOptions(); track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                </div>
              }
            </div>
          </app-card>
        } @else {
          <!-- Formulaire de Paiement -->
          <div class="form-wrapper">
            @if (!routeEcheanceId) {
              <div class="mb-3 d-flex justify-content-between align-items-center">
                <span class="badge bg-light text-dark p-2 border">
                  Échéance sélectionnée : <strong>{{ selectedEcheance()!.reference }}</strong>
                </span>
                <app-btn
                  variant="ghost"
                  size="sm"
                  (btnClick)="clearSelectedEcheance()"
                >
                  <i class="bi bi-arrow-repeat me-1"></i>
                  Changer d'échéance
                </app-btn>
              </div>
            }

            <app-paiement-form
              [echeance]="selectedEcheance()!"
              [isSubmitting]="isSubmitting()"
              (submitted)="onSubmitPaiement($event)"
              (cancelled)="goBack()"
            />
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: #ffffff;
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid #e2e8f0;
    }

    .selector-instructions {
      font-size: 0.9375rem;
      color: #475569;
      margin-bottom: 1.25rem;
    }

    .select-row {
      max-width: 600px;
    }

    .form-wrapper {
      margin-top: 1rem;
    }

    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .d-flex { display: flex; }
    .justify-content-between { justify-content: space-between; }
    .align-items-center { align-items: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementCreatePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paiementService = inject(PaiementService);
  private readonly echeanceService = inject(EcheanceService);
  private readonly toast = inject(ToastService);
  private readonly cfaPipe = inject(CurrencyCfaPipe);

  protected readonly selectedEcheance = signal<EcheanceAbonnement | null>(null);
  protected readonly echeanceOptions = signal<SelectOption[]>([]);
  protected readonly loadingEcheance = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected routeEcheanceId: string | null = null;
  private echeancesCache: EcheanceAbonnement[] = [];

  public ngOnInit(): void {
    this.initPage();
  }

  public initPage(): void {
    this.routeEcheanceId = this.route.snapshot.queryParamMap.get('echeance_id');

    if (this.routeEcheanceId) {
      this.loadSingleEcheance(this.routeEcheanceId);
    } else {
      this.loadPendingEcheances();
    }
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/paiements']);
  }

  public clearSelectedEcheance(): void {
    this.selectedEcheance.set(null);
  }

  public onSelectEcheanceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onSelectEcheance(target.value);
  }

  public onSelectEcheance(echeanceId: string | number): void {
    const found = this.echeancesCache.find((e) => String(e.id) === String(echeanceId));
    if (found) {
      this.selectedEcheance.set(found);
    }
  }

  public onSubmitPaiement(data: CreatePaiementData): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.paiementService.createPaiement(data).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.toast.success(
          'Paiement enregistré',
          `Paiement ${created.reference} de ${this.cfaPipe.transform(created.montant, 'XOF')} enregistré avec succès.`
        );
        this.router.navigate(['/super-admin/paiements', created.id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(
          'Erreur d’enregistrement',
          err?.message || 'Erreur lors de l’enregistrement du règlement.'
        );
      },
    });
  }

  private loadSingleEcheance(id: string): void {
    this.loadingEcheance.set(true);
    this.hasError.set(false);

    this.echeanceService.getEcheance(id).subscribe({
      next: (ech) => {
        this.selectedEcheance.set(ech);
        this.loadingEcheance.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de charger l’échéance demandée.'
        );
        this.loadingEcheance.set(false);
      },
    });
  }

  private loadPendingEcheances(): void {
    this.loadingEcheance.set(true);
    this.hasError.set(false);

    this.echeanceService.getEcheances({ statut: 'en_attente', per_page: 50 }).subscribe({
      next: (res) => {
        this.echeancesCache = res.data;
        const options: SelectOption[] = res.data.map((e) => {
          const paroisse =
            e.abonnement?.paroisse?.nom_paroisse ||
            e.abonnement?.paroisse_nom ||
            'Paroisse inconnue';
          const restant = this.cfaPipe.transform(e.solde_restant, 'XOF');
          return {
            label: `${e.reference} — ${paroisse} (Reste: ${restant})`,
            value: e.id,
          };
        });
        this.echeanceOptions.set(options);
        this.loadingEcheance.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer la liste des échéances.'
        );
        this.loadingEcheance.set(false);
      },
    });
  }
}
