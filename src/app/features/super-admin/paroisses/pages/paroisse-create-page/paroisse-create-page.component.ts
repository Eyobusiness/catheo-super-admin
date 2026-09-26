import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ParoisseFormComponent } from '../../components/paroisse-form/paroisse-form.component';
import { ParoisseService } from '../../services/paroisse.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-paroisse-create-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    ParoisseFormComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Nouvelle Paroisse"
        subtitle="Enregistrement d'une nouvelle paroisse dans la plateforme CATHEO"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Paroisses', path: '/super-admin/paroisses' },
          { label: 'Nouvelle Paroisse' }
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

      <app-paroisse-form
        [loading]="saving()"
        [serverErrors]="serverErrors()"
        (formSubmit)="onSave($event)"
        (formCancel)="goBack()"
      />
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1080px;
      margin: 0 auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoisseCreatePageComponent {
  private readonly router = inject(Router);
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  public goBack(): void {
    this.router.navigate(['/super-admin/paroisses']);
  }

  public onSave(payload: FormData | Record<string, any>): void {
    this.saving.set(true);
    this.serverErrors.set({});

    this.paroisseService.createParoisse(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Succès', 'Paroisse créée avec succès.');
        this.router.navigate(['/super-admin/paroisses']);
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 422 && err.error?.errors) {
          this.serverErrors.set(err.error.errors);
          this.toast.error('Erreur', 'Veuillez corriger les erreurs du formulaire.');
        } else {
          this.toast.error('Erreur', err.error?.message || 'Erreur lors de la création de la paroisse.');
        }
      },
    });
  }
}
