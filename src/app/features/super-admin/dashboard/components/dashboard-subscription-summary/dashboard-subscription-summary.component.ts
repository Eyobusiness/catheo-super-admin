import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { DashboardProduitRepartition } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard-subscription-summary',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <app-card
      title="Abonnements & Répartition "
      subtitle="Supervision séparée des contrats paroissiaux et pastoraux avec accès direct"
    >
      <div class="sub-summary-container">
        <!-- Deux cartes de synthèse distinctes F26.1 -->
        <div class="abos-duo-cards">
          <!-- Carte Gauche : Abonnements CATHEO Paroisses -->
          <div class="abo-card catheo-card" (click)="navigateAbonnements('paroisses')">
            <div class="abo-card-header">
              <div class="abo-icon blue"><i class="bi bi-building"></i></div>
              <div class="abo-titles">
                <h4 class="abo-title">Abonnements CATHEO</h4>
                <span class="abo-subtitle">Paroisses diocésaines</span>
              </div>
              <span class="goto-arrow"><i class="bi bi-arrow-right"></i></span>
            </div>
            <div class="stats-pills-row">
              <div class="stat-pill green">
                <span class="pill-val">{{ paroisseStats().actifs }}</span>
                <span class="pill-lbl">Actifs</span>
              </div>
              <div class="stat-pill amber">
                <span class="pill-val">{{ paroisseStats().attente }}</span>
                <span class="pill-lbl">En attente</span>
              </div>
              <div class="stat-pill red">
                <span class="pill-val">{{ paroisseStats().suspendus }}</span>
                <span class="pill-lbl">Suspendus</span>
              </div>
            </div>
          </div>

          <!-- Carte Droite : Abonnements Organisations -->
          <div class="abo-card org-card" (click)="navigateAbonnements('organisations')">
            <div class="abo-card-header">
              <div class="abo-icon purple"><i class="bi bi-diagram-3"></i></div>
              <div class="abo-titles">
                <h4 class="abo-title">Abonnements Organisations</h4>
                <span class="abo-subtitle">Modules pastoraux</span>
              </div>
              <span class="goto-arrow"><i class="bi bi-arrow-right"></i></span>
            </div>
            <div class="stats-pills-row">
              <div class="stat-pill oppe">
                <span class="pill-val">{{ orgStats().oppe }}</span>
                <span class="pill-lbl">OPPE Enfance</span>
              </div>
              <div class="stat-pill oppj">
                <span class="pill-val">{{ orgStats().oppj }}</span>
                <span class="pill-lbl">OPPJ Jeunesse</span>
              </div>
              <div class="stat-pill oppa">
                <span class="pill-val">{{ orgStats().oppa }}</span>
                <span class="pill-lbl">OPPA Adultes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Répartition SaaS : Cartes Interactives (F26.1) -->
        <div class="saas-repartition-section">
          <div class="section-header-row">
            <h4 class="section-subtitle">
              <i class="bi bi-grid-fill me-1"></i> Répartition des Produits
            </h4>
          </div>

          <div class="interactive-saas-grid">
            <!-- CATHEO -->
            <div class="saas-card catheo" (click)="navigateToProduct('CATHEO')">
              <div class="saas-card-top">
                <span class="saas-badge catheo">CATHEO</span>
                <i class="bi bi-arrow-up-right click-icon"></i>
              </div>
              <span class="saas-title">Module Paroissial Central</span>
              <div class="saas-count-row">
                <span class="saas-count">{{ getProductCount('CATHEO') }}</span>
                <span class="saas-count-label">actif(s)</span>
              </div>
            </div>

            <!-- OPPE -->
            <div class="saas-card oppe" (click)="navigateToProduct('OPPE')">
              <div class="saas-card-top">
                <span class="saas-badge oppe">OPPE</span>
                <i class="bi bi-arrow-up-right click-icon"></i>
              </div>
              <span class="saas-title">Office Paroissial de la Pastorale des Enfants</span>
              <div class="saas-count-row">
                <span class="saas-count">{{ getProductCount('OPPE') }}</span>
                <span class="saas-count-label">actif(s)</span>
              </div>
            </div>

            <!-- OPPJ -->
            <div class="saas-card oppj" (click)="navigateToProduct('OPPJ')">
              <div class="saas-card-top">
                <span class="saas-badge oppj">OPPJ</span>
                <i class="bi bi-arrow-up-right click-icon"></i>
              </div>
              <span class="saas-title">Office Paroissial de la Pastorale des Jeunes</span>
              <div class="saas-count-row">
                <span class="saas-count">{{ getProductCount('OPPJ') }}</span>
                <span class="saas-count-label">actif(s)</span>
              </div>
            </div>

            <!-- OPPA -->
            <div class="saas-card oppa" (click)="navigateToProduct('OPPA')">
              <div class="saas-card-top">
                <span class="saas-badge oppa">OPPA</span>
                <i class="bi bi-arrow-up-right click-icon"></i>
              </div>
              <span class="saas-title">Office Paroissial de la Pastorale des Adultes</span>
              <div class="saas-count-row">
                <span class="saas-count">{{ getProductCount('OPPA') }}</span>
                <span class="saas-count-label">actif(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-card>
  `,
  styles: [`
    :host {
      display: block;
    }
    .sub-summary-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .abos-duo-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .abos-duo-cards {
        grid-template-columns: 1fr;
      }
    }
    .abo-card {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.125rem;
      background: var(--bg-surface, #ffffff);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all var(--transition-fast, 150ms ease);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .abo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      border-color: var(--primary-400, #38bdf8);
    }
    .abo-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .abo-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .abo-icon.blue {
      background: rgba(2, 132, 199, 0.1);
      color: #0284c7;
    }
    .abo-icon.purple {
      background: rgba(147, 51, 234, 0.1);
      color: #9333ea;
    }
    .abo-titles {
      flex: 1;
      min-width: 0;
    }
    .abo-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .abo-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }
    .goto-arrow {
      color: var(--text-muted, #94a3b8);
      font-size: 1rem;
      transition: transform var(--transition-fast, 150ms ease);
    }
    .abo-card:hover .goto-arrow {
      transform: translateX(3px);
      color: var(--primary-600, #0284c7);
    }
    .stats-pills-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0.25rem;
      border-radius: var(--radius-sm, 6px);
      text-align: center;
      border: 1px solid transparent;
    }
    .stat-pill.green {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }
    .stat-pill.amber {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }
    .stat-pill.red {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .stat-pill.oppe {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }
    .stat-pill.oppj {
      background: #fdf4ff;
      border-color: #f5d0fe;
      color: #86198f;
    }
    .stat-pill.oppa {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .pill-val {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .pill-lbl {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    /* SaaS Grid */
    .saas-repartition-section {
      border-top: 1px solid var(--border-color, #e2e8f0);
      padding-top: 1.25rem;
    }
    .section-subtitle {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
    }
    .interactive-saas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.875rem;
    }
    .saas-card {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      padding: 0.875rem;
      background: var(--bg-surface, #ffffff);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all var(--transition-fast, 150ms ease);
    }
    .saas-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .saas-card.catheo:hover { border-color: #0284c7; }
    .saas-card.oppe:hover { border-color: #2563eb; }
    .saas-card.oppj:hover { border-color: #9333ea; }
    .saas-card.oppa:hover { border-color: #16a34a; }
    .saas-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .click-icon {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      transition: transform var(--transition-fast, 150ms ease);
    }
    .saas-card:hover .click-icon {
      transform: translate(2px, -2px);
      color: var(--primary-600, #0284c7);
    }
    .saas-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .saas-badge.catheo { background: #e0f2fe; color: #0369a1; }
    .saas-badge.oppe { background: #dbeafe; color: #1d4ed8; }
    .saas-badge.oppj { background: #f3e8ff; color: #7e22ce; }
    .saas-badge.oppa { background: #dcfce7; color: #15803d; }
    .saas-title {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
      line-height: 1.3;
    }
    .saas-count-row {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      margin-top: auto;
    }
    .saas-count {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
    }
    .saas-count-label {
      font-size: 0.6875rem;
      color: var(--text-secondary, #64748b);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSubscriptionSummaryComponent {
  private readonly router = inject(Router);

  public readonly paroisseStats = input<{ actifs: number; attente: number; suspendus: number }>({
    actifs: 0,
    attente: 0,
    suspendus: 0,
  });

  public readonly orgStats = input<{ oppe: number; oppj: number; oppa: number }>({
    oppe: 0,
    oppj: 0,
    oppa: 0,
  });

  public readonly repartitionProduits = input<DashboardProduitRepartition[]>([]);

  protected getProductCount(code: string): number {
    const found = this.repartitionProduits().find(
      (p) => p.produit_code === code || p.produit_nom?.includes(code)
    );
    return found ? found.abonnements_actifs : 0;
  }

  protected navigateAbonnements(section: 'paroisses' | 'organisations'): void {
    this.router.navigate(['/super-admin/abonnements']);
  }

  protected navigateToProduct(code: string): void {
    if (code === 'CATHEO') {
      this.router.navigate(['/super-admin/paroisses']);
    } else {
      this.router.navigate(['/super-admin/organisations'], {
        queryParams: { produit: code },
      });
    }
  }
}
