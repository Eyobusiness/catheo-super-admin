import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { AbonnementService } from '../../services/abonnement.service';
import { AbonnementFormData } from '../../models/abonnement.model';
import { AbonnementFormComponent } from '../../components/abonnement-form/abonnement-form.component';

@Component({
  selector: 'app-abonnement-create-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, AbonnementFormComponent],
  template: `
    <div class="page-container">
      <app-page-header
        title="Nouvelle Souscription d'Abonnement"
        subtitle="Enregistrement d'un abonnement paroissial à un module SaaS CATHEO, OPPE, OPPJ ou OPPA"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Abonnements', path: '/super-admin/abonnements' },
          { label: 'Nouveau' }
        ]"
      />

      <div class="form-wrapper">
        <app-abonnement-form
          [loading]="isSubmitting()"
          [serverErrors]="serverErrors()"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()"
        />
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
    }
    .form-wrapper {
      margin-top: 1.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbonnementCreatePageComponent {
  private readonly abonnementService = inject(AbonnementService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  public onSubmit(data: any): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.serverErrors.set({});

    const request$ = data.target_type === 'organisation'
      ? this.abonnementService.createOrganisationAbonnement(data)
      : this.abonnementService.createAbonnement(data);

    request$.subscribe({
      next: (created: any) => {
        this.isSubmitting.set(false);
        this.toastService.success(
          'Abonnement créé',
          `L'abonnement ${created.reference || ''} a été souscrit avec succès.`
        );
        this.router.navigate(['/super-admin/abonnements']);
      },
      error: (err: any) => {

        this.isSubmitting.set(false);
        if (err.status === 422 && err.error?.errors) {
          this.serverErrors.set(err.error.errors);
          this.toastService.error(
            'Erreur de validation',
            'Veuillez corriger les informations signalées dans le formulaire.'
          );
        } else if (err.status === 403) {
          this.toastService.error(
            'Accès refusé',
            "Vous n'avez pas l'autorisation requise pour créer un abonnement."
          );
        } else {
          this.toastService.error(
            'Erreur',
            err.error?.message || "Une erreur est survenue lors de la création de l'abonnement."
          );
        }
      },
    });
  }

  public onCancel(): void {
    this.router.navigate(['/super-admin/abonnements']);
  }
}
