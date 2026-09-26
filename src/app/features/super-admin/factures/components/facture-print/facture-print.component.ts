import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Facture } from '../../models/facture.model';
import { FactureStatusBadgeComponent } from '../facture-status-badge/facture-status-badge.component';
import { CurrencyCfaPipe } from '../../../../../shared/pipes/currency-cfa.pipe';

@Component({
  selector: 'app-facture-print',
  standalone: true,
  imports: [CommonModule, FactureStatusBadgeComponent, CurrencyCfaPipe],
  template: `
    <div class="facture-document">
      <!-- Toolbar (hidden during print) -->
      <div class="facture-toolbar no-print">
        <button type="button" class="btn btn-primary" (click)="imprimer()">
          <i class="bi bi-printer me-2"></i> Imprimer / Exporter en PDF
        </button>
      </div>

      <!-- Printable invoice sheet -->
      <div class="facture-sheet">
        <!-- Header -->
        <header class="facture-header">
          <div class="brand">
            <div class="logo-mark">CATHEO</div>
            <div class="brand-tagline">Système Central de Gestion Paroissiale SaaS</div>
            <div class="company-details">
              Plateforme centrale de gestion diocésaine et paroissiale<br />
              Email: support&#64;catheo.ci — Web: https://catheo.ci
            </div>
          </div>

          <div class="invoice-meta">
            <h1 class="invoice-title">FACTURE</h1>
            <div class="meta-row">
              <span class="meta-label">Référence :</span>
              <strong class="meta-value">{{ facture().reference }}</strong>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date d'émission :</span>
              <span class="meta-value">{{ facture().date_facture | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date d'échéance :</span>
              <span class="meta-value">{{ facture().date_echeance | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="meta-row status-row">
              <span class="meta-label">Statut :</span>
              <app-facture-status-badge [statut]="facture().statut" />
            </div>
          </div>
        </header>

        <hr class="divider" />

        <!-- Client & Subscription Info -->
        <section class="facture-parties">
          <div class="party-block client-block">
            <h3 class="party-heading">Facturé à (Paroisse) :</h3>
            <div class="party-content">
              <strong>{{ getParoisseNom() }}</strong>
              @if (getParoisseCode()) {
                <div>Code : {{ getParoisseCode() }}</div>
              }
              @if (getDiocese()) {
                <div>Diocèse : {{ getDiocese() }}</div>
              }
              @if (getParoisseEmail()) {
                <div>Email : {{ getParoisseEmail() }}</div>
              }
              @if (getParoisseTelephone()) {
                <div>Tél : {{ getParoisseTelephone() }}</div>
              }
            </div>
          </div>

          <div class="party-block sub-block">
            <h3 class="party-heading">Détails Abonnement :</h3>
            <div class="party-content">
              <div>Abonnement : <strong>{{ getAbonnementRef() }}</strong></div>
              <div>Produit : <strong>{{ getProduitNom() }}</strong></div>
              <div>Formule : <strong>{{ getFormuleNom() }}</strong></div>
              @if (facture().echeance) {
                <div>
                  Période :
                  {{ facture().echeance?.periode_debut | date:'dd/MM/yyyy' }}
                  au
                  {{ facture().echeance?.periode_fin | date:'dd/MM/yyyy' }}
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Line items table -->
        <section class="facture-body">
          <table class="items-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="text-center">Période</th>
                <th class="text-end">Montant HT</th>
                <th class="text-end">TVA (%)</th>
                <th class="text-end">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Abonnement {{ getProduitNom() }} — Formule {{ getFormuleNom() }}</strong>
                  @if (facture().description) {
                    <div class="item-desc">{{ facture().description }}</div>
                  }
                </td>
                <td class="text-center">
                  @if (facture().echeance) {
                    {{ facture().echeance?.periode_debut | date:'dd/MM/yy' }} - {{ facture().echeance?.periode_fin | date:'dd/MM/yy' }}
                  } @else {
                    -
                  }
                </td>
                <td class="text-end">{{ facture().montant_ht | currencyCfa:'XOF' }}</td>
                <td class="text-end">{{ facture().taux_tva }}%</td>
                <td class="text-end font-semibold">{{ facture().montant_ttc | currencyCfa:'XOF' }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Totals section -->
        <section class="facture-totals-container">
          <div class="totals-notes">
            @if (facture().observation) {
              <div class="notes-box">
                <span class="notes-title">Observations :</span>
                <p>{{ facture().observation }}</p>
              </div>
            }
          </div>

          <div class="totals-table-wrapper">
            <table class="totals-table">
              <tr>
                <td>Total Hors Taxes (HT) :</td>
                <td class="text-end">{{ facture().montant_ht | currencyCfa:'XOF' }}</td>
              </tr>
              <tr>
                <td>TVA ({{ facture().taux_tva }}%) :</td>
                <td class="text-end">{{ facture().montant_tva | currencyCfa:'XOF' }}</td>
              </tr>
              <tr class="total-ttc-row">
                <td><strong>Total TTC :</strong></td>
                <td class="text-end"><strong>{{ facture().montant_ttc | currencyCfa:'XOF' }}</strong></td>
              </tr>
              @if (facture().echeance) {
                <tr class="payments-row">
                  <td>Montant réglé :</td>
                  <td class="text-end text-success">{{ facture().echeance?.montant_paye | currencyCfa:'XOF' }}</td>
                </tr>
                <tr class="balance-row">
                  <td><strong>Solde restant à payer :</strong></td>
                  <td class="text-end font-bold text-danger">
                    {{ facture().echeance?.solde_restant | currencyCfa:'XOF' }}
                  </td>
                </tr>
              }
            </table>
          </div>
        </section>

        <!-- Payments history if available -->
        @if (facture().echeance?.paiements && (facture().echeance?.paiements?.length || 0) > 0) {
          <section class="facture-payments-history">
            <h3 class="payments-title">Règlements enregistrés</h3>
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Réf. Paiement</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Réf. Transaction</th>
                  <th class="text-end">Montant</th>
                  <th class="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (p of facture().echeance?.paiements; track p.id) {
                  <tr>
                    <td>{{ p.reference }}</td>
                    <td>{{ p.date_paiement | date:'dd/MM/yyyy' }}</td>
                    <td>{{ p.mode_paiement }}</td>
                    <td>{{ p.reference_transaction || '-' }}</td>
                    <td class="text-end font-medium">{{ p.montant | currencyCfa:'XOF' }}</td>
                    <td class="text-center">{{ p.statut }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }

        <!-- Footer -->
        <footer class="facture-footer">
          <p>Document officiel émis par la plateforme CATHEO Super Administration.</p>
          <p>Pour toute question comptable, veuillez contacter le support à l'adresse support&#64;catheo.ci.</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .facture-document {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    .facture-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 0.15s ease-in-out;
    }

    .btn-primary {
      background-color: var(--primary-600, #0284c7);
      color: #ffffff;
    }

    .btn-primary:hover {
      background-color: var(--primary-700, #0369a1);
    }

    .facture-sheet {
      background-color: #ffffff;
      padding: 2.5rem;
      border-radius: var(--radius-lg, 0.5rem);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      color: #1e293b;
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    .facture-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .logo-mark {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--primary-700, #0369a1);
    }

    .brand-tagline {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      margin-top: 0.25rem;
    }

    .company-details {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.5rem;
      line-height: 1.4;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      letter-spacing: 0.05em;
    }

    .meta-row {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .meta-label {
      color: #64748b;
    }

    .meta-value {
      color: #0f172a;
    }

    .status-row {
      margin-top: 0.5rem;
      align-items: center;
    }

    .divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 1.5rem 0;
    }

    .facture-parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .party-heading {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .party-content {
      font-size: 0.9375rem;
      color: #334155;
      line-height: 1.45;
    }

    .items-table, .payments-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }

    .items-table th, .payments-table th {
      background-color: #f8fafc;
      padding: 0.75rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e2e8f0;
    }

    .items-table td, .payments-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
    }

    .item-desc {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .facture-totals-container {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      margin-top: 1rem;
      margin-bottom: 2rem;
    }

    .notes-box {
      background-color: #f8fafc;
      border-left: 3px solid var(--primary-500, #0ea5e9);
      padding: 0.75rem 1rem;
      font-size: 0.8125rem;
      color: #475569;
    }

    .notes-title {
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 0.5rem 0;
      font-size: 0.9375rem;
    }

    .total-ttc-row td {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 0.75rem 0;
      font-size: 1.0625rem;
    }

    .payments-row td {
      padding-top: 0.75rem;
    }

    .balance-row td {
      border-top: 1px dashed #cbd5e1;
      padding-top: 0.5rem;
    }

    .payments-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.75rem;
    }

    .facture-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 1.5rem;
      margin-top: 2.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .text-center { text-align: center; }
    .text-end { text-align: right; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-success { color: #047857; }
    .text-danger { color: #b91c1c; }

    @media print {
      .no-print {
        display: none !important;
      }

      body {
        background: #ffffff !important;
        color: #000000 !important;
      }

      .facture-document {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .facture-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturePrintComponent {
  public readonly facture = input.required<Facture>();

  public imprimer(): void {
    window.print();
  }

  protected getParoisseNom(): string {
    const f = this.facture();
    return (
      f.echeance?.abonnement?.paroisse?.nom_paroisse ||
      f.echeance?.abonnement?.paroisse_nom ||
      'Paroisse non spécifiée'
    );
  }

  protected getParoisseCode(): string {
    const f = this.facture();
    return (
      f.echeance?.abonnement?.paroisse?.code_paroisse ||
      f.echeance?.abonnement?.paroisse_code ||
      ''
    );
  }

  protected getDiocese(): string {
    const f = this.facture();
    return f.echeance?.abonnement?.paroisse?.diocese || '';
  }

  protected getParoisseEmail(): string {
    const f = this.facture();
    return f.echeance?.abonnement?.paroisse?.email || '';
  }

  protected getParoisseTelephone(): string {
    const f = this.facture();
    return f.echeance?.abonnement?.paroisse?.telephone || '';
  }

  protected getAbonnementRef(): string {
    const f = this.facture();
    return f.echeance?.abonnement?.reference || '-';
  }

  protected getProduitNom(): string {
    const f = this.facture();
    return (
      f.echeance?.abonnement?.formule?.produit?.nom ||
      f.echeance?.abonnement?.produit_nom ||
      '-'
    );
  }

  protected getFormuleNom(): string {
    const f = this.facture();
    return (
      f.echeance?.abonnement?.formule?.nom ||
      f.echeance?.abonnement?.formule_nom ||
      '-'
    );
  }
}
