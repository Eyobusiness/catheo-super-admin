import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ProduitService } from '../../services/produit.service';
import { ProduitFormData } from '../../models/produit.model';
import { ProduitFormComponent } from '../../components/produit-form/produit-form.component';

@Component({
  selector: 'app-produit-create-page',
  standalone: true,
  imports: [PageHeaderComponent, ButtonComponent, ProduitFormComponent],
  template: `
    <div class="page-container">
      <app-page-header
        title="Nouveau Produit SaaS"
        subtitle="Création et enregistrement d'un nouveau module logiciel dans le catalogue CATHEO"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Produits', path: '/super-admin/produits' },
          { label: 'Nouveau Produit' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            (btnClick)="goBack()"
          >
            <i class="bi bi-arrow-left"></i>
            <span>Retour à la liste</span>
          </app-btn>
        </div>
      </app-page-header>

      <app-produit-form
        [loading]="submitting()"
        [serverErrors]="serverErrors()"
        (formSubmit)="onFormSubmit($event)"
        (formCancel)="goBack()"
      />
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
export class ProduitCreatePageComponent {
  private readonly router = inject(Router);
  private readonly produitService = inject(ProduitService);
  private readonly toast = inject(ToastService);

  protected readonly submitting = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  public goBack(): void {
    this.router.navigate(['/super-admin/produits']);
  }

  public onFormSubmit(data: ProduitFormData): void {
    this.submitting.set(true);
    this.serverErrors.set({});

    this.produitService.createProduit(data).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.toast.success('Création réussie', `Produit « ${created.nom} » créé avec succès.`);
        this.router.navigate(['/super-admin/produits', created.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err?.errors) {
          this.serverErrors.set(err.errors);
        }
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors de la création du produit.'
        );
      },
    });
  }
}
