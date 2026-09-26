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
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { FactureService } from '../services/facture.service';
import { Facture } from '../models/facture.model';
import { FacturePrintComponent } from '../components/facture-print/facture-print.component';

@Component({
  selector: 'app-facture-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    ErrorStateComponent,
    FacturePrintComponent,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement de la facture...</span>
          </div>
          <p class="mt-2 text-muted">Récupération des données comptables...</p>
        </div>
      } @else if (hasError()) {
        <app-error-state
          title="Facture introuvable"
          [message]="errorMessage()"
          (retry)="loadFacture()"
        />
      } @else if (facture(); as f) {
        <app-page-header
          [title]="'Facture ' + f.reference"
          [subtitle]="'Émise le ' + (f.date_facture | date:'dd/MM/yyyy') + ' — Échéance : ' + (f.date_echeance | date:'dd/MM/yyyy')"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Factures', path: '/super-admin/factures' },
            { label: f.reference }
          ]"
          class="no-print"
        >
          <div page-actions class="d-flex gap-2">
            <app-btn
              variant="outline"
              size="md"
              (btnClick)="goBack()"
            >
              <i class="bi bi-arrow-left me-1"></i>
              <span>Retour</span>
            </app-btn>

            <app-btn
              variant="primary"
              size="md"
              (btnClick)="imprimer()"
            >
              <i class="bi bi-printer me-1"></i>
              <span>Imprimer / PDF</span>
            </app-btn>
          </div>
        </app-page-header>

        <div class="document-wrapper">
          <app-facture-print [facture]="f" />
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }

    .d-flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .mt-2 { margin-top: 0.5rem; }

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

    .document-wrapper {
      margin-top: 1.5rem;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      .page-container {
        padding: 0 !important;
      }
      .document-wrapper {
        margin: 0 !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactureDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly factureService = inject(FactureService);

  protected readonly facture = signal<Facture | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  public ngOnInit(): void {
    this.loadFacture();
  }

  public loadFacture(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.errorMessage.set('Identifiant de facture manquant.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.factureService.getFacture(id).subscribe({
      next: (data) => {
        this.facture.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer la facture demandée.'
        );
        this.loading.set(false);
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/super-admin/factures']);
  }

  public imprimer(): void {
    window.print();
  }
}
