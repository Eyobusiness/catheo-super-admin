import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { LoadingStateComponent } from '../../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormuleService } from '../../services/formule.service';
import { Formule, FormuleStatut } from '../../models/formule.model';

@Component({
  selector: 'app-formule-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <app-loading-state message="Chargement des détails de la formule..." />
      } @else if (hasError()) {
        <app-error-state
          title="Impossible de charger la formule"
          [message]="errorMessage()"
          (retry)="loadData()"
        />
      } @else if (formule()) {
        <app-page-header
          [title]="formule()!.nom"
          [subtitle]="'Formule tarifaire — Code : ' + formule()!.code"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Formules', path: '/super-admin/formules' },
            { label: formule()!.nom }
          ]"
        >
          <div page-actions class="header-actions">
            <app-btn
              [variant]="'secondary'"
              [size]="'md'"
              (btnClick)="goBack()"
            >
              <i class="bi bi-arrow-left"></i>
              <span>Retour</span>
            </app-btn>

            <app-btn
              [variant]="'primary'"
              [size]="'md'"
              (btnClick)="navigateToEdit()"
            >
              <i class="bi bi-pencil"></i>
              <span>Modifier</span>
            </app-btn>

            @if (formule()!.statut === 'actif') {
              <app-btn
                [variant]="'warning'"
                [size]="'md'"
                (btnClick)="promptStatusChange('inactif')"
              >
                <i class="bi bi-pause-circle"></i>
                <span>Désactiver</span>
              </app-btn>
            } @else {
              <app-btn
                [variant]="'success'"
                [size]="'md'"
                (btnClick)="promptStatusChange('actif')"
              >
                <i class="bi bi-check-circle"></i>
                <span>Activer</span>
              </app-btn>
            }

            <app-btn
              [variant]="'danger'"
              [size]="'md'"
              (btnClick)="promptDelete()"
            >
              <i class="bi bi-trash"></i>
              <span>Supprimer</span>
            </app-btn>
          </div>
        </app-page-header>

        <div class="detail-grid">
          <!-- Carte 1 : Identification & Rattachement -->
          <app-card title="Identification & Rattachement" class="info-card">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Code Formule</span>
                <span class="info-value code-pill">{{ formule()!.code }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Nom</span>
                <span class="info-value font-medium">{{ formule()!.nom }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Produit SaaS rattaché</span>
                <div class="info-value product-link">
                  @if (formule()!.produit) {
                    <button
                      type="button"
                      class="btn-link-product"
                      (click)="navigateToProduit(formule()!.produit!.id)"
                    >
                      <i class="bi bi-box-arrow-up-right"></i>
                      <span>{{ formule()!.produit!.nom }} ({{ formule()!.produit!.code }})</span>
                    </button>
                  } @else {
                    <span class="text-muted">Produit #{{ formule()!.produit_id }}</span>
                  }
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Statut</span>
                <div class="info-value">
                  <app-badge
                    [variant]="formule()!.statut === 'actif' ? 'success' : 'neutral'"
                    [label]="formule()!.statut === 'actif' ? 'Actif' : 'Inactif'"
                  />
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Ordre d'affichage</span>
                <span class="info-value">{{ formule()!.ordre !== undefined ? formule()!.ordre : 0 }}</span>
              </div>

              <div class="info-item full-width">
                <span class="info-label">Description</span>
                <p class="info-desc">{{ formule()!.description || 'Aucune description spécifique.' }}</p>
              </div>
            </div>
          </app-card>

          <!-- Carte 2 : Tarification & Facturation -->
          <app-card title="Tarification & Facturation" class="info-card">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Type d'offre</span>
                <div class="info-value">
                  @if (formule()!.est_gratuite) {
                    <span class="free-badge">OFFRE GRATUITE</span>
                  } @else {
                    <span class="paid-badge">OFFRE PAYANTE</span>
                  }
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Montant Facturé</span>
                <div class="info-value price-display">
                  @if (formule()!.est_gratuite) {
                    <span class="amount">0 XOF</span>
                  } @else {
                    <span class="amount">{{ formule()!.montant | number }} {{ formule()!.devise }}</span>
                  }
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Périodicité</span>
                <span class="info-value periodicity-val">
                  <i class="bi bi-calendar-event"></i>
                  <span>{{ formule()!.periodicite === 'annuelle' ? 'Annuelle' : 'Mensuelle' }}</span>
                </span>
              </div>

              <div class="info-item">
                <span class="info-label">Devise</span>
                <span class="info-value">{{ formule()!.devise || 'XOF' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Date de création</span>
                <span class="info-value text-muted">{{ formule()!.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Dernière modification</span>
                <span class="info-value text-muted">{{ formule()!.updated_at | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Dialogue de confirmation (statut ou suppression) -->
        <app-confirm-dialog
          [isOpen]="confirmDialogOpen()"
          [title]="confirmTitle()"
          [message]="confirmMessage()"
          [variant]="confirmVariant()"
          [confirmText]="confirmActionLabel()"
          [loading]="actionLoading()"
          (confirmed)="executeConfirmedAction()"
          (cancelled)="closeConfirmDialog()"
        />
      }
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      padding: 0.5rem 0;
    }
    .full-width {
      grid-column: span 2;
    }
    @media (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #64748b);
    }
    .info-value {
      font-size: 0.9375rem;
      color: var(--text-primary, #0f172a);
    }
    .code-pill {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background-color: var(--neutral-100, #f1f5f9);
      border-radius: var(--radius-sm, 4px);
      font-family: monospace;
      font-weight: 600;
      width: fit-content;
    }
    .btn-link-product {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      padding: 0;
      color: var(--primary-600, #0284c7);
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9375rem;
    }
    .btn-link-product:hover {
      text-decoration: underline;
    }
    .info-desc {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }
    .text-muted {
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }
    .free-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background-color: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
      border: 1px solid var(--success-200, #a7f3d0);
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-sm, 4px);
    }
    .paid-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background-color: var(--primary-50, #eff6ff);
      color: var(--primary-700, #1d4ed8);
      border: 1px solid var(--primary-200, #bfdbfe);
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-sm, 4px);
    }
    .price-display .amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .periodicity-val {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormuleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formuleService = inject(FormuleService);
  private readonly toast = inject(ToastService);

  protected formuleId = '';
  protected readonly formule = signal<Formule | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Confirmation dialog
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private confirmActionType: 'status' | 'delete' = 'status';
  private targetStatus: FormuleStatut = 'actif';

  public ngOnInit(): void {
    this.formuleId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.formuleId) {
      this.router.navigate(['/super-admin/formules']);
      return;
    }
    this.loadData();
  }

  public loadData(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.formuleService.getFormule(this.formuleId).subscribe({
      next: (data) => {
        this.formule.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des détails de la formule.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/formules']);
  }

  public navigateToEdit(): void {
    this.router.navigate(['/super-admin/formules', this.formuleId, 'modifier']);
  }

  public navigateToProduit(produitId: string | number): void {
    this.router.navigate(['/super-admin/produits', produitId]);
  }

  protected promptStatusChange(newStatus: FormuleStatut): void {
    const f = this.formule();
    if (!f) return;

    this.confirmActionType = 'status';
    this.targetStatus = newStatus;
    if (newStatus === 'inactif') {
      this.confirmTitle.set('Désactiver la formule');
      this.confirmMessage.set(
        `Voulez-vous désactiver la formule « ${f.nom} » ? Elle ne sera plus proposée pour de nouvelles souscriptions.`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Désactiver');
    } else {
      this.confirmTitle.set('Activer la formule');
      this.confirmMessage.set(
        `Voulez-vous activer la formule « ${f.nom} » ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    }

    this.confirmDialogOpen.set(true);
  }

  protected promptDelete(): void {
    const f = this.formule();
    if (!f) return;

    this.confirmActionType = 'delete';
    this.confirmTitle.set('Supprimer la formule');
    this.confirmMessage.set(
      `Êtes-vous certain de vouloir supprimer la formule « ${f.nom} » (${f.code}) ? Cette suppression est définitive.`
    );
    this.confirmVariant.set('danger');
    this.confirmActionLabel.set('Supprimer définitivement');
    this.confirmDialogOpen.set(true);
  }

  protected executeConfirmedAction(): void {
    if (!this.formule()) return;

    this.actionLoading.set(true);
    if (this.confirmActionType === 'status') {
      this.formuleService.toggleStatus(this.formuleId).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success(
            'Statut mis à jour',
            `La formule « ${updated.nom} » est désormais ${updated.statut}.`
          );
          this.loadData();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors du changement de statut de la formule.'
          );
        },
      });
    } else {
      this.formuleService.deleteFormule(this.formuleId).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.success('Suppression réussie', 'Formule supprimée avec succès.');
          this.router.navigate(['/super-admin/formules']);
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors de la suppression de la formule.'
          );
        },
      });
    }
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
  }
}
