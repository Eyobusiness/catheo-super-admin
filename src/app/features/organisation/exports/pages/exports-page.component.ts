import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ExportService } from '../services/export.service';
import { PrintService } from '../../../../core/services/print.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CaisseService } from '../../caisse/services/caisse.service';
import { CatheoPopulationService } from '../../catheo-population/services/catheo-population.service';
import { CampagnePelerinage } from '../../pelerinages/models/pelerinage.model';

@Component({
  selector: 'app-exports-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
  ],
  template: `
    <div class="exports-page-container">
      <!-- En-tête -->
      <app-page-header
        title="Centre d'Exports & Impressions"
        subtitle="Extraction des données officielles au format CSV et impression de documents"
        [badge]="typeOrganisation() || 'Organisation'"
      >
        <div page-actions class="flex items-center gap-2">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoadingCampagnes()"
            (btnClick)="loadCampagnes()"
          >
            Actualiser
          </app-btn>
        </div>
      </app-page-header>

      <!-- Grille des modules d'exports -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <!-- 1. MEMBRES -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-primary-soft">
              <i class="bi bi-people-fill text-primary"></i>
            </div>
            <h3 class="card-title">Membres</h3>
            <p class="card-desc">
              Liste complète des membres enregistrés de l'organisation avec coordonnées, fonctions et dates d'adhésion.
            </p>
            <div class="card-actions">
              <app-btn
                variant="secondary"
                size="sm"
                icon="file-earmark-spreadsheet"
                [loading]="isExportingMembres()"
                (btnClick)="exportMembresCsv()"
              >
                Exporter CSV
              </app-btn>
              <app-btn
                variant="secondary"
                size="sm"
                icon="printer"
                (btnClick)="goToMembres()"
              >
                Imprimer
              </app-btn>
            </div>
          </div>
        </app-card>

        <!-- 2. ACTIVITÉS -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-info-soft">
              <i class="bi bi-calendar-event-fill text-info"></i>
            </div>
            <h3 class="card-title">Activités Pastorales</h3>
            <p class="card-desc">
              Planning et suivi des activités, lieux, responsables et taux d'exécution pastorale.
            </p>
            <div class="card-actions">
              <app-btn
                variant="secondary"
                size="sm"
                icon="file-earmark-spreadsheet"
                [loading]="isExportingActivites()"
                (btnClick)="exportActivitesCsv()"
              >
                Exporter CSV
              </app-btn>
              <app-btn
                variant="secondary"
                size="sm"
                icon="printer"
                (btnClick)="goToActivites()"
              >
                Imprimer
              </app-btn>
            </div>
          </div>
        </app-card>

        <!-- 3. POPULATION CATHEO -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-warning-soft">
              <i class="bi bi-book-fill text-warning"></i>
            </div>
            <h3 class="card-title">Population CATHEO</h3>
            <p class="card-desc">
              Cohorte active de catéchumènes rattachée à votre paroisse selon votre type d'organisation.
            </p>
            <div class="card-actions">
              <app-btn
                variant="secondary"
                size="sm"
                icon="file-earmark-spreadsheet"
                [loading]="isExportingCatheo()"
                (btnClick)="exportCatheoPopulationCsv()"
              >
                Exporter CSV
              </app-btn>
              <app-btn
                variant="secondary"
                size="sm"
                icon="printer"
                (btnClick)="goToCatheo()"
              >
                Imprimer
              </app-btn>
            </div>
          </div>
        </app-card>

        <!-- 4. PÈLERINAGES (PARTICIPANTS & LOGISTIQUE) -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-success-soft">
              <i class="bi bi-geo-alt-fill text-success"></i>
            </div>
            <h3 class="card-title">Pèlerinages — Participants</h3>
            <p class="card-desc">
              Listes des pèlerins par campagne (générale, transport, embarquement/tailles de kits, hébergement).
            </p>

            @if (campagnes().length > 0) {
              <div class="campagne-selector mb-3">
                <select
                  [value]="selectedCampagneId()"
                  (change)="onCampagneChange($event)"
                  class="export-select"
                  aria-label="Sélectionner la campagne"
                >
                  @for (c of campagnes(); track c.id) {
                    <option [value]="c.id">{{ c.nom }}</option>
                  }
                </select>
              </div>
            }

            <div class="card-actions flex-wrap">
              <app-btn
                variant="secondary"
                size="sm"
                icon="download"
                [loading]="isExportingPelerins()"
                (btnClick)="exportParticipantsCsv('general')"
              >
                Liste Générale CSV
              </app-btn>
              <app-btn
                variant="secondary"
                size="sm"
                icon="box-seam"
                [loading]="isExportingPelerins()"
                (btnClick)="exportParticipantsCsv('embarquement')"
              >
                Kits & Tailles CSV
              </app-btn>
            </div>
          </div>
        </app-card>

        <!-- 5. CAISSE & ENCAISSEMENTS -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-emerald-soft">
              <i class="bi bi-wallet2 text-success"></i>
            </div>
            <h3 class="card-title">Caisse & Opérations</h3>
            <p class="card-desc">
              Journal complet des recettes, versements de pèlerinages et dépenses de l'organisation.
            </p>
            <div class="card-actions">
              <app-btn
                variant="secondary"
                size="sm"
                icon="file-earmark-spreadsheet"
                [loading]="isExportingCaisse()"
                (btnClick)="exportCaisseCsv()"
              >
                Exporter CSV
              </app-btn>
              <app-btn
                variant="secondary"
                size="sm"
                icon="printer"
                (btnClick)="goToCaisse()"
              >
                Imprimer
              </app-btn>
            </div>
          </div>
        </app-card>

        <!-- 6. RAPPORT ANNUEL & BILAN -->
        <app-card>
          <div class="export-card-content">
            <div class="card-icon-box bg-indigo-soft">
              <i class="bi bi-file-earmark-bar-graph-fill text-primary"></i>
            </div>
            <h3 class="card-title">Bilan Annuel Officiel</h3>
            <p class="card-desc">
              Synthèse annuelle consolidée prête pour impression ou archivage PDF officiel.
            </p>
            <div class="card-actions">
              <app-btn
                variant="primary"
                size="sm"
                icon="printer"
                (btnClick)="goToRapports()"
              >
                Accéder & Imprimer
              </app-btn>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
  styles: [`
    .exports-page-container {
      display: flex;
      flex-direction: column;
    }
    .export-card-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .card-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .bg-primary-soft { background: #e0e7ff; }
    .bg-info-soft { background: #e0f2fe; }
    .bg-warning-soft { background: #fef3c7; }
    .bg-success-soft { background: #dcfce7; }
    .bg-emerald-soft { background: #d1fae5; }
    .bg-indigo-soft { background: #ede9fe; }
    .text-primary { color: #4f46e5; }
    .text-info { color: #0284c7; }
    .text-warning { color: #d97706; }
    .text-success { color: #059669; }

    .card-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      margin: 0 0 0.5rem 0;
    }
    .card-desc {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      line-height: 1.45;
      margin: 0 0 1.25rem 0;
      flex-grow: 1;
    }
    .campagne-selector {
      width: 100%;
    }
    .export-select {
      width: 100%;
      padding: 0.4375rem 0.625rem;
      font-size: 0.8125rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      background: var(--bg-surface, #ffffff);
      color: var(--text-color, #1e293b);
      font-weight: 600;
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: auto;
    }
    .grid {
      display: grid;
    }
    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 768px) {
      .md\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 1024px) {
      .lg\\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .gap-6 {
      gap: 1.5rem;
    }
    .mt-6 {
      margin-top: 1.5rem;
    }
    .mb-3 {
      margin-bottom: 0.75rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportsPageComponent implements OnInit {
  private readonly exportService = inject(ExportService);
  private readonly printService = inject(PrintService);
  private readonly orgContext = inject(OrganisationContextService);
  private readonly permission = inject(PermissionService);
  private readonly toast = inject(ToastService);
  private readonly caisseService = inject(CaisseService);
  private readonly populationService = inject(CatheoPopulationService);
  private readonly router = inject(Router);

  public readonly typeOrganisation = computed(() => {
    return this.orgContext.typeOrganisation() || 'Organisation';
  });

  public readonly orgCode = computed(() => {
    return this.orgContext.context()?.code || 'ORG';
  });

  // États de chargement des exports
  public readonly isExportingMembres = signal<boolean>(false);
  public readonly isExportingActivites = signal<boolean>(false);
  public readonly isExportingCatheo = signal<boolean>(false);
  public readonly isExportingPelerins = signal<boolean>(false);
  public readonly isExportingCaisse = signal<boolean>(false);

  // Campagnes de pèlerinage pour l'export ciblé
  public readonly campagnes = signal<CampagnePelerinage[]>([]);
  public readonly selectedCampagneId = signal<number | string>('');
  public readonly isLoadingCampagnes = signal<boolean>(false);

  public ngOnInit(): void {
    this.loadCampagnes();
  }

  public loadCampagnes(): void {
    this.isLoadingCampagnes.set(true);
    this.caisseService.getCampagnes().subscribe({
      next: (data) => {
        this.campagnes.set(data);
        if (data.length > 0 && !this.selectedCampagneId()) {
          this.selectedCampagneId.set(data[0].id);
        }
        this.isLoadingCampagnes.set(false);
      },
      error: () => {
        this.isLoadingCampagnes.set(false);
      },
    });
  }

  public onCampagneChange(event: Event): void {
    this.selectedCampagneId.set((event.target as HTMLSelectElement).value);
  }

  // Export Membres
  public exportMembresCsv(): void {
    this.isExportingMembres.set(true);
    this.exportService.exportMembresCsv().subscribe({
      next: (blob) => {
        this.isExportingMembres.set(false);
        const dateStr = new Date().toISOString().split('T')[0];
        this.exportService.downloadBlobFile(blob, `membres_${this.orgCode().toLowerCase()}_${dateStr}.csv`);
        this.toast.success('Export réussi', 'La liste des membres a été téléchargée en CSV.');
      },
      error: () => {
        this.isExportingMembres.set(false);
        this.toast.error("Erreur d'export", "Impossible de générer l'export CSV des membres.");
      },
    });
  }

  // Export Activités
  public exportActivitesCsv(): void {
    this.isExportingActivites.set(true);
    this.exportService.exportActivitesCsv().subscribe({
      next: (blob) => {
        this.isExportingActivites.set(false);
        const dateStr = new Date().toISOString().split('T')[0];
        this.exportService.downloadBlobFile(blob, `activites_${this.orgCode().toLowerCase()}_${dateStr}.csv`);
        this.toast.success('Export réussi', 'Le planning des activités a été téléchargé en CSV.');
      },
      error: () => {
        this.isExportingActivites.set(false);
        this.toast.error("Erreur d'export", "Impossible de générer l'export CSV des activités.");
      },
    });
  }

  // Export Caisse
  public exportCaisseCsv(): void {
    this.isExportingCaisse.set(true);
    this.exportService.exportCaisseCsv().subscribe({
      next: (blob) => {
        this.isExportingCaisse.set(false);
        const dateStr = new Date().toISOString().split('T')[0];
        this.exportService.downloadBlobFile(blob, `caisse_${this.orgCode().toLowerCase()}_${dateStr}.csv`);
        this.toast.success('Export réussi', 'Le journal de caisse a été téléchargé en CSV.');
      },
      error: () => {
        this.isExportingCaisse.set(false);
        this.toast.error("Erreur d'export", "Impossible de télécharger l'état de caisse.");
      },
    });
  }

  // Export Pèlerins
  public exportParticipantsCsv(type: 'general' | 'embarquement'): void {
    const cid = this.selectedCampagneId();
    if (!cid) {
      this.toast.error('Attention', 'Veuillez sélectionner une campagne de pèlerinage.');
      return;
    }

    this.isExportingPelerins.set(true);
    this.exportService.exportParticipantsPelerinageCsv(cid, { type_export: type }).subscribe({
      next: (blob) => {
        this.isExportingPelerins.set(false);
        const dateStr = new Date().toISOString().split('T')[0];
        this.exportService.downloadBlobFile(blob, `pelerins_${cid}_${type}_${dateStr}.csv`);
        this.toast.success('Export réussi', 'La liste des participants a été téléchargée.');
      },
      error: () => {
        this.isExportingPelerins.set(false);
        this.toast.error("Erreur d'export", 'Impossible de télécharger la liste des participants.');
      },
    });
  }

  // Export Population CATHEO
  public exportCatheoPopulationCsv(): void {
    this.isExportingCatheo.set(true);
    this.populationService.getPopulation({ per_page: 500 }).subscribe({
      next: (res) => {
        this.isExportingCatheo.set(false);
        if (res.data.length === 0) {
          this.toast.error('Aucune donnée', 'Aucun catéchumène à exporter.');
          return;
        }
        this.exportService.exportCatheoPopulationCsv(res.data, this.orgCode());
        this.toast.success('Export réussi', `${res.data.length} catéchumène(s) exporté(s) en CSV.`);
      },
      error: () => {
        this.isExportingCatheo.set(false);
        this.toast.error("Erreur d'export", 'Impossible de récupérer la population CATHEO.');
      },
    });
  }

  // Navigation vers les pages d'impression directe
  public goToMembres(): void {
    this.router.navigate(['/organisation/membres']);
  }
  public goToActivites(): void {
    this.router.navigate(['/organisation/activites']);
  }
  public goToCatheo(): void {
    this.router.navigate(['/organisation/catheo-population']);
  }
  public goToCaisse(): void {
    this.router.navigate(['/organisation/caisse']);
  }
  public goToRapports(): void {
    this.router.navigate(['/organisation/rapports']);
  }
}
