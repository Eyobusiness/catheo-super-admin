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
import { LoadingStateComponent } from '../../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ParoisseService } from '../../services/paroisse.service';
import { ParoisseDetail } from '../../models/paroisse.model';
import { ParoisseFormComponent } from '../../components/paroisse-form/paroisse-form.component';

@Component({
  selector: 'app-paroisse-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    ParoisseFormComponent,
  ],
  template: `
    <div class="page-container">
      @if (loadingInitial()) {
        <app-loading-state message="Chargement des informations de la paroisse..." />
      } @else if (hasErrorInitial()) {
        <app-error-state
          title="Impossible de charger la paroisse"
          [message]="errorMessage()"
          (retry)="loadParoisse()"
        />
      } @else {
        <app-page-header
          [title]="'Modifier : ' + (paroisse()?.nom_paroisse || 'Paroisse')"
          subtitle="Mise à jour des paramètres, localisation, contacts et identité visuelle"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Paroisses', path: '/super-admin/paroisses' },
            { label: paroisse()?.nom_paroisse || 'Détails', path: '/super-admin/paroisses/' + parishId },
            { label: 'Modifier' }
          ]"
        />

        <app-paroisse-form
          [initialData]="paroisse()"
          [loading]="saving()"
          [serverErrors]="serverErrors()"
          (formSubmit)="onSave($event)"
          (formCancel)="onCancel()"
        />
      }
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
export class ParoisseEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paroisseService = inject(ParoisseService);
  private readonly toast = inject(ToastService);

  protected parishId = '';
  protected readonly paroisse = signal<ParoisseDetail | null>(null);
  protected readonly loadingInitial = signal<boolean>(true);
  protected readonly hasErrorInitial = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  protected readonly saving = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  public ngOnInit(): void {
    this.parishId = this.route.snapshot.paramMap.get('id') || '';
    this.loadParoisse();
  }

  public loadParoisse(): void {
    if (!this.parishId) {
      this.hasErrorInitial.set(true);
      this.errorMessage.set('Identifiant de la paroisse manquant.');
      this.loadingInitial.set(false);
      return;
    }

    this.loadingInitial.set(true);
    this.hasErrorInitial.set(false);

    this.paroisseService.getParoisseDetail(this.parishId).subscribe({
      next: (data) => {
        this.paroisse.set(data);
        this.loadingInitial.set(false);
      },
      error: (err) => {
        this.hasErrorInitial.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer les informations de la paroisse.'
        );
        this.loadingInitial.set(false);
      },
    });
  }

  public onSave(payload: FormData | Record<string, any>): void {
    this.saving.set(true);
    this.serverErrors.set({});

    this.paroisseService.updateParoisse(this.parishId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          'Paroisse modifiée avec succès',
          'Toutes les modifications ont été enregistrées.'
        );
        this.router.navigate(['/super-admin/paroisses', this.parishId]);
      },
      error: (err) => {
        this.saving.set(false);
        if (err?.status === 422 && err?.errors) {
          this.serverErrors.set(err.errors);
          this.toast.error(
            'Erreur de validation',
            'Veuillez corriger les erreurs signalées dans le formulaire.'
          );
        } else {
          this.toast.error(
            'Échec de l\'enregistrement',
            err?.message || 'Une erreur inattendue est survenue.'
          );
        }
      },
    });
  }

  public onCancel(): void {
    this.router.navigate(['/super-admin/paroisses', this.parishId]);
  }
}
