import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { ToastService } from '../../../../core/services/toast.service';
import { SuperAdminOrganisationService } from '../services/super-admin-organisation.service';
import { OrganisationUserService } from '../services/organisation-user.service';
import { SuperAdminOrganisation } from '../models/super-admin-organisation.model';
import {
  OrganisationUser,
  OrganisationProfil,
} from '../models/organisation-user.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { OrganisationSummaryCardComponent } from '../components/organisation-summary-card/organisation-summary-card.component';
import { FirstResponsableModalComponent } from '../components/first-responsable-modal/first-responsable-modal.component';
import { OrganisationUserModalComponent } from '../components/organisation-user-modal/organisation-user-modal.component';
import { OrganisationEditModalComponent } from '../components/organisation-edit-modal/organisation-edit-modal.component';

@Component({
  selector: 'app-organisation-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    TableComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    OrganisationSummaryCardComponent,
    FirstResponsableModalComponent,
    OrganisationUserModalComponent,
    OrganisationEditModalComponent,
  ],
  template: `
    <div class="page-container">
      @if (loadingOrg()) {
        <app-loading-state message="Chargement des données de l'organisation..." />
      } @else if (errorOrg()) {
        <app-error-state
          title="Organisation introuvable"
          [message]="errorOrgMessage()"
          (retry)="loadData()"
        />
      } @else if (organisation()) {
        <app-page-header
          [title]="organisation()!.nom"
          [subtitle]="pageSubtitle()"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Organisations', path: '/super-admin/organisations' },
            { label: organisation()!.nom }
          ]"
        >
          <div page-actions class="d-flex gap-2">
            <app-btn
              variant="outline"
              size="md"
              (btnClick)="openEditModal()"
              title="Modifier les coordonnées et informations"
            >
              <i class="bi bi-pencil me-1"></i>
              <span>Modifier</span>
            </app-btn>

            <app-btn
              variant="primary"
              size="md"
              (btnClick)="openResponsableModal()"
              [title]="organisation()!.responsable_nom ? 'Réassigner le responsable' : 'Créer le premier responsable'"
            >
              <i class="bi bi-person-badge me-1"></i>
              <span>{{ organisation()!.responsable_nom ? 'Responsable' : 'Premier Responsable' }}</span>
            </app-btn>
          </div>
        </app-page-header>

        <div class="detail-layout">
          <!-- Carte de synthèse principale -->
          <app-organisation-summary-card [organisation]="organisation()!" />

          <!-- Barre de Navigation par Onglets (9 modules) -->
          <div class="tabs-nav-container mt-4">
            <nav class="tabs-nav" aria-label="Navigation interne organisation">
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'informations'"
                (click)="setTab('informations')"
              >
                <i class="bi bi-info-circle me-1"></i>
                <span>Informations</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'responsable'"
                (click)="setTab('responsable')"
              >
                <i class="bi bi-person-badge me-1"></i>
                <span>Responsable</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'utilisateurs'"
                (click)="setTab('utilisateurs')"
              >
                <i class="bi bi-people me-1"></i>
                <span>Utilisateurs</span>
                <span class="tab-badge">{{ getTabCount('utilisateurs') }}</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'membres'"
                (click)="setTab('membres')"
              >
                <i class="bi bi-person-lines-fill me-1"></i>
                <span>Membres</span>
                <span class="tab-badge">{{ getTabCount('membres') }}</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'activites'"
                (click)="setTab('activites')"
              >
                <i class="bi bi-calendar-event me-1"></i>
                <span>Activités</span>
                <span class="tab-badge">{{ getTabCount('activites') }}</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'pelerinages'"
                (click)="setTab('pelerinages')"
              >
                <i class="bi bi-compass me-1"></i>
                <span>Pèlerinages</span>
                <span class="tab-badge">{{ getTabCount('pelerinages') }}</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'caisse'"
                (click)="setTab('caisse')"
              >
                <i class="bi bi-wallet2 me-1"></i>
                <span>Caisse</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'statistiques'"
                (click)="setTab('statistiques')"
              >
                <i class="bi bi-graph-up me-1"></i>
                <span>Statistiques</span>
              </button>

              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === 'abonnement'"
                (click)="setTab('abonnement')"
              >
                <i class="bi bi-credit-card-2-front me-1"></i>
                <span>Abonnement</span>
              </button>
            </nav>
          </div>

          <!-- Contenu des Onglets -->
          <div class="tab-content-area mt-4">
            <!-- ONGLET 1 : Informations -->
            @if (activeTab() === 'informations') {
              <app-card title="Coordonnées & Informations Générales">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Email officiel</span>
                    <span class="info-val">{{ organisation()!.email || 'Non renseigné' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Téléphone</span>
                    <span class="info-val">{{ organisation()!.telephone || 'Non renseigné' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Adresse géographique</span>
                    <span class="info-val">{{ organisation()!.adresse || 'Non renseignée' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Référence UUID</span>
                    <span class="info-val font-mono">{{ organisation()!.uuid || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Paroisse rattachée</span>
                    <span class="info-val">{{ organisation()!.paroisse?.nom_paroisse || organisation()!.paroisse?.nom || 'Aucune (Indépendante)' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mode d'organisation</span>
                    <span class="info-val font-semibold">{{ organisation()!.mode === 'independant' ? 'Indépendante' : 'Liée à la paroisse' }}</span>
                  </div>
                  @if (organisation()!.description) {
                    <div class="info-item full-width">
                      <span class="info-label">Description / Missions</span>
                      <p class="info-desc">{{ organisation()!.description }}</p>
                    </div>
                  }
                </div>
              </app-card>
            }

            <!-- ONGLET 2 : Responsable -->
            @if (activeTab() === 'responsable') {
              <app-card title="Responsable de l'Organisation">
                <div card-actions>
                  <app-btn
                    variant="outline"
                    size="sm"
                    (btnClick)="openResponsableModal()"
                  >
                    <i class="bi bi-person-badge me-1"></i>
                    <span>{{ (organisation()!.responsable_nom || organisation()!.responsable?.nom) ? 'Changer de responsable' : 'Assigner un responsable' }}</span>
                  </app-btn>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nom complet</span>
                    <span class="info-val font-semibold">{{ organisation()!.responsable_nom || organisation()!.responsable?.nom || 'Non assigné' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email de contact</span>
                    <span class="info-val">{{ organisation()!.responsable_email || organisation()!.responsable?.email || 'Non renseigné' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Téléphone direct</span>
                    <span class="info-val">{{ organisation()!.responsable_telephone || organisation()!.responsable?.telephone || 'Non renseigné' }}</span>
                  </div>
                </div>
              </app-card>
            }

            <!-- ONGLET 3 : Utilisateurs -->
            @if (activeTab() === 'utilisateurs') {
              <app-card
                title="Utilisateurs & Équipe Pastorale"
                subtitle="Comptes rattachés exclusivement à cet espace organisationnel"
              >
                <div card-actions>
                  <app-btn
                    variant="primary"
                    size="sm"
                    (btnClick)="openCreateUserModal()"
                  >
                    <i class="bi bi-plus-lg me-1"></i>
                    <span>Nouvel Utilisateur</span>
                  </app-btn>
                </div>

                @if (loadingUsers()) {
                  <app-loading-state message="Chargement des utilisateurs de l'organisation..." />
                } @else if (errorUsers()) {
                  <app-error-state
                    title="Erreur utilisateurs"
                    [message]="errorUsersMessage()"
                    (retry)="loadUsers()"
                  />
                } @else {
                  <app-table
                    [columns]="userColumns"
                    [data]="users()"
                    [loading]="loadingUsers()"
                    [hasActions]="true"
                    [rowActionsTemplate]="userActionsTpl"
                    emptyMessage="Aucun compte utilisateur"
                    emptySubtitle="Cette organisation ne dispose pas encore de comptes associés."
                  />
                }

                <ng-template #userActionsTpl let-user>
                  <div class="table-actions">
                    <app-btn
                      variant="ghost"
                      size="sm"
                      (btnClick)="openEditUserModal(user)"
                      title="Modifier l'utilisateur"
                    >
                      <i class="bi bi-pencil"></i>
                    </app-btn>

                    <app-btn
                      [variant]="user.statut === 'actif' ? 'outline' : 'ghost'"
                      size="sm"
                      (btnClick)="promptToggleStatus(user)"
                      [title]="user.statut === 'actif' ? 'Désactiver le compte' : 'Activer le compte'"
                    >
                      <i [class]="user.statut === 'actif' ? 'bi bi-person-x text-danger' : 'bi bi-person-check text-success'"></i>
                    </app-btn>
                  </div>
                </ng-template>
              </app-card>
            }

            <!-- ONGLET 4 : Membres -->
            @if (activeTab() === 'membres') {
              <app-card
                title="Membres Enregistrés"
                subtitle="Effectif pastoral sous la responsabilité de cet espace"
              >
                @if (organisation()!.membres && organisation()!.membres!.length > 0) {
                  <div class="table-container">
                    <table class="simple-data-table">
                      <thead>
                        <tr>
                          <th>Nom & Prénoms</th>
                          <th>Code Matricule</th>
                          <th>Statut</th>
                          <th>Date d'adhésion</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (m of organisation()!.membres!; track m.id || m.uuid || $index) {
                          <tr>
                            <td class="font-medium">{{ m.nom_complet || m.nom || m.prenoms || 'Membre' }}</td>
                            <td class="font-mono">{{ m.matricule || m.code || '-' }}</td>
                            <td><span class="badge-statut actif">{{ m.statut || 'Actif' }}</span></td>
                            <td>{{ m.created_at ? (m.created_at | date:'dd/MM/yyyy') : '-' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <app-empty-state
                    title="Aucun membre enregistré"
                    message="Cet espace organisationnel ne comporte pas encore de membres enregistrés dans sa base pastorale."
                    icon="bi bi-people"
                  />
                }
              </app-card>
            }

            <!-- ONGLET 5 : Activités -->
            @if (activeTab() === 'activites') {
              <app-card
                title="Activités & Événements Pastoraux"
                subtitle="Calendrier et historique des rassemblements organisés"
              >
                @if (organisation()!.activites && organisation()!.activites!.length > 0) {
                  <div class="table-container">
                    <table class="simple-data-table">
                      <thead>
                        <tr>
                          <th>Activité</th>
                          <th>Date / Période</th>
                          <th>Lieu</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (act of organisation()!.activites!; track act.id || act.uuid || $index) {
                          <tr>
                            <td class="font-medium">{{ act.titre || act.nom || 'Activité pastorale' }}</td>
                            <td>{{ act.date_debut ? (act.date_debut | date:'dd/MM/yyyy') : '-' }}</td>
                            <td>{{ act.lieu || '-' }}</td>
                            <td><span class="badge-statut actif">{{ act.statut || 'Planifiée' }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <app-empty-state
                    title="Aucune activité planifiée"
                    message="Aucune activité pastorale n'a été enregistrée pour cette organisation."
                    icon="bi bi-calendar-event"
                  />
                }
              </app-card>
            }

            <!-- ONGLET 6 : Pèlerinages -->
            @if (activeTab() === 'pelerinages') {
              <app-card
                title="Pèlerinages & Voyages Spirituels"
                subtitle="Campagnes de pèlerinage et inscriptions associées"
              >
                @if (organisation()!.pelerinages && organisation()!.pelerinages!.length > 0) {
                  <div class="table-container">
                    <table class="simple-data-table">
                      <thead>
                        <tr>
                          <th>Destination / Titre</th>
                          <th>Dates</th>
                          <th>Participants</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (pel of organisation()!.pelerinages!; track pel.id || pel.uuid || $index) {
                          <tr>
                            <td class="font-medium">{{ pel.titre || pel.destination || 'Pèlerinage' }}</td>
                            <td>{{ pel.date_depart ? (pel.date_depart | date:'dd/MM/yyyy') : '-' }}</td>
                            <td>{{ pel.total_inscrits ?? 0 }}</td>
                            <td><span class="badge-statut actif">{{ pel.statut || 'Ouvert' }}</span></td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <app-empty-state
                    title="Aucun pèlerinage programmé"
                    message="Aucun projet ou voyage spirituel n'a été créé pour le moment."
                    icon="bi bi-compass"
                  />
                }
              </app-card>
            }

            <!-- ONGLET 7 : Caisse -->
            @if (activeTab() === 'caisse') {
              <app-card
                title="Gestion de Caisse & Trésorerie"
                subtitle="Suivi des écritures et solde financier de l'organisation"
              >
                <div class="caisse-header mb-4">
                  <div class="solde-card" [class.solde-negatif]="soldeCaisse() < 0">
                    <span class="solde-label"><i class="bi bi-wallet2"></i> Solde disponible en caisse</span>
                    <span class="solde-montant">{{ soldeCaisse() | number:'1.0-0' }} FCFA</span>
                    @if ((organisation()!.caisse?.operations?.length ?? 0) > 0) {
                      <span class="solde-sub">Calculé sur {{ organisation()!.caisse!.operations!.length }} opération(s)</span>
                    }
                  </div>
                </div>

                @if ((organisation()?.caisse?.operations?.length ?? 0) > 0) {
                  <div class="table-container">
                    <table class="simple-data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Libellé / Opération</th>
                          <th>Type</th>
                          <th class="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (op of (organisation()?.caisse?.operations ?? []); track op.id || $index) {
                          <tr>
                            <td>{{ (op.date_operation || op.created_at) ? ((op.date_operation || op.created_at) | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
                            <td>{{ op.libelle || op.description || op.reference || 'Opération' }}</td>
                            <td>
                              <span [class]="op.type_operation === 'entree' || op.type === 'entree' ? 'badge-statut actif' : 'badge-statut inactif'">
                                {{ (op.type_operation === 'entree' || op.type === 'entree') ? 'Entrée' : 'Sortie' }}
                              </span>
                            </td>
                            <td class="text-right font-semibold">
                              {{ (op.type_operation === 'sortie' || op.type === 'sortie' ? '-' : '+') }} {{ (op.montant ?? 0) | number:'1.0-0' }} FCFA
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <app-empty-state
                    title="Aucune opération enregistrée"
                    message="Aucune écriture de recettes ou dépenses n'a été inscrite sur cette caisse."
                    icon="bi bi-wallet2"
                  />
                }
              </app-card>
            }

            <!-- ONGLET 8 : Statistiques -->
            @if (activeTab() === 'statistiques') {
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon blue"><i class="bi bi-people-fill"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ organisation()!.statistiques?.total_membres ?? organisation()!.membres?.length ?? organisation()!.membres_count ?? 0 }}</span>
                    <span class="stat-title">Membres Actifs</span>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon green"><i class="bi bi-calendar-check-fill"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ organisation()!.statistiques?.total_activites ?? organisation()!.activites?.length ?? organisation()!.activites_count ?? 0 }}</span>
                    <span class="stat-title">Activités Conduites</span>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon purple"><i class="bi bi-compass-fill"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ organisation()!.statistiques?.total_pelerinages ?? organisation()!.pelerinages?.length ?? 0 }}</span>
                    <span class="stat-title">Pèlerinages / Voyages</span>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon amber"><i class="bi bi-person-badge-fill"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ users().length > 0 ? users().length : (organisation()!.statistiques?.total_utilisateurs ?? organisation()!.utilisateurs?.length ?? organisation()!.users_count ?? 0) }}</span>
                    <span class="stat-title">Comptes Utilisateurs</span>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon emerald"><i class="bi bi-wallet2"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ soldeCaisse() | number:'1.0-0' }} F</span>
                    <span class="stat-title">Solde de Caisse</span>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon slate"><i class="bi bi-receipt"></i></div>
                  <div class="stat-meta">
                    <span class="stat-value">{{ organisation()!.statistiques?.total_operations ?? organisation()!.caisse?.operations?.length ?? 0 }}</span>
                    <span class="stat-title">Opérations de Caisse</span>
                  </div>
                </div>
              </div>
            }

            <!-- ONGLET 9 : Abonnement -->
            @if (activeTab() === 'abonnement') {
              <app-card
                title="Abonnement SaaS & Licence de l'Organisation"
                subtitle="Souscription dédiée à cet espace métier"
              >
                @if (organisation()!.abonnement) {
                  <div class="abo-full-card">
                    <div class="abo-badge-tag">{{ organisation()!.abonnement.statut || 'Actif' }}</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Formule Tarifaire</span>
                        <span class="info-val font-semibold">{{ organisation()!.abonnement.formule_nom || organisation()!.abonnement.nom || 'Formule Standard' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Référence Contrat</span>
                        <span class="info-val font-mono">{{ organisation()!.abonnement.reference || '-' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Tarif de souscription</span>
                        <span class="info-val font-semibold">{{ (organisation()!.abonnement.montant ?? 0) | number:'1.0-0' }} FCFA</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Produit SaaS</span>
                        <span class="info-val">{{ organisation()!.abonnement.produit_code || organisation()!.type_organisation }}</span>
                      </div>
                    </div>
                  </div>
                } @else {
                  <app-empty-state
                    title="Aucun abonnement direct"
                    message="Cette organisation bénéficie de la couverture globale de sa paroisse ou n'a pas encore souscrit de formule individuelle."
                    icon="bi bi-credit-card-2-front"
                  />
                }
              </app-card>
            }
          </div>
        </div>


        <!-- Modales -->
        <app-first-responsable-modal
          [isOpen]="isResponsableModalOpen()"
          [organisation]="organisation()!"
          (close)="isResponsableModalOpen.set(false)"
          (responsableCreated)="onResponsableCreated()"
        />

        <app-organisation-user-modal
          [isOpen]="isUserModalOpen()"
          [organisation]="organisation()!"
          [userToEdit]="selectedUserToEdit()"
          [availableProfils]="profils()"
          (close)="isUserModalOpen.set(false)"
          (userSaved)="onUserSaved()"
        />

        <app-organisation-edit-modal
          [isOpen]="isEditModalOpen()"
          [organisation]="organisation()!"
          (close)="isEditModalOpen.set(false)"
          (organisationUpdated)="onOrgUpdated()"
        />

        <!-- Dialogue de confirmation activation / désactivation -->
        <app-confirm-dialog
          [isOpen]="isConfirmToggleOpen()"
          [title]="userToToggle()?.statut === 'actif' ? 'Désactiver le compte' : 'Activer le compte'"
          [message]="toggleConfirmMessage()"
          [variant]="userToToggle()?.statut === 'actif' ? 'danger' : 'info'"
          [confirmText]="userToToggle()?.statut === 'actif' ? 'Désactiver' : 'Activer'"
          [loading]="loadingToggle()"
          (confirmed)="confirmToggleStatus()"
          (cancelled)="isConfirmToggleOpen.set(false)"
        />
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }
    .d-flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .me-1 { margin-right: 0.25rem; }
    .mt-4 { margin-top: 1.25rem; }
    .detail-layout {
      display: flex;
      flex-direction: column;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .info-label {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.025em;
      font-weight: 500;
    }
    .info-val {
      font-size: 0.9375rem;
      color: var(--text-primary, #1e293b);
    }
    .font-mono {
      font-family: monospace;
      font-size: 0.8125rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .info-desc {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--text-secondary, #475569);
    }
    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
    }
    .text-danger { color: #dc2626; }
    .text-success { color: #16a34a; }

    /* Tabs Navigation */
    .tabs-nav-container {
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      background-color: var(--bg-surface, #ffffff);
      border-radius: var(--radius-md, 8px) var(--radius-md, 8px) 0 0;
      padding: 0.25rem 0.5rem 0;
    }
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tabs-nav::-webkit-scrollbar {
      display: none;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.65rem 1rem;
      border: none;
      background: transparent;
      color: var(--text-muted, #64748b);
      font-size: 0.875rem;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text-primary, #0f172a);
    }
    .tab-btn.active {
      color: var(--color-primary-600, #2563eb);
      border-bottom-color: var(--color-primary-600, #2563eb);
      font-weight: 600;
    }
    .tab-badge {
      margin-left: 0.4rem;
      font-size: 0.75rem;
      padding: 0.1rem 0.4rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--text-muted, #64748b);
    }
    .tab-btn.active .tab-badge {
      background-color: #dbeafe;
      color: #1e40af;
    }

    /* Simple Data Table for tab content */
    .table-container {
      overflow-x: auto;
    }
    .simple-data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .simple-data-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      color: var(--text-muted, #64748b);
      font-weight: 600;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .simple-data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      color: var(--text-primary, #1e293b);
    }
    .badge-statut {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-statut.actif {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-statut.inactif {
      background-color: #f1f5f9;
      color: #64748b;
    }

    /* Caisse & Solde */
    .caisse-header {
      margin-bottom: 1rem;
    }
    .solde-card {
      display: inline-flex;
      flex-direction: column;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: var(--radius-md, 10px);
      transition: all 0.2s ease;
    }
    .solde-card.solde-negatif {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-color: #fca5a5;
    }
    .solde-card.solde-negatif .solde-label { color: #991b1b; }
    .solde-card.solde-negatif .solde-montant { color: #7f1d1d; }
    .solde-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .solde-montant {
      font-size: 1.5rem;
      font-weight: 700;
      color: #14532d;
      margin-top: 0.25rem;
    }
    .solde-sub {
      font-size: 0.7rem;
      color: #166534;
      opacity: 0.75;
      margin-top: 0.15rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-sm);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md, 10px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-icon.blue { background-color: #eff6ff; color: #2563eb; }
    .stat-icon.green { background-color: #f0fdf4; color: #16a34a; }
    .stat-icon.purple { background-color: #faf5ff; color: #9333ea; }
    .stat-icon.amber { background-color: #fffbeb; color: #d97706; }
    .stat-icon.emerald { background-color: #ecfdf5; color: #059669; }
    .stat-icon.slate { background-color: #f1f5f9; color: #475569; }
    .stat-meta { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary, #0f172a); }
    .stat-title { font-size: 0.75rem; color: var(--text-muted, #64748b); font-weight: 500; }

    /* Abonnement Card */
    .abo-full-card {
      position: relative;
      padding: 1.5rem;
      background-color: var(--bg-muted, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }
    .abo-badge-tag {
      position: absolute;
      top: 1.25rem;
      right: 1.5rem;
      background-color: #dcfce7;
      color: #15803d;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full, 9999px);
    }
    .text-right { text-align: right; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly userService = inject(OrganisationUserService);
  private readonly toast = inject(ToastService);

  public readonly activeTab = signal<
    | 'informations'
    | 'responsable'
    | 'utilisateurs'
    | 'membres'
    | 'activites'
    | 'pelerinages'
    | 'caisse'
    | 'statistiques'
    | 'abonnement'
  >('informations');

  protected readonly organisation = signal<SuperAdminOrganisation | null>(null);
  protected readonly loadingOrg = signal<boolean>(true);
  protected readonly errorOrg = signal<boolean>(false);
  protected readonly errorOrgMessage = signal<string>('');

  /**
   * Solde calculé depuis les opérations de caisse.
   * Priorité : caisse.solde_actuel > statistiques.solde_caisse > calculé depuis opérations
   */
  protected readonly soldeCaisse = computed<number>(() => {
    const org = this.organisation();
    if (!org) return 0;
    // 1. Champ direct de la réponse API
    if (org.caisse?.solde_actuel != null && org.caisse.solde_actuel !== 0) {
      return org.caisse.solde_actuel;
    }
    // 2. Statistiques summary
    if (org.statistiques?.solde_caisse != null && org.statistiques.solde_caisse !== 0) {
      return org.statistiques.solde_caisse;
    }
    // 3. Calculer depuis la liste des opérations
    const ops = org.caisse?.operations ?? [];
    if (ops.length > 0) {
      return ops.reduce((acc: number, op: any) => {
        const montant = Number(op.montant ?? 0);
        const type = op.type_operation || op.type || '';
        return type === 'entree' ? acc + montant : acc - montant;
      }, 0);
    }
    return 0;
  });


  protected readonly users = signal<OrganisationUser[]>([]);
  protected readonly profils = signal<OrganisationProfil[]>([]);
  protected readonly loadingUsers = signal<boolean>(false);
  protected readonly errorUsers = signal<boolean>(false);
  protected readonly errorUsersMessage = signal<string>('');

  // Modales
  protected readonly isResponsableModalOpen = signal<boolean>(false);
  protected readonly isUserModalOpen = signal<boolean>(false);
  protected readonly isEditModalOpen = signal<boolean>(false);
  protected readonly selectedUserToEdit = signal<OrganisationUser | null>(null);

  // Toggle statut
  protected readonly isConfirmToggleOpen = signal<boolean>(false);
  protected readonly userToToggle = signal<OrganisationUser | null>(null);
  protected readonly loadingToggle = signal<boolean>(false);

  public setTab(
    tab:
      | 'informations'
      | 'responsable'
      | 'utilisateurs'
      | 'membres'
      | 'activites'
      | 'pelerinages'
      | 'caisse'
      | 'statistiques'
      | 'abonnement'
  ): void {
    this.activeTab.set(tab);
  }

  public getTabCount(module: 'membres' | 'activites' | 'pelerinages' | 'utilisateurs'): number {
    const org = this.organisation();
    if (!org) return 0;
    if (module === 'utilisateurs') {
      return this.users().length > 0
        ? this.users().length
        : (org.statistiques?.total_utilisateurs ?? org.utilisateurs?.length ?? org.users_count ?? 0);
    }
    if (module === 'membres') {
      return org.statistiques?.total_membres ?? org.membres?.length ?? org.membres_count ?? 0;
    }
    if (module === 'activites') {
      return org.statistiques?.total_activites ?? org.activites?.length ?? org.activites_count ?? 0;
    }
    if (module === 'pelerinages') {
      return org.statistiques?.total_pelerinages ?? org.pelerinages?.length ?? 0;
    }
    return 0;
  }


  protected readonly pageSubtitle = computed<string>(() => {
    const org = this.organisation();
    if (!org) return '';
    const paroisse = org.paroisse?.nom_paroisse || org.paroisse?.nom || 'Paroisse';
    return `Espace ${org.type_organisation} · Paroisse : ${paroisse}`;
  });

  protected readonly toggleConfirmMessage = computed<string>(() => {
    const u = this.userToToggle();
    if (!u) return '';
    return u.statut === 'actif'
      ? `Voulez-vous vraiment désactiver le compte de ${u.name} ? L'accès à la plateforme sera immédiatement suspendu.`
      : `Voulez-vous réactiver le compte de ${u.name} ?`;
  });

  protected readonly userColumns: TableColumn<OrganisationUser>[] = [
    {
      key: 'name',
      label: 'Nom & Prénoms',
      sortable: true,
      width: '200px',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '220px',
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      width: '140px',
      formatter: (v) => v || '-',
    },
    {
      key: 'profil',
      label: 'Profil',
      width: '160px',
      formatter: (_, row) => row.profil?.libelle || row.profil?.code || '-',
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      width: '100px',
      formatter: (v) => (v === 'actif' ? 'Actif' : 'Inactif'),
    },
    {
      key: 'created_at',
      label: 'Date création',
      width: '120px',
      formatter: (v) => {
        if (!v) return '-';
        const d = new Date(v);
        return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
      },
    },
  ];

  public ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorOrg.set(true);
      this.errorOrgMessage.set('Identifiant organisation manquant dans l’URL.');
      this.loadingOrg.set(false);
      return;
    }

    this.loadingOrg.set(true);
    this.errorOrg.set(false);

    this.orgService.getOrganisation(id).subscribe({
      next: (org) => {
        this.organisation.set(org);
        this.loadingOrg.set(false);
        this.loadUsers();
        this.loadProfils();
      },
      error: (err) => {
        this.loadingOrg.set(false);
        this.errorOrg.set(true);
        if (err.status === 404) {
          this.errorOrgMessage.set('L’organisation demandée n’existe pas ou a été retirée.');
        } else if (err.status === 403) {
          this.errorOrgMessage.set('Accès non autorisé à cette organisation.');
        } else {
          this.errorOrgMessage.set(err.error?.message || 'Erreur lors du chargement de l’organisation.');
        }
      },
    });
  }

  public loadUsers(): void {
    const org = this.organisation();
    if (!org) return;

    this.loadingUsers.set(true);
    this.errorUsers.set(false);

    this.userService.getUsers(org.id).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        this.loadingUsers.set(false);
        // Si l'organisation n'a pas encore de session/contexte valide, afficher état vide proprement
        if (err.status === 404 || err.status === 403) {
          this.users.set([]);
        } else {
          this.errorUsers.set(true);
          this.errorUsersMessage.set('Impossible de charger les utilisateurs de cet espace.');
        }
      },
    });
  }

  public loadProfils(): void {
    const org = this.organisation();
    if (!org) return;

    this.userService.getProfils(org.id).subscribe({
      next: (list) => this.profils.set(list),
      error: () => this.profils.set([]),
    });
  }

  public openEditModal(): void {
    this.isEditModalOpen.set(true);
  }

  public openResponsableModal(): void {
    this.isResponsableModalOpen.set(true);
  }

  public openCreateUserModal(): void {
    this.selectedUserToEdit.set(null);
    this.isUserModalOpen.set(true);
  }

  public openEditUserModal(user: OrganisationUser): void {
    this.selectedUserToEdit.set(user);
    this.isUserModalOpen.set(true);
  }

  public onResponsableCreated(): void {
    this.toast.show('success', 'Mise à jour', 'Premier responsable assigné.');
    this.loadData();
  }

  public onOrgUpdated(): void {
    this.loadData();
  }

  public onUserSaved(): void {
    this.loadUsers();
  }

  public promptToggleStatus(user: OrganisationUser): void {
    this.userToToggle.set(user);
    this.isConfirmToggleOpen.set(true);
  }

  public confirmToggleStatus(): void {
    const user = this.userToToggle();
    const org = this.organisation();
    if (!user || !org) return;

    this.loadingToggle.set(true);
    this.userService.toggleStatus(org.id, user.id).subscribe({
      next: () => {
        this.loadingToggle.set(false);
        this.isConfirmToggleOpen.set(false);
        this.toast.show(
          'success',
          'Statut modifié',
          `Le statut de ${user.name} a été mis à jour avec succès.`
        );
        this.loadUsers();
      },
      error: (err) => {
        this.loadingToggle.set(false);
        this.isConfirmToggleOpen.set(false);
        this.toast.show('error', 'Échec', err.error?.message || 'Impossible de changer le statut.');
      },
    });
  }
}
