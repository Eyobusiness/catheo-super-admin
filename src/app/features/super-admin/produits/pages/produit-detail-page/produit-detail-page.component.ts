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
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ProduitService } from '../../services/produit.service';
import { FormuleService } from '../../../formules/services/formule.service';
import { Produit, ProduitStatut } from '../../models/produit.model';
import { Formule } from '../../../formules/models/formule.model';

@Component({
  selector: 'app-produit-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <app-loading-state message="Chargement des détails du produit..." />
      } @else if (hasError()) {
        <app-error-state
          title="Impossible de charger le produit"
          [message]="errorMessage()"
          (retry)="loadData()"
        />
      } @else if (produit()) {
        <app-page-header
          [title]="produit()!.nom"
          [subtitle]="'Module applicatif SaaS — Code : ' + produit()!.code"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Produits', path: '/super-admin/produits' },
            { label: produit()!.nom }
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

            @if (produit()!.statut === 'actif') {
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
          </div>
        </app-page-header>

        <!-- Informations Générales du Produit -->
        <div class="product-layout">
          <div class="main-column">
            <app-card title="Fiche d'identité du Produit" class="info-card">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Code Produit</span>
                  <span class="info-value code-pill">{{ produit()!.code }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Nom Officiel</span>
                  <span class="info-value font-medium">{{ produit()!.nom }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Statut Opérationnel</span>
                  <div class="info-value">
                    <app-badge
                      [variant]="produit()!.statut === 'actif' ? 'success' : 'danger'"
                      [label]="produit()!.statut === 'actif' ? 'Actif' : 'Inactif'"
                    />
                  </div>
                </div>

                <div class="info-item">
                  <span class="info-label">Icône associée</span>
                  <span class="info-value icon-val">
                    <i [class]="'bi bi-' + (produit()!.icone || 'box')"></i>
                    <span>{{ produit()!.icone || 'Aucune icône' }}</span>
                  </span>
                </div>

                <div class="info-item full-width">
                  <span class="info-label">Description du Module</span>
                  <p class="info-description">
                    {{ produit()!.description || 'Aucune description renseignée pour ce produit.' }}
                  </p>
                </div>

                <div class="info-item">
                  <span class="info-label">Date de création</span>
                  <span class="info-value text-muted">
                    {{ produit()!.created_at | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>

                <div class="info-item">
                  <span class="info-label">Dernière mise à jour</span>
                  <span class="info-value text-muted">
                    {{ produit()!.updated_at | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
              </div>
            </app-card>

            <!-- Formules Associées au Produit -->
            <app-card class="formules-card">
              <div card-header class="card-header-custom">
                <div class="header-left">
                  <h3 class="card-title">Formules d'abonnement rattachées</h3>
                  <span class="counter-badge">{{ formules().length }} formule(s)</span>
                </div>
                <app-btn
                  [variant]="'primary'"
                  [size]="'sm'"
                  (btnClick)="navigateToAddFormule()"
                >
                  <i class="bi bi-plus-lg"></i>
                  <span>Ajouter une formule</span>
                </app-btn>
              </div>

              @if (formulesLoading()) {
                <app-loading-state message="Chargement des formules..." />
              } @else if (formules().length === 0) {
                <app-empty-state
                  title="Aucune formule tarifaire"
                  message="Ce produit ne dispose actuellement d'aucune formule d'abonnement configurée."
                >
                  <div empty-actions>
                    <app-btn
                      [variant]="'primary'"
                      [size]="'sm'"
                      (btnClick)="navigateToAddFormule()"
                    >
                      <i class="bi bi-plus-lg"></i>
                      <span>Créer la première formule</span>
                    </app-btn>
                  </div>
                </app-empty-state>
              } @else {
                <div class="formules-grid">
                  @for (formule of formules(); track formule.id) {
                    <div class="formule-item-card" [class.inactive]="formule.statut === 'inactif'">
                      <div class="formule-card-header">
                        <div>
                          <h4 class="formule-name">{{ formule.nom }}</h4>
                          <span class="formule-code">{{ formule.code }}</span>
                        </div>
                        <app-badge
                          [variant]="formule.statut === 'actif' ? 'success' : 'neutral'"
                          [label]="formule.statut === 'actif' ? 'Actif' : 'Inactif'"
                        />
                      </div>

                      <div class="formule-card-body">
                        <div class="price-box">
                          @if (formule.est_gratuite) {
                            <span class="free-badge">GRATUIT</span>
                          } @else {
                            <span class="price-amount">{{ formule.montant | number }} {{ formule.devise }}</span>
                            <span class="price-period">/ {{ formule.periodicite }}</span>
                          }
                        </div>

                        @if (formule.description) {
                          <p class="formule-desc">{{ formule.description }}</p>
                        }
                      </div>

                      <div class="formule-card-footer">
                        <app-btn
                          [variant]="'ghost'"
                          [size]="'sm'"
                          (btnClick)="navigateToFormuleDetail(formule.id)"
                        >
                          <i class="bi bi-eye"></i>
                          <span>Détails</span>
                        </app-btn>

                        <app-btn
                          [variant]="'ghost'"
                          [size]="'sm'"
                          (btnClick)="navigateToFormuleEdit(formule.id)"
                        >
                          <i class="bi bi-pencil"></i>
                          <span>Modifier</span>
                        </app-btn>
                      </div>
                    </div>
                  }
                </div>
              }
            </app-card>
          </div>
        </div>

        <!-- Dialogue de confirmation de changement de statut -->
        <app-confirm-dialog
          [isOpen]="confirmDialogOpen()"
          [title]="confirmTitle()"
          [message]="confirmMessage()"
          [variant]="confirmVariant()"
          [confirmText]="confirmActionLabel()"
          [loading]="actionLoading()"
          (confirmed)="executeStatusChange()"
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
    }
    .product-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .main-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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
    @media (max-width: 768px) {
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
    .icon-val {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .info-description {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }
    .text-muted {
      color: var(--text-secondary, #64748b);
      font-size: 0.875rem;
    }
    /* Card Header Custom */
    .card-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .card-title {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .counter-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--text-secondary, #475569);
      border-radius: 9999px;
    }
    /* Formules Grid */
    .formules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      margin-top: 1rem;
    }
    .formule-item-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      transition: all var(--transition-fast, 150ms ease);
    }
    .formule-item-card:hover {
      border-color: var(--primary-300, #93c5fd);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
    }
    .formule-item-card.inactive {
      opacity: 0.7;
      background-color: var(--neutral-50, #f8fafc);
    }
    .formule-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .formule-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      margin: 0 0 0.2rem 0;
    }
    .formule-code {
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-secondary, #64748b);
    }
    .formule-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .price-box {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }
    .free-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      background-color: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
      border: 1px solid var(--success-200, #a7f3d0);
      font-size: 0.8125rem;
      font-weight: 700;
      border-radius: var(--radius-sm, 4px);
      letter-spacing: 0.05em;
    }
    .price-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .price-period {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .formule-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary, #475569);
      margin: 0;
      line-height: 1.4;
    }
    .formule-card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #f1f5f9);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly produitService = inject(ProduitService);
  private readonly formuleService = inject(FormuleService);
  private readonly toast = inject(ToastService);

  protected produitId = '';
  protected readonly produit = signal<Produit | null>(null);
  protected readonly formules = signal<Formule[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly formulesLoading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Confirmation dialog
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private targetStatus: ProduitStatut = 'actif';

  public ngOnInit(): void {
    this.produitId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.produitId) {
      this.router.navigate(['/super-admin/produits']);
      return;
    }
    this.loadData();
  }

  public loadData(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.produitService.getProduit(this.produitId).subscribe({
      next: (data) => {
        this.produit.set(data);
        this.loading.set(false);
        this.loadFormules();
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des détails du produit.'
        );
        this.loading.set(false);
      },
    });
  }

  private loadFormules(): void {
    this.formulesLoading.set(true);
    this.formuleService.getFormules({ produit_id: this.produitId, all: true }).subscribe({
      next: (res) => {
        this.formules.set(res.data);
        this.formulesLoading.set(false);
      },
      error: () => {
        // Fallback to loaded relation in produit if separate call failed
        const rel = this.produit()?.formules as any[];
        if (rel && rel.length > 0) {
          this.formules.set(rel);
        }
        this.formulesLoading.set(false);
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/produits']);
  }

  public navigateToEdit(): void {
    this.router.navigate(['/super-admin/produits', this.produitId, 'modifier']);
  }

  public navigateToAddFormule(): void {
    this.router.navigate(['/super-admin/formules/nouvelle'], {
      queryParams: { produit_id: this.produitId },
    });
  }

  public navigateToFormuleDetail(formuleId: number | string): void {
    this.router.navigate(['/super-admin/formules', formuleId]);
  }

  public navigateToFormuleEdit(formuleId: number | string): void {
    this.router.navigate(['/super-admin/formules', formuleId, 'modifier']);
  }

  protected promptStatusChange(newStatus: ProduitStatut): void {
    const p = this.produit();
    if (!p) return;

    this.targetStatus = newStatus;
    if (newStatus === 'inactif') {
      this.confirmTitle.set('Désactiver le produit');
      this.confirmMessage.set(
        `Voulez-vous désactiver le produit « ${p.nom} » ? Aucune nouvelle souscription ne pourra être initiée sur ce module.`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Désactiver');
    } else {
      this.confirmTitle.set('Activer le produit');
      this.confirmMessage.set(
        `Voulez-vous activer le produit « ${p.nom} » pour autoriser les souscriptions ?`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Activer');
    }

    this.confirmDialogOpen.set(true);
  }

  protected executeStatusChange(): void {
    if (!this.produit()) return;

    this.actionLoading.set(true);
    this.produitService.toggleStatus(this.produitId).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.confirmDialogOpen.set(false);
        this.toast.success(
          'Statut mis à jour',
          `Le produit « ${updated.nom} » est désormais ${updated.statut}.`
        );
        this.loadData();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.confirmDialogOpen.set(false);
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors du changement de statut du produit.'
        );
      },
    });
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
  }
}
