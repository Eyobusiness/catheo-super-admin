import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormuleService } from '../../services/formule.service';
import { FormuleFormData } from '../../models/formule.model';
import { FormuleFormComponent } from '../../components/formule-form/formule-form.component';

@Component({
  selector: 'app-formule-create-page',
  standalone: true,
  imports: [PageHeaderComponent, ButtonComponent, FormuleFormComponent],
  template: `
    <div class="page-container">
      <app-page-header
        title="Nouvelle Formule Tarifaire"
        subtitle="Création et paramétrage d'une formule d'abonnement pour un produit SaaS"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Formules', path: '/super-admin/formules' },
          { label: 'Nouvelle Formule' }
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

      <app-formule-form
        [presetProduitId]="presetProduitId()"
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
export class FormuleCreatePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formuleService = inject(FormuleService);
  private readonly toast = inject(ToastService);

  protected readonly presetProduitId = signal<string | null>(null);
  protected readonly submitting = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  public ngOnInit(): void {
    const pId = this.route.snapshot.queryParamMap.get('produit_id');
    if (pId) {
      this.presetProduitId.set(pId);
    }
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/formules']);
  }

  public onFormSubmit(data: FormuleFormData): void {
    this.submitting.set(true);
    this.serverErrors.set({});

    this.formuleService.createFormule(data).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.toast.success('Création réussie', `Formule « ${created.nom} » créée avec succès.`);
        this.router.navigate(['/super-admin/formules', created.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err?.errors) {
          this.serverErrors.set(err.errors);
        }
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors de la création de la formule.'
        );
      },
    });
  }
}
