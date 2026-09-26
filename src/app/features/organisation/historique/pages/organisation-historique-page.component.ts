import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import {
  AuditLogItem,
  OrganisationAdminService,
} from '../../services/organisation-admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';

@Component({
  selector: 'app-organisation-historique-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    FilterBarComponent,
    PaginationComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="historique-page-container">
      <app-page-header
        title="Journal Interne & Historique des Actions"
        subtitle="Chronologie auditable et immuable des opérations effectuées au sein de l'organisation"
        badge="Audit"
      >
        <div page-actions class="header-actions">
          <app-btn
            variant="secondary"
            icon="arrow-clockwise"
            [loading]="isLoading()"
            (btnClick)="refreshData()"
          >
            Actualiser
          </app-btn>
        </div>
      </app-page-header>

      <!-- KPI Cartes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Total des événements"
          [value]="totalEvents()"
          subtitle="Traces enregistrées"
          icon="bi bi-clock-history"
          theme="primary"
        />

        <app-stat-card
          title="Créations & ajouts"
          [value]="totalCreations()"
          subtitle="Nouveaux éléments"
          icon="bi bi-plus-circle"
          theme="success"
        />

        <app-stat-card
          title="Modifications"
          [value]="totalModifs()"
          subtitle="Mises à jour certifiées"
          icon="bi bi-pencil-square"
          theme="accent"
        />

        <app-stat-card
          title="Opérations financières"
          [value]="totalFinances()"
          subtitle="Paiements & mouvements"
          icon="bi bi-cash-coin"
          theme="warning"
        />
      </div>

      <!-- Filtres et recherche -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par action, auteur, entité..."
          [hasActiveFilters]="searchQuery().length > 0"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        />
      </div>

      <!-- Erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadAuditLogs()"
          />
        </div>
      }

      <!-- Timeline des événements -->
      @if (!errorMessage()) {
        <div class="timeline-container mt-6">
          @if (isLoading()) {
            <div class="timeline-loading">
              <i class="bi bi-arrow-repeat spin-icon"></i>
              <span>Chargement du journal d'audit...</span>
            </div>
          } @else if (logs().length === 0) {
            <div class="timeline-empty">
              <i class="bi bi-journal-x"></i>
              <span>Aucun événement d'audit enregistré pour l'instant.</span>
            </div>
          } @else {
            <div class="timeline-feed">
              @for (item of logs(); track item.id) {
                <div class="timeline-entry">
                  <!-- Marqueur & Ligne -->
                  <div class="timeline-marker-col">
                    <div class="marker-dot" [class]="'dot-' + getActionCategory(item.action)">
                      <i [class]="getActionIcon(item.action)"></i>
                    </div>
                    <div class="marker-line"></div>
                  </div>

                  <!-- Contenu de l'événement -->
                  <div class="timeline-content-card">
                    <div class="content-header">
                      <div class="action-title-group">
                        <span class="action-tag" [class]="'badge-' + getActionCategory(item.action)">
                          {{ formatActionLabel(item.action) }}
                        </span>
                        @if (item.table_concernee) {
                          <span class="entity-badge">
                            <code>{{ item.table_concernee }}</code>
                          </span>
                        }
                      </div>
                      <span class="event-time">
                        <i class="bi bi-clock mr-1"></i>
                        {{ item.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}
                      </span>
                    </div>

                    <p class="event-description">
                      {{ item.description || ('Opération effectuée sur le module ' + (item.table_concernee || 'général')) }}
                    </p>

                    <div class="content-footer">
                      <span class="author-meta">
                        <i class="bi bi-person-fill mr-1"></i>
                        Auteur : <strong>{{ item.auteur || 'Système pastoral' }}</strong>
                      </span>
                      @if (item.ip_address) {
                        <span class="ip-meta">
                          IP : <code>{{ item.ip_address }}</code>
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (totalEvents() > 0) {
              <div class="mt-6">
                <app-pagination
                  [currentPage]="currentPage()"
                  [perPage]="perPage()"
                  [total]="totalEvents()"
                  (pageChange)="onPageChange($event)"
                />
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .historique-page-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .timeline-container {
      position: relative;
    }
    .timeline-feed {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .timeline-entry {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      position: relative;
    }
    .timeline-marker-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      align-self: stretch;
      width: 40px;
      flex-shrink: 0;
    }
    .marker-dot {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      z-index: 2;
      box-shadow: 0 0 0 4px var(--bg-app, #f8fafc);
    }
    .dot-create {
      background: #dcfce7;
      color: #15803d;
      border: 2px solid #86efac;
    }
    .dot-update {
      background: #eff6ff;
      color: #1d4ed8;
      border: 2px solid #93c5fd;
    }
    .dot-finance {
      background: #fef3c7;
      color: #b45309;
      border: 2px solid #fde68a;
    }
    .dot-delete {
      background: #fee2e2;
      color: #b91c1c;
      border: 2px solid #fca5a5;
    }
    .dot-default {
      background: #f1f5f9;
      color: #475569;
      border: 2px solid #cbd5e1;
    }
    .marker-line {
      width: 2px;
      flex: 1;
      background: var(--border-color, #e2e8f0);
      margin: 4px 0;
      min-height: 24px;
    }
    .timeline-content-card {
      flex: 1;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s ease;
    }
    .timeline-content-card:hover {
      border-color: var(--primary-300, #93c5fd);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .action-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .action-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-create { background: #dcfce7; color: #15803d; }
    .badge-update { background: #eff6ff; color: #1d4ed8; }
    .badge-finance { background: #fef3c7; color: #b45309; }
    .badge-delete { background: #fee2e2; color: #b91c1c; }
    .badge-default { background: #f1f5f9; color: #475569; }

    .entity-badge code {
      font-size: 0.75rem;
      background: var(--neutral-100, #f1f5f9);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      color: var(--text-secondary, #475569);
    }
    .event-time {
      font-size: 0.78rem;
      color: var(--text-muted, #64748b);
    }
    .event-description {
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      margin: 0.65rem 0;
      line-height: 1.45;
    }
    .content-footer {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      font-size: 0.78rem;
      color: var(--text-secondary, #64748b);
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color-light, #f1f5f9);
      flex-wrap: wrap;
    }
    .timeline-loading,
    .timeline-empty {
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-muted, #64748b);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }
    .timeline-loading i,
    .timeline-empty i {
      font-size: 2rem;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationHistoriquePageComponent implements OnInit {
  private readonly adminService = inject(OrganisationAdminService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly logs = signal<AuditLogItem[]>([]);
  public readonly totalEvents = signal<number>(0);
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(25);

  public readonly searchQuery = signal<string>('');

  public readonly totalCreations = computed(
    () => this.logs().filter((l) => l.action.toLowerCase().includes('create')).length
  );
  public readonly totalModifs = computed(
    () => this.logs().filter((l) => l.action.toLowerCase().includes('update')).length
  );
  public readonly totalFinances = computed(
    () => this.logs().filter((l) => l.action.toLowerCase().includes('paiement') || l.action.toLowerCase().includes('caisse')).length
  );

  public ngOnInit(): void {
    this.loadAuditLogs();
  }

  public loadAuditLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService
      .getAuditLogs({
        search: this.searchQuery().trim() || undefined,
        page: this.currentPage(),
        per_page: this.perPage(),
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.logs.set(data);
          this.totalEvents.set(meta.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || "Impossible de charger l'historique.");
        },
      });
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  public onPageChange(evt: PageChangeEvent): void {
    this.currentPage.set(evt.page);
    this.perPage.set(evt.perPage);
    this.loadAuditLogs();
  }

  public refreshData(): void {
    this.loadAuditLogs();
    this.toast.info('Actualisation', 'Rechargement de l’historique...');
  }

  public getActionCategory(action: string): 'create' | 'update' | 'finance' | 'delete' | 'default' {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('store') || act.includes('insert') || act.includes('ajout')) return 'create';
    if (act.includes('update') || act.includes('edit') || act.includes('modif') || act.includes('toggle')) return 'update';
    if (act.includes('paiement') || act.includes('caisse') || act.includes('versement') || act.includes('finance')) return 'finance';
    if (act.includes('delete') || act.includes('suppr') || act.includes('destroy') || act.includes('annul')) return 'delete';
    return 'default';
  }

  public getActionIcon(action: string): string {
    const cat = this.getActionCategory(action);
    if (cat === 'create') return 'bi bi-plus-lg';
    if (cat === 'update') return 'bi bi-pencil';
    if (cat === 'finance') return 'bi bi-currency-dollar';
    if (cat === 'delete') return 'bi bi-trash';
    return 'bi bi-activity';
  }

  public formatActionLabel(action: string): string {
    if (!action) return 'Événement';
    return action.replace(/_/g, ' ');
  }
}
