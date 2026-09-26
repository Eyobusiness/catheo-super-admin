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
import { FormuleService } from '../../services/formule.service';
import { Formule, FormuleFormData } from '../../models/formule.model';
import { FormuleFormComponent } from '../../components/formule-form/formule-form.component';

@Component({
  selector: 'app-formule-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    FormuleFormComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="headerTitle()"
        subtitle="Mise à jour des paramètres et conditions tarifaires de la formule"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Formules', path: '/super-admin/formules' },
          { label: formule()?.nom || 'Détail', path: '/super-admin/formules/' + formuleId },
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
        <app-loading-state message="Chargement des données de la formule..." />
      } @else if (hasError()) {
        <app-error-state
          title="Impossible de charger la formule"
          [message]="errorMessage()"
          (retry)="loadFormule()"
        />
      } @else if (formule()) {
        <app-formule-form
          [initialData]="formule()"
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
export class FormuleEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formuleService = inject(FormuleService);
  private readonly toast = inject(ToastService);

  protected formuleId = '';
  protected readonly formule = signal<Formule | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly submitting = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  protected headerTitle(): string {
    const f = this.formule();
    return f ? `Modifier la formule : ${f.nom}` : 'Modifier la formule';
  }

  public ngOnInit(): void {
    this.formuleId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.formuleId) {
      this.router.navigate(['/super-admin/formules']);
      return;
    }
    this.loadFormule();
  }

  public loadFormule(): void {
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
          err?.message || 'Erreur lors du chargement des informations de la formule.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    if (this.formuleId) {
      this.router.navigate(['/super-admin/formules', this.formuleId]);
    } else {
      this.router.navigate(['/super-admin/formules']);
    }
  }

  public onFormSubmit(data: FormuleFormData): void {
    this.submitting.set(true);
    this.serverErrors.set({});

    this.formuleService.updateFormule(this.formuleId, data).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.toast.success('Modification réussie', `Formule « ${updated.nom} » modifiée avec succès.`);
        this.router.navigate(['/super-admin/formules', updated.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err?.errors) {
          this.serverErrors.set(err.errors);
        }
        this.toast.error(
          'Erreur',
          err?.message || 'Erreur lors de la mise à jour de la formule.'
        );
      },
    });
  }
}
