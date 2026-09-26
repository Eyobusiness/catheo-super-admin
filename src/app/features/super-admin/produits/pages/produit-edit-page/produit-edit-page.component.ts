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
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../../shared/components/loading-state/loading-state.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ProduitService } from '../../services/produit.service';
import { Produit, ProduitFormData } from '../../models/produit.model';
import { ProduitFormComponent } from '../../components/produit-form/produit-form.component';

@Component({
  selector: 'app-produit-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    ProduitFormComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="headerTitle()"
        subtitle="Mise à jour des informations et paramètres du produit SaaS"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Produits', path: '/super-admin/produits' },
          { label: produit()?.nom || 'Détail', path: '/super-admin/produits/' + produitId },
          { label: 'Modifier' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            (btnClick)="goBack()"
          >
            <i class="bi bi-arrow-left"></i>
            <span>Retour</span>
          </app-btn>
        </div>
      </app-page-header>

      @if (loading()) {
        <app-loading-state message="Chargement des données du produit..." />
      } @else if (hasError()) {
        <app-error-state
          title="Impossible de charger le produit"
          [message]="errorMessage()"
          (retry)="loadProduit()"
        />
      } @else if (produit()) {
        <app-produit-form
          [initialData]="produit()"
          [isEdit]="true"
          [loading]="submitting()"
          [serverErrors]="serverErrors()"
          (formSubmit)="onFormSubmit($event)"
          (formCancel)="goBack()"
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
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly produitService = inject(ProduitService);
  private readonly toast = inject(ToastService);

  protected produitId = '';
  protected readonly produit = signal<Produit | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly submitting = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  protected headerTitle(): string {
    const p = this.produit();
    return p ? `Modifier le produit : ${p.nom}` : 'Modifier le produit';
  }

  public ngOnInit(): void {
    this.produitId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.produitId) {
      this.router.navigate(['/super-admin/produits']);
      return;
    }
    this.loadProduit();
  }

  public loadProduit(): void {
    this.loading.set(true);
    this.hasError.set(false);

    this.produitService.getProduit(this.produitId).subscribe({
      next: (data) => {
        this.produit.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors du chargement des informations du produit.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    if (this.produitId) {
      this.router.navigate(['/super-admin/produits', this.produitId]);
    } else {
      this.router.navigate(['/super-admin/produits']);
    }
  }

  public onFormSubmit(data: ProduitFormData): void {
    this.submitting.set(true);
    this.serverErrors.set({});

    this.produitService.updateProduit(this.produitId, data).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.toast.success('Modification réussie', `Produit « ${updated.nom} » modifié avec succès.`);
        this.router.navigate(['/super-admin/produits', updated.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err?.errors) {
          this.serverErrors.set(err.errors);
        }
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors de la mise à jour du produit.'
        );
      },
    });
  }
}
