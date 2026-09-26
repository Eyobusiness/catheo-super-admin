import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { LoadingStateComponent } from '../../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ParoisseService } from '../../services/paroisse.service';
import { ParoisseDetail } from '../../models/paroisse.model';
import { ParoisseStatusBadgeComponent } from '../../components/paroisse-status-badge/paroisse-status-badge.component';
import { SuperAdminOrganisationService } from '../../../organisations/services/super-admin-organisation.service';
import { OrganisationEditModalComponent } from '../../../organisations/components/organisation-edit-modal/organisation-edit-modal.component';
import { ToastService } from '../../../../../core/services/toast.service';
import { ParoisseUserModalComponent } from '../../components/paroisse-user-modal/paroisse-user-modal.component';
import { ParoisseUserDetailModalComponent } from '../../components/paroisse-user-detail-modal/paroisse-user-detail-modal.component';
import { ParoisseUser, SystemProfil } from '../../models/paroisse-user.model';

@Component({
  selector: 'app-paroisse-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ModalComponent,
    ParoisseStatusBadgeComponent,
    OrganisationEditModalComponent,
    ParoisseUserModalComponent,
    ParoisseUserDetailModalComponent,
  ],

  template: `
    <div class="page-container">
      @if (loading()) {
        <app-loading-state message="Chargement des informations de la paroisse..." />
      } @else if (hasError()) {
        <app-error-state
          title="Fiche paroisse introuvable"
          [message]="errorMessage()"
          (retry)="loadData()"
        />
      } @else if (paroisse(); as p) {
        <app-page-header
          [title]="p.nom_paroisse"
          [subtitle]="'Code : ' + (p.code_paroisse || '-') + ' • ' + (p.ville || '-') + ' (' + (p.diocese || '-') + ')'"
          [breadcrumbs]="[
            { label: 'Super Admin', path: '/super-admin' },
            { label: 'Paroisses', path: '/super-admin/paroisses' },
            { label: p.nom_paroisse }
          ]"
        >
          <div page-actions class="header-actions">
            <app-paroisse-status-badge [statut]="p.statut" size="md" />

            <app-btn
              [variant]="'secondary'"
              [size]="'md'"
              (btnClick)="goBack()"
            >
              <i class="bi bi-arrow-left"></i>
              <span>Retour</span>
            </app-btn>

            <app-btn
              [variant]="'primary'"
              [size]="'md'"
              (btnClick)="goToEdit(p.id)"
            >
              <i class="bi bi-pencil"></i>
              <span>Modifier</span>
            </app-btn>
          </div>
        </app-page-header>

        <div class="detail-grid">
          <!-- Col Gauche : Identité & Localisation -->
          <div class="detail-col">
            <app-card title="Identité & Localisation" class="card-item">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Nom officiel</span>
                  <span class="info-val font-semibold">{{ p.nom_paroisse }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Code Paroisse</span>
                  <span class="info-val badge-code">{{ p.code_paroisse || 'Non renseigné' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Statut</span>
                  <span class="info-val"><app-paroisse-status-badge [statut]="p.statut" /></span>
                </div>
                <div class="info-item">
                  <span class="info-label">Diocèse</span>
                  <span class="info-val">{{ p.diocese || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Doyenné</span>
                  <span class="info-val">{{ p.doyenne || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Ville & Commune</span>
                  <span class="info-val">{{ p.ville || '-' }} {{ p.commune ? '• ' + p.commune : '' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Adresse physique</span>
                  <span class="info-val">{{ p.adresse || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date d'enregistrement</span>
                  <span class="info-val">{{ p.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </app-card>

            <!-- Card Logos -->
            <app-card title="Logos Officiels" class="card-item">
              <div class="logos-display">
                <div class="logo-display-item">
                  <span class="logo-title">Logo Paroisse</span>
                  @if (p.logo_paroisse_url) {
                    <img [src]="p.logo_paroisse_url" alt="Logo Paroisse" class="logo-img" />
                  } @else {
                    <div class="empty-logo"><i class="bi bi-image"></i><span>Aucun logo</span></div>
                  }
                </div>

                <div class="logo-display-item">
                  <span class="logo-title">Logo Catéchèse</span>
                  @if (p.logo_catechese_url) {
                    <img [src]="p.logo_catechese_url" alt="Logo Catéchèse" class="logo-img" />
                  } @else {
                    <div class="empty-logo"><i class="bi bi-image"></i><span>Aucun logo</span></div>
                  }
                </div>
              </div>
            </app-card>
          </div>

          <!-- Col Droite : Contact, Paramètres & Abonnements -->
          <div class="detail-col">
            <!-- Coordonnées -->
            <app-card title="Coordonnées de Contact" class="card-item">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Téléphone</span>
                  <span class="info-val">
                    @if (p.telephone) {
                      <a [href]="'tel:' + p.telephone" class="link-contact"><i class="bi bi-telephone"></i> {{ p.telephone }}</a>
                    } @else {
                      -
                    }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Adresse Email</span>
                  <span class="info-val">
                    @if (p.email) {
                      <a [href]="'mailto:' + p.email" class="link-contact"><i class="bi bi-envelope"></i> {{ p.email }}</a>
                    } @else {
                      -
                    }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Site Internet</span>
                  <span class="info-val">
                    @if (p.site_web) {
                      <a [href]="p.site_web" target="_blank" rel="noopener noreferrer" class="link-contact"><i class="bi bi-globe"></i> {{ p.site_web }}</a>
                    } @else {
                      -
                    }
                  </span>
                </div>
              </div>
            </app-card>

            <!-- Configuration Pastorale -->
            <app-card title="Configuration Pastorale & Codes CATHEO" class="card-item">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Préfixe Matricule</span>
                  <span class="info-val mono-badge">{{ p.prefixe_matricule || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Préfixe Reçu</span>
                  <span class="info-val mono-badge">{{ p.prefixe_recu || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Curé de la Paroisse</span>
                  <span class="info-val">{{ p.cure_nom || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Coordination</span>
                  <span class="info-val">{{ p.coordination_nom || '-' }}</span>
                </div>
              </div>
            </app-card>

            <!-- Abonnements SaaS -->
            <app-card title="Abonnements & Modules Souscrits" class="card-item">
              @if (p.produits_souscrits && p.produits_souscrits.length > 0) {
                <div class="abonnements-list">
                  @for (prod of p.produits_souscrits; track getProduitCode(prod)) {
                    <div class="abo-card">
                      <div class="abo-icon">
                        <i class="bi bi-layers-fill"></i>
                      </div>
                      <div class="abo-details">
                        <span class="abo-name">{{ getProduitNom(prod) }}</span>
                        <span class="abo-sub">{{ getProduitSub(prod) }}</span>
                      </div>
                      <span class="abo-status-tag">Actif</span>
                    </div>
                  }
                </div>
              } @else {
                <app-empty-state
                  title="Aucun abonnement actif"
                  message="Cette paroisse n'a aucun abonnement actif enregistré à ce jour."
                  icon="bi bi-box-seam"
                />
              }
            </app-card>
          </div>

          <!-- Section Organisations Rattachées & Produits Activés (Full Width) -->
          <div class="detail-full-col">
            <app-card
              title="Organisations Rattachées & Espaces Métier"
              subtitle="Espaces pastoraux OPPE, OPPJ et OPPA rattachés à cette paroisse"
              class="card-item"
            >
              <div card-actions class="d-flex align-items-center gap-2">
                <app-btn
                  variant="primary"
                  size="sm"
                  (btnClick)="openAddOrgModal()"
                >
                  <i class="bi bi-plus-lg me-1"></i>
                  <span>Ajouter une organisation</span>
                </app-btn>
              </div>

              <!-- Produits Activés Status Row -->
              <div class="produits-status-row">
                <div class="produit-pill" [class.is-active]="isProduitActive('OPPE')" title="Office Paroissial de la Pastorale des Enfants">
                  <i [class]="isProduitActive('OPPE') ? 'bi bi-check-circle-fill text-success' : 'bi bi-dash-circle text-muted'"></i>
                  <span class="pill-title">OPPE · Office Paroissial de la Pastorale des Enfants</span>
                  <span class="pill-badge">{{ isProduitActive('OPPE') ? 'Activé' : 'Non activé' }}</span>
                </div>
                <div class="produit-pill" [class.is-active]="isProduitActive('OPPJ')" title="Office Paroissial de la Pastorale des Jeunes">
                  <i [class]="isProduitActive('OPPJ') ? 'bi bi-check-circle-fill text-success' : 'bi bi-dash-circle text-muted'"></i>
                  <span class="pill-title">OPPJ · Office Paroissial de la Pastorale des Jeunes</span>
                  <span class="pill-badge">{{ isProduitActive('OPPJ') ? 'Activé' : 'Non activé' }}</span>
                </div>
                <div class="produit-pill" [class.is-active]="isProduitActive('OPPA')" title="Office Paroissial de la Pastorale des Adultes">
                  <i [class]="isProduitActive('OPPA') ? 'bi bi-check-circle-fill text-success' : 'bi bi-dash-circle text-muted'"></i>
                  <span class="pill-title">OPPA · Office Paroissial de la Pastorale des Adultes</span>
                  <span class="pill-badge">{{ isProduitActive('OPPA') ? 'Activé' : 'Non activé' }}</span>
                </div>
              </div>

              <!-- Tableau des Organisations -->
              @if (attachedOrganisations().length > 0) {
                <div class="orgs-table-container">
                  <table class="custom-org-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Nom de l'organisation</th>
                        <th>Responsable</th>
                        <th>Statut</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (org of attachedOrganisations(); track (org.uuid || org.id)) {
                        <tr>
                          <td>
                            <span [class]="'badge-prod ' + (org.produit_code || org.type_organisation || 'OPPE').toLowerCase()">
                              {{ org.produit_code || org.type_organisation }}
                            </span>
                          </td>
                          <td class="font-medium">
                            {{ org.nom }}
                          </td>
                          <td>
                            <div class="d-flex flex-column">
                              <span class="font-medium">{{ org.responsable_nom || org.responsable?.nom || 'Non assigné' }}</span>
                              @if (org.responsable_telephone || org.responsable?.telephone) {
                                <span class="text-xs text-muted">{{ org.responsable_telephone || org.responsable?.telephone }}</span>
                              }
                            </div>
                          </td>
                          <td>
                            <span [class]="'badge-statut ' + org.statut">
                              {{ org.statut === 'actif' ? 'Actif' : org.statut === 'suspendu' ? 'Suspendu' : 'Inactif' }}
                            </span>
                          </td>
                          <td class="text-right">
                            <div class="row-actions">
                              <app-btn
                                variant="outline"
                                size="sm"
                                (btnClick)="navigateToOrg(org.uuid || org.id)"
                                title="Voir la fiche détaillée"
                              >
                                <i class="bi bi-eye me-1"></i>
                                <span>Détail</span>
                              </app-btn>

                              <app-btn
                                variant="ghost"
                                size="sm"
                                (btnClick)="openEditOrg(org)"
                                title="Modifier les informations"
                              >
                                <i class="bi bi-pencil"></i>
                              </app-btn>

                              <app-btn
                                [variant]="org.statut === 'actif' ? 'outline' : 'ghost'"
                                size="sm"
                                (btnClick)="toggleOrgStatus(org)"
                                [title]="org.statut === 'actif' ? 'Suspendre' : 'Activer'"
                              >
                                <i [class]="org.statut === 'actif' ? 'bi bi-pause-circle text-danger' : 'bi bi-play-circle text-success'"></i>
                              </app-btn>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <app-empty-state
                  title="Aucune organisation rattachée"
                  message="Cliquez sur 'Ajouter une organisation' pour activer les espaces OPPE, OPPJ ou OPPA pour cette paroisse."
                  icon="bi bi-diagram-3"
                />
              }
            </app-card>
          </div>

          <!-- Section Utilisateurs & Administrateurs (Full Width) -->
          <div class="detail-full-col">
            <app-card
              title="Utilisateurs & Administrateurs de la paroisse"
              subtitle="Gestion des comptes utilisateurs et du premier administrateur paroissial"
              class="card-item"
            >
              <div card-actions class="d-flex align-items-center gap-2">
                <app-btn
                  variant="primary"
                  size="sm"
                  (btnClick)="openCreateUserModal()"
                >
                  <i class="bi bi-person-plus-fill me-1"></i>
                  <span>Ajouter un utilisateur</span>
                </app-btn>
              </div>

              @if (loadingUsers()) {
                <app-loading-state message="Chargement des utilisateurs de la paroisse..." />
              } @else if (paroisseUsers().length > 0) {
                <div class="orgs-table-container">
                  <table class="custom-org-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email & Téléphone</th>
                        <th>Profil Système</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Dernière connexion</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (u of paroisseUsers(); track (u.uuid || u.id)) {
                        <tr>
                          <td>
                            <div class="user-cell">
                              <span class="font-medium text-dark">{{ u.name }}</span>
                              <span class="user-sub-id mono">&#64;{{ u.username }}</span>
                            </div>
                          </td>
                          <td>
                            <div class="user-cell">
                              <span>{{ u.email }}</span>
                              @if (u.telephone) {
                                <span class="text-muted text-xs"><i class="bi bi-telephone me-1"></i>{{ u.telephone }}</span>
                              }
                            </div>
                          </td>
                          <td>
                            <span class="badge-role">
                              {{ u.profil?.nom || 'Profil ' + u.profil_id }}
                            </span>
                          </td>
                          <td>
                            <span class="badge-type">{{ u.user_type }}</span>
                          </td>
                          <td>
                            <span [class]="'badge-statut ' + u.statut">
                              {{ u.statut === 'actif' ? 'Actif' : u.statut === 'suspendu' ? 'Suspendu' : 'Inactif' }}
                            </span>
                          </td>
                          <td class="text-muted text-sm">
                            {{ (u.dernier_login_at | date: 'dd/MM/yyyy HH:mm') || 'Jamais connecté' }}
                          </td>
                          <td class="text-right">
                            <div class="row-actions">
                              <app-btn
                                variant="outline"
                                size="sm"
                                (btnClick)="openViewUserDetail(u)"
                                title="Voir la fiche complète & traçabilité"
                              >
                                <i class="bi bi-eye me-1"></i>
                                <span>Détails</span>
                              </app-btn>

                              <app-btn
                                variant="ghost"
                                size="sm"
                                (btnClick)="openEditUserModal(u)"
                                title="Modifier l’utilisateur"
                              >
                                <i class="bi bi-pencil"></i>
                              </app-btn>

                              <app-btn
                                variant="ghost"
                                size="sm"
                                (btnClick)="confirmDeleteUser(u)"
                                title="Supprimer l’utilisateur"
                              >
                                <i class="bi bi-trash text-danger"></i>
                              </app-btn>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <app-empty-state
                  title="Aucun utilisateur configuré pour cette paroisse"
                  description="Créez le premier utilisateur administrateur pour permettre à la paroisse d'accéder à son espace."
                  icon="bi bi-people"
                >
                  <app-btn
                    variant="primary"
                    size="md"
                    (btnClick)="openCreateUserModal()"
                  >
                    <i class="bi bi-person-plus-fill me-1"></i>
                    <span>Créer le premier administrateur</span>
                  </app-btn>
                </app-empty-state>
              }
            </app-card>
          </div>
        </div>

        <!-- Modale Ajout d'organisation (Mode Batch Multi-Select) -->
        <app-modal
          [isOpen]="isAddOrgModalOpen()"
          title="Ajouter des organisations paroissiales"
          size="md"
          (close)="isAddOrgModalOpen.set(false)"
        >
          <div class="batch-intro">
            <p class="text-muted">
              Sélectionnez les espaces pastoraux à activer pour <strong>{{ p.nom_paroisse }}</strong>.
              Les organisations existantes seront préservées sans doublon.
            </p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-card" [class.is-checked]="selectedProducts().includes('OPPE')">
              <input
                type="checkbox"
                [checked]="selectedProducts().includes('OPPE')"
                (change)="toggleProductSelection('OPPE')"
              />
              <div class="checkbox-content">
                <span class="checkbox-title">OPPE · Office Paroissial de la Pastorale des Enfants</span>
                <span class="checkbox-desc">Catéchèse, enfants du primaire et persévérance</span>
              </div>
            </label>

            <label class="checkbox-card" [class.is-checked]="selectedProducts().includes('OPPJ')">
              <input
                type="checkbox"
                [checked]="selectedProducts().includes('OPPJ')"
                (change)="toggleProductSelection('OPPJ')"
              />
              <div class="checkbox-content">
                <span class="checkbox-title">OPPJ · Office Paroissial de la Pastorale des Jeunes</span>
                <span class="checkbox-desc">Pastorale des jeunes, mouvements et groupes de jeunes</span>
              </div>
            </label>

            <label class="checkbox-card" [class.is-checked]="selectedProducts().includes('OPPA')">
              <input
                type="checkbox"
                [checked]="selectedProducts().includes('OPPA')"
                (change)="toggleProductSelection('OPPA')"
              />
              <div class="checkbox-content">
                <span class="checkbox-title">OPPA · Office Paroissial de la Pastorale des Adultes</span>
                <span class="checkbox-desc">Associations et fraternités chrétiennes d'adultes</span>
              </div>
            </label>
          </div>

          <div modal-footer class="d-flex justify-content-end gap-2">
            <app-btn
              variant="secondary"
              [disabled]="loadingBatch()"
              (btnClick)="isAddOrgModalOpen.set(false)"
            >
              Annuler
            </app-btn>

            <app-btn
              variant="primary"
              [loading]="loadingBatch()"
              [disabled]="loadingBatch() || selectedProducts().length === 0"
              (btnClick)="submitBatchCreation()"
            >
              <i class="bi bi-check-lg me-1"></i>
              <span>Activer ({{ selectedProducts().length }})</span>
            </app-btn>
          </div>
        </app-modal>

        <!-- Modale Modification Organisation -->
        @if (selectedOrgForEdit()) {
          <app-organisation-edit-modal
            [isOpen]="isEditOrgModalOpen()"
            [organisation]="selectedOrgForEdit()!"
            (close)="isEditOrgModalOpen.set(false)"
            (organisationUpdated)="onOrgUpdatedFromModal()"
          />
        }

        <!-- Modale Ajout / Modification Utilisateur Paroissial -->
        <app-paroisse-user-modal
          [isOpen]="isUserModalOpen()"
          [paroisseId]="p.id"
          [paroisseNom]="p.nom_paroisse"
          [user]="selectedUserForEdit()"
          [systemProfils]="systemProfils()"
          (close)="isUserModalOpen.set(false)"
          (userSaved)="onUserSaved()"
        />

        <!-- Modale Consultation Détails Utilisateur (Champs complets) -->
        <app-paroisse-user-detail-modal
          [isOpen]="isUserDetailModalOpen()"
          [user]="selectedUserForDetail()"
          (close)="isUserDetailModalOpen.set(false)"
        />

        <!-- Modale de Confirmation de Suppression Utilisateur -->
        <app-modal
          [isOpen]="isDeleteUserModalOpen()"
          title="Confirmer la suppression"
          size="sm"
          (close)="isDeleteUserModalOpen.set(false)"
        >
          <div class="delete-confirm-content">
            <div class="delete-icon-wrap">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <p>
              Êtes-vous sûr de vouloir supprimer l'utilisateur
              <strong>{{ userToDelete()?.name }}</strong> (&#64;{{ userToDelete()?.username }}) ?
            </p>
            <p class="text-muted text-sm">
              Cette action effectue une suppression logique (soft-delete). Le compte pourra être restauré ultérieurement depuis la corbeille.
            </p>
          </div>

          <div modal-footer class="d-flex justify-content-end gap-2">
            <app-btn
              variant="secondary"
              [disabled]="loadingDeleteUser()"
              (btnClick)="isDeleteUserModalOpen.set(false)"
            >
              Annuler
            </app-btn>

            <app-btn
              variant="danger"
              [loading]="loadingDeleteUser()"
              [disabled]="loadingDeleteUser()"
              (btnClick)="executeDeleteUser()"
            >
              <i class="bi bi-trash me-1"></i>
              <span>Supprimer le compte</span>
            </app-btn>
          </div>
        </app-modal>
      }
    </div>

  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .detail-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    @media (max-width: 992px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      font-size: 0.875rem;
    }
    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .info-label {
      color: var(--text-muted, #64748b);
      font-weight: 500;
    }
    .info-val {
      color: var(--text-primary, #0f172a);
      text-align: right;
    }
    .badge-code, .mono-badge {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      background-color: var(--neutral-100, #f1f5f9);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
    }
    .link-contact {
      color: var(--primary-600, #0284c7);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .link-contact:hover {
      text-decoration: underline;
    }
    /* Logos Display */
    .logos-display {
      display: flex;
      justify-content: space-around;
      gap: 1rem;
      padding: 0.5rem 0;
    }
    .logo-display-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .logo-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
    }
    .logo-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--border-color, #e2e8f0);
      padding: 0.25rem;
      background-color: #ffffff;
    }
    .empty-logo {
      width: 90px;
      height: 90px;
      border-radius: var(--radius-md, 10px);
      border: 1px dashed var(--border-color, #e2e8f0);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--neutral-400, #94a3b8);
      font-size: 0.75rem;
      gap: 0.25rem;
    }
    .empty-logo i {
      font-size: 1.5rem;
    }
    /* Abonnements */
    .abonnements-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .abo-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background-color: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }
    .abo-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm, 6px);
      background-color: var(--primary-100, #e0f2fe);
      color: var(--primary-700, #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .abo-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .abo-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
    }
    .abo-sub {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .abo-status-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--success-50, #ecfdf5);
      color: var(--success-700, #047857);
      border: 1px solid var(--success-200, #a7f3d0);
    }
    /* Section Pleine Largeur Organisations */
    .detail-full-col {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .produits-status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding: 1rem;
      background-color: var(--bg-muted, #f8fafc);
      border-radius: var(--radius-md, 10px);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .produit-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background-color: #ffffff;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
    }
    .produit-pill.is-active {
      border-color: #86efac;
      background-color: #f0fdf4;
    }
    .pill-title {
      font-weight: 600;
      color: var(--text-primary, #1e293b);
    }
    .pill-badge {
      font-size: 0.75rem;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm, 4px);
      background-color: var(--neutral-100, #f1f5f9);
      color: var(--text-muted, #64748b);
    }
    .produit-pill.is-active .pill-badge {
      background-color: #bbf7d0;
      color: #166534;
      font-weight: 600;
    }
    .orgs-table-container {
      overflow-x: auto;
    }
    .custom-org-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .custom-org-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background-color: var(--bg-muted, #f8fafc);
      color: var(--text-muted, #64748b);
      font-weight: 600;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .custom-org-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border-color-light, #f1f5f9);
      color: var(--text-primary, #1e293b);
    }
    .badge-prod {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.025em;
    }
    .badge-prod.oppe {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-prod.oppj {
      background-color: #fef3c7;
      color: #92400e;
    }
    .badge-prod.oppa {
      background-color: #f3e8ff;
      color: #6b21a8;
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
    .badge-statut.suspendu {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .badge-statut.inactif {
      background-color: #f1f5f9;
      color: #64748b;
    }
    .row-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.375rem;
    }
    .text-right {
      text-align: right;
    }
    .batch-intro {
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
    }
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .checkbox-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .checkbox-card.is-checked {
      border-color: var(--color-primary-500, #3b82f6);
      background-color: #eff6ff;
    }
    .checkbox-card input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 1.1rem;
      height: 1.1rem;
      cursor: pointer;
    }
    .checkbox-content {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .checkbox-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary, #1e293b);
    }
    .checkbox-desc {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .user-sub-id {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .badge-role {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #e0e7ff;
      color: #3730a3;
    }
    .badge-type {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #f3e8ff;
      color: #7e22ce;
    }
    .text-sm {
      font-size: 0.8125rem;
    }
    .text-xs {
      font-size: 0.75rem;
    }
    .mono {
      font-family: monospace;
    }
    .delete-confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem 0;
      gap: 0.75rem;
    }
    .delete-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParoisseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paroisseService = inject(ParoisseService);
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly toast = inject(ToastService);

  protected readonly paroisse = signal<ParoisseDetail | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Modale Batch Organisations
  protected readonly isAddOrgModalOpen = signal<boolean>(false);
  protected readonly selectedProducts = signal<string[]>(['OPPE', 'OPPJ', 'OPPA']);
  protected readonly loadingBatch = signal<boolean>(false);

  // Modale Edit Organisation
  protected readonly isEditOrgModalOpen = signal<boolean>(false);
  protected readonly selectedOrgForEdit = signal<any | null>(null);

  // Utilisateurs de la paroisse
  protected readonly paroisseUsers = signal<ParoisseUser[]>([]);
  protected readonly loadingUsers = signal<boolean>(false);
  protected readonly systemProfils = signal<SystemProfil[]>([]);

  // Modales Utilisateur
  protected readonly isUserModalOpen = signal<boolean>(false);
  protected readonly selectedUserForEdit = signal<ParoisseUser | null>(null);
  protected readonly isUserDetailModalOpen = signal<boolean>(false);
  protected readonly selectedUserForDetail = signal<ParoisseUser | null>(null);

  // Modale Suppression Utilisateur
  protected readonly isDeleteUserModalOpen = signal<boolean>(false);
  protected readonly userToDelete = signal<ParoisseUser | null>(null);
  protected readonly loadingDeleteUser = signal<boolean>(false);

  protected readonly attachedOrganisations = computed<any[]>(() => {
    return this.paroisse()?.organisations || [];
  });

  public ngOnInit(): void {
    this.loadData();
    this.loadSystemProfils();
  }

  public loadData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.hasError.set(true);
      this.errorMessage.set('Identifiant de paroisse manquant.');
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);

    this.paroisseService.getParoisseDetail(id).subscribe({
      next: (data) => {
        this.paroisse.set(data);
        this.loading.set(false);
        this.loadParoisseUsers(id);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Impossible de récupérer les détails de la paroisse.'
        );
        this.loading.set(false);
      },
    });
  }

  public loadParoisseUsers(paroisseId: string): void {
    this.loadingUsers.set(true);
    this.paroisseService.getParoisseUsers(paroisseId).subscribe({
      next: (users) => {
        this.paroisseUsers.set(users);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
      },
    });
  }

  public loadSystemProfils(): void {
    this.paroisseService.getSystemProfils().subscribe({
      next: (profils) => {
        this.systemProfils.set(profils);
      },
      error: () => {},
    });
  }

  protected openCreateUserModal(): void {
    this.selectedUserForEdit.set(null);
    this.isUserModalOpen.set(true);
  }

  protected openEditUserModal(user: ParoisseUser): void {
    this.selectedUserForEdit.set(user);
    this.isUserModalOpen.set(true);
  }

  protected openViewUserDetail(user: ParoisseUser): void {
    this.selectedUserForDetail.set(user);
    this.isUserDetailModalOpen.set(true);
  }

  protected onUserSaved(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadParoisseUsers(id);
    }
  }

  protected confirmDeleteUser(user: ParoisseUser): void {
    this.userToDelete.set(user);
    this.isDeleteUserModalOpen.set(true);
  }

  protected executeDeleteUser(): void {
    const u = this.userToDelete();
    const p = this.paroisse();
    if (!u || !p) return;

    const paroisseId = p.id;
    const userId = u.uuid || u.id;

    this.loadingDeleteUser.set(true);
    this.paroisseService.deleteParoisseUser(paroisseId, userId).subscribe({
      next: () => {
        this.loadingDeleteUser.set(false);
        this.isDeleteUserModalOpen.set(false);
        this.toast.show(
          'success',
          'Utilisateur supprimé',
          `Le compte de ${u.name} a été supprimé (placé dans la corbeille).`
        );
        this.loadParoisseUsers(String(paroisseId));
      },
      error: (err) => {
        this.loadingDeleteUser.set(false);
        this.toast.show(
          'error',
          'Erreur',
          err?.error?.message || 'Impossible de supprimer cet utilisateur.'
        );
      },
    });
  }

  protected isProduitActive(code: string): boolean {
    const p = this.paroisse();
    if (!p) return false;
    const orgs = p.organisations || [];
    const hasOrg = orgs.some((o: any) => (o.produit_code || o.type_organisation) === code && o.statut === 'actif');
    if (hasOrg) return true;
    const prods = p.produits_souscrits || [];
    return prods.some((item: any) => {
      const c = typeof item === 'string' ? item : item.produit_code;
      return c === code;
    });
  }

  protected getProduitCode(prod: any): string {
    return typeof prod === 'string' ? prod : (prod.produit_code || String(prod));
  }

  protected getProduitNom(prod: any): string {
    if (typeof prod === 'string') return prod;
    return prod.produit_nom || prod.produit_code || 'Module Catheo';
  }

  protected getProduitSub(prod: any): string {
    if (typeof prod === 'string') return 'Souscription active';
    return `${prod.formule_nom || 'Souscription active'} • Fin: ${prod.date_fin || 'Indéterminée'}`;
  }

  protected openAddOrgModal(): void {
    this.selectedProducts.set(['OPPE', 'OPPJ', 'OPPA']);
    this.isAddOrgModalOpen.set(true);
  }

  protected toggleProductSelection(code: string): void {
    const current = this.selectedProducts();
    if (current.includes(code)) {
      this.selectedProducts.set(current.filter((c) => c !== code));
    } else {
      this.selectedProducts.set([...current, code]);
    }
  }

  protected submitBatchCreation(): void {
    const p = this.paroisse();
    if (!p || this.selectedProducts().length === 0) return;

    this.loadingBatch.set(true);
    const paroisseId = p.id;

    this.paroisseService.activateProduits(String(paroisseId), this.selectedProducts()).subscribe({
      next: (res) => {
        this.loadingBatch.set(false);
        this.isAddOrgModalOpen.set(false);
        this.toast.show(
          'success',
          'Organisations activées',
          res?.message || 'Les espaces pastoraux ont été configurés sans doublon.'
        );
        this.loadData();
      },
      error: (err) => {
        this.loadingBatch.set(false);
        this.toast.show(
          'error',
          'Erreur d’activation',
          err.error?.message || 'Impossible d’activer les organisations.'
        );
      },
    });
  }

  protected navigateToOrg(orgId: string | number): void {
    this.router.navigate(['/super-admin/organisations', orgId]);
  }

  protected openEditOrg(org: any): void {
    this.selectedOrgForEdit.set(org);
    this.isEditOrgModalOpen.set(true);
  }

  protected onOrgUpdatedFromModal(): void {
    this.loadData();
  }

  protected toggleOrgStatus(org: any): void {
    const newStatus = org.statut === 'actif' ? 'suspendu' : 'actif';
    const orgId = org.uuid || org.id;

    this.orgService.changeStatus(orgId, newStatus).subscribe({
      next: () => {
        this.toast.show(
          'success',
          'Statut modifié',
          `L'organisation ${org.nom} est désormais ${newStatus === 'actif' ? 'active' : 'suspendue'}.`
        );
        this.loadData();
      },
      error: (err) => {
        this.toast.show(
          'error',
          'Erreur',
          err.error?.message || 'Impossible de modifier le statut.'
        );
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/super-admin/paroisses']);
  }

  protected goToEdit(id: string | number): void {
    this.router.navigate(['/super-admin/paroisses', id, 'modifier']);
  }
}

