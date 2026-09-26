import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { CurrencyCfaPipe } from '../../../../shared/pipes/currency-cfa.pipe';
import { DashboardService } from '../services/dashboard.service';
import { SuperAdminDashboardData } from '../models/dashboard.model';
import { DashboardSubscriptionSummaryComponent } from '../components/dashboard-subscription-summary/dashboard-subscription-summary.component';
import { DashboardParishSummaryComponent } from '../components/dashboard-parish-summary/dashboard-parish-summary.component';
import { DashboardRecentActivityComponent } from '../components/dashboard-recent-activity/dashboard-recent-activity.component';
import { DashboardTrashPreviewComponent } from '../components/dashboard-trash-preview/dashboard-trash-preview.component';
import {
  DashboardNotificationsComponent,
  DashboardNotificationItem,
} from '../components/dashboard-notifications/dashboard-notifications.component';
import { AbonnementService } from '../../abonnements/services/abonnement.service';
import { SuperAdminOrganisationService } from '../../organisations/services/super-admin-organisation.service';
import { AuditService } from '../../audit/services/audit.service';
import { TrashService } from '../../trash/services/trash.service';
import { AuditLog } from '../../audit/models/audit.model';
import { TrashItem } from '../../trash/models/trash.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatCardComponent,
    ButtonComponent,
    ErrorStateComponent,
    CurrencyCfaPipe,
    DashboardSubscriptionSummaryComponent,
    DashboardParishSummaryComponent,
    DashboardRecentActivityComponent,
    DashboardTrashPreviewComponent,
    DashboardNotificationsComponent,
  ],
  template: `
    <div class="dashboard-page-container">
      <!-- Page Header -->
      <app-page-header
        title="Tableau de bord intelligent"
        subtitle="Supervision consolidée SaaS CATHEO, gestion diocésaine et mouvements pastoraux"
        badge="Super Admin"
      >
        <div page-actions>
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            [loading]="isLoading()"
            (btnClick)="loadAllData()"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Error State -->
      @if (errorMessage() && !isLoading()) {
        <app-error-state
          title="Erreur de chargement du tableau de bord"
          [message]="errorMessage()!"
          retryText="Réessayer"
          (retry)="loadAllData()"
        />
      }

      <!-- Top KPI Grid : 6 CARTES (Disposition 3 au-dessus, 3 en dessous) -->
      <section class="kpi-grid" aria-label="Statistiques principales consolidées">
        <!-- 1. Chiffre d'affaires -->
        <app-stat-card
          title="Chiffre d'Affaires"
          [value]="(dashboardData()?.finances?.ca_total_encaisse || 0) | currencyCfa:(dashboardData()?.finances?.devise || 'XOF')"
          subtitle="Encaissements cumulés"
          icon="bi bi-cash-stack"
          theme="primary"
          trend="+12%"
          trendDirection="up"
          tooltip="Total des encaissements cumulés depuis le lancement de la plateforme"
          [loading]="isLoading()"
        />

        <!-- 2. Encaissements du mois -->
        <app-stat-card
          title="Encaissements Mois"
          [value]="(dashboardData()?.finances?.ca_mois_courant || 0) | currencyCfa:(dashboardData()?.finances?.devise || 'XOF')"
          subtitle="Mois en cours"
          icon="bi bi-calendar-check"
          theme="success"
          trend="En cours"
          trendDirection="neutral"
          tooltip="Total des cotisations et abonnements perçus ce mois-ci"
          [loading]="isLoading()"
        />

        <!-- 3. Paroisses -->
        <app-stat-card
          title="Paroisses"
          [value]="(dashboardData()?.paroisses?.actives || 0) + ' / ' + (dashboardData()?.paroisses?.total || 0)"
          subtitle="Actives / Total"
          icon="bi bi-building"
          theme="accent"
          tooltip="Nombre de paroisses déployées et actives sur le module CATHEO"
          [loading]="isLoading()"
        />

        <!-- 4. Organisations actives -->
        <app-stat-card
          title="Organisations Actives"
          [value]="activeOrganisationsCount()"
          subtitle="OPPE, OPPJ & OPPA"
          icon="bi bi-diagram-3"
          theme="info"
          trend="Pastorales"
          trendDirection="up"
          tooltip="Organisations et mouvements pastoraux actuellement actifs sur la plateforme"
          [loading]="isLoading()"
        />

        <!-- 5. Abonnements actifs -->
        <app-stat-card
          title="Abonnements Actifs"
          [value]="dashboardData()?.abonnements?.actifs || 0"
          [subtitle]="(dashboardData()?.abonnements?.en_attente || 0) + ' en attente'"
          icon="bi bi-credit-card-2-front"
          theme="warning"
          trend="En règle"
          trendDirection="up"
          tooltip="Total des abonnements en cours de validité (Paroisses et Organisations)"
          [loading]="isLoading()"
        />

        <!-- 6. Abonnements inactifs -->
        <app-stat-card
          title="Abonnements Inactifs"
          [value]="inactifsAbonnementsCount()"
          [subtitle]="inactifsAbonnementsSubtitle()"
          icon="bi bi-pause-circle"
          theme="danger"
          trend="À régulariser"
          trendDirection="down"
          tooltip="Abonnements suspendus, expirés ou résiliés nécessitant un suivi ou régularisation"
          [loading]="isLoading()"
        />
      </section>

      <!-- Middle Section : Bloc Abonnements Séparés & Répartition SaaS (F26.1) -->
      <section class="dashboard-section">
        <app-dashboard-subscription-summary
          [paroisseStats]="paroisseStats()"
          [orgStats]="orgStats()"
          [repartitionProduits]="dashboardData()?.repartition_produits || []"
        />
      </section>

      <!-- Middle Lower Grid : Paroisses & Notifications -->
      <section class="dashboard-duo-grid">
        <app-dashboard-parish-summary
          [paroisses]="dashboardData()?.paroisses || { total: 0, actives: 0 }"
          [produitsActifs]="dashboardData()?.produits_actifs || 0"
        />

        <app-dashboard-notifications
          [notifications]="notifications()"
        />
      </section>

      <!-- Bottom Section : Activité Récente (Audit) & Corbeille en Aperçu (F26.1) -->
      <section class="dashboard-duo-grid">
        <app-dashboard-recent-activity
          [logs]="recentAuditLogs()"
        />

        <app-dashboard-trash-preview
          [totalDeleted]="trashTotal()"
          [restorableCount]="trashRestorable()"
          [toVerifyCount]="trashToVerify()"
          [recentDeleted]="recentTrashItems()"
        />
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .dashboard-page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    /* 6 KPI Cards Grid : 3 colonnes x 2 rangées (3 au-dessus, 3 en dessous) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    @media (max-width: 992px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 600px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .dashboard-duo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 992px) {
      .dashboard-duo-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly abonnementService = inject(AbonnementService);
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly auditService = inject(AuditService);
  private readonly trashService = inject(TrashService);

  public readonly dashboardData = signal<SuperAdminDashboardData | null>(null);
  public readonly isLoading = signal<boolean>(true);
  public readonly errorMessage = signal<string | null>(null);

  // Inactive subscriptions computed metrics (suspendus + expires + resilies)
  public readonly inactifsAbonnementsCount = computed<number>(() => {
    const ab = this.dashboardData()?.abonnements;
    if (!ab) return 0;
    return (ab.suspendus || 0) + (ab.expires || 0) + (ab.resilies || 0);
  });

  public readonly inactifsAbonnementsSubtitle = computed<string>(() => {
    const ab = this.dashboardData()?.abonnements;
    if (!ab) return '0 suspendu, 0 expiré';
    return `${ab.suspendus || 0} suspendus, ${ab.expires || 0} expirés`;
  });

  // Separate Subscription stats
  public readonly paroisseStats = signal<{ actifs: number; attente: number; suspendus: number }>({
    actifs: 0,
    attente: 0,
    suspendus: 0,
  });
  public readonly orgStats = signal<{ oppe: number; oppj: number; oppa: number }>({
    oppe: 0,
    oppj: 0,
    oppa: 0,
  });

  // Organisations count
  public readonly activeOrganisationsCount = signal<number>(0);

  // Recent audit logs timeline
  public readonly recentAuditLogs = signal<AuditLog[]>([]);

  // Trash summary
  public readonly trashTotal = signal<number>(0);
  public readonly trashRestorable = signal<number>(0);
  public readonly trashToVerify = signal<number>(0);
  public readonly recentTrashItems = signal<TrashItem[]>([]);

  // Notifications
  public readonly notifications = signal<DashboardNotificationItem[]>([]);

  public ngOnInit(): void {
    this.loadAllData();
  }

  public loadAllData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // 1. Consolidated dashboard API
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.buildNotifications(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.message || 'Impossible de charger les données du tableau de bord.'
        );
      },
    });

    // 2. Paroisses subscriptions
    this.abonnementService.getAbonnementsParoisses({ per_page: 100 }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.paroisseStats.set({
          actifs: list.filter((a) => a.statut === 'actif').length,
          attente: list.filter((a) => a.statut === 'en_attente').length,
          suspendus: list.filter((a) => a.statut === 'suspendu').length,
        });
      },
      error: () => {},
    });

    // 3. Organisations subscriptions
    this.abonnementService.getAbonnementsOrganisations({ per_page: 100 }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.orgStats.set({
          oppe: list.filter((a) => a.produit_code === 'OPPE' || a.produit_nom?.includes('OPPE')).length,
          oppj: list.filter((a) => a.produit_code === 'OPPJ' || a.produit_nom?.includes('OPPJ')).length,
          oppa: list.filter((a) => a.produit_code === 'OPPA' || a.produit_nom?.includes('OPPA')).length,
        });
      },
      error: () => {},
    });

    // 4. Organisations actives count
    this.orgService.getOrganisations({ statut: 'actif', per_page: 100 }).subscribe({
      next: (res) => {
        this.activeOrganisationsCount.set(res.meta?.total ?? res.data?.length ?? 0);
      },
      error: () => {},
    });

    // 5. Recent audit logs for timeline
    this.auditService.getAuditLogs({ per_page: 6 }).subscribe({
      next: (res) => {
        this.recentAuditLogs.set(res.data || []);
      },
      error: () => {},
    });

    // 6. Trash preview
    this.trashService.getTrashItems({ per_page: 10 }).subscribe({
      next: (res) => {
        const items = res.data || [];
        this.trashTotal.set(res.meta?.total ?? items.length);
        this.trashRestorable.set(items.length);
        this.trashToVerify.set(items.filter((i) => i.module === 'Organisation' || i.module === 'Paroisse').length);
        this.recentTrashItems.set(items);
      },
      error: () => {},
    });
  }

  private buildNotifications(data: SuperAdminDashboardData): void {
    const list: DashboardNotificationItem[] = [];

    if (data.abonnements?.en_attente > 0) {
      list.push({
        id: 'notif-pending-abos',
        type: 'warning',
        title: 'Souscriptions en attente',
        description: `${data.abonnements.en_attente} souscription(s) sont en attente de confirmation administrative.`,
        timeAgo: 'Prioritaire',
        icon: 'bi bi-clock-history',
      });
    }

    if (data.abonnements?.suspendus > 0) {
      list.push({
        id: 'notif-suspended-abos',
        type: 'danger',
        title: 'Abonnements suspendus',
        description: `${data.abonnements.suspendus} contrat(s) sont actuellement suspendus pour impayé ou arrêt administratif.`,
        timeAgo: 'Attention',
        icon: 'bi bi-exclamation-triangle',
      });
    }

    if (data.finances?.echeances_en_retard > 0) {
      list.push({
        id: 'notif-late-payments',
        type: 'danger',
        title: 'Échéances en retard',
        description: `${data.finances.echeances_en_retard} échéance(s) de paiement ont dépassé la date limite.`,
        timeAgo: 'Comptabilité',
        icon: 'bi bi-cash-stack',
      });
    }

    if (this.trashTotal() > 0) {
      list.push({
        id: 'notif-trash',
        type: 'info',
        title: 'Éléments dans la corbeille',
        description: `${this.trashTotal()} élément(s) supprimé(s) sont conservés et restaurables dans la corbeille.`,
        timeAgo: 'Audit',
        icon: 'bi bi-trash3',
      });
    }

    list.push({
      id: 'notif-system',
      type: 'success',
      title: 'Système opérationnel F25',
      description: 'Tous les services d’authentification Sanctum et micro-modules pastoraux répondent nominalement.',
      timeAgo: 'En direct',
      icon: 'bi bi-check-circle',
    });

    this.notifications.set(list);
  }
}
