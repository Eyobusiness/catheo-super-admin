import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent, PaginationState } from '../../../../shared/models/pagination.model';
import { ToastService } from '../../../../core/services/toast.service';
import { UtilisateurService } from '../services/utilisateur.service';
import { ParoisseService } from '../../paroisses/services/paroisse.service';
import { SuperAdminOrganisationService } from '../../organisations/services/super-admin-organisation.service';
import { Utilisateur, UtilisateurFilters } from '../models/utilisateur.model';
import { Paroisse } from '../../paroisses/models/paroisse.model';
import { SuperAdminOrganisation } from '../../organisations/models/super-admin-organisation.model';

@Component({
  selector: 'app-utilisateurs-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    TableComponent,
    ButtonComponent,
    FilterBarComponent,
    PaginationComponent,
    ModalComponent,
    ConfirmDialogComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Gestion des Utilisateurs"
        subtitle="Supervision globale des accès, administrateurs diocésains, paroissiaux et responsables pastoraux"
        [breadcrumbs]="[
          { label: 'Super Admin', path: '/super-admin' },
          { label: 'Utilisateurs' }
        ]"
      >
        <div page-actions>
          <app-btn
            [variant]="'outline'"
            [size]="'sm'"
            (btnClick)="refresh()"
            [loading]="loading()"
            title="Rafraîchir la liste"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>Actualiser</span>
          </app-btn>
        </div>
      </app-page-header>

      <!-- Barre de filtres réels -->
      <app-filter-bar
        [searchPlaceholder]="'Rechercher par nom, email...'"
        [hasActiveFilters]="hasActiveFilters()"
        (searchChange)="onSearchChange($event)"
        (resetFilters)="onResetFilters()"
      >
        <div class="filter-controls">
          <!-- Filtre Profil / Rôle -->
          <select
            [value]="filterProfil()"
            (change)="onProfilChange($event)"
            class="filter-select"
            aria-label="Filtrer par profil"
          >
            <option value="">Tous les profils</option>
            <option value="super_admin">Super Administrateur</option>
            <option value="paroisse_admin">Admin Paroisse</option>
            <option value="RESPONSABLE_OPPE">Responsable OPPE</option>
            <option value="RESPONSABLE_OPPJ">Responsable OPPJ</option>
            <option value="RESPONSABLE_OPPA">Responsable OPPA</option>
          </select>

          <!-- Filtre Paroisse -->
          <select
            [value]="filterParoisseId()"
            (change)="onParoisseChange($event)"
            class="filter-select"
            aria-label="Filtrer par paroisse"
          >
            <option value="">Toutes les paroisses</option>
            @for (p of paroissesList(); track p.id) {
              <option [value]="p.id">{{ p.nom_paroisse }} ({{ p.code_paroisse }})</option>
            }
          </select>

          <!-- Filtre Organisation -->
          <select
            [value]="filterOrgId()"
            (change)="onOrgChange($event)"
            class="filter-select"
            aria-label="Filtrer par organisation"
          >
            <option value="">Toutes les organisations</option>
            @for (org of orgsList(); track org.id) {
              <option [value]="org.id">{{ org.nom }} ({{ org.type_organisation }})</option>
            }
          </select>

          <!-- Filtre Statut -->
          <select
            [value]="filterStatut()"
            (change)="onStatutChange($event)"
            class="filter-select"
            aria-label="Filtrer par statut"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="bloque">Bloqué / Suspendu</option>
          </select>
        </div>
      </app-filter-bar>

      <!-- Erreur API -->
      @if (hasError()) {
        <app-error-state
          title="Impossible de charger les utilisateurs"
          [message]="errorMessage()"
          (retry)="refresh()"
        />
      } @else {
        <!-- Tableau des utilisateurs -->
        <app-table
          [columns]="columns"
          [data]="utilisateurs()"
          [loading]="loading()"
          [hasActions]="true"
          [rowActionsTemplate]="rowActionsTpl"
          emptyMessage="Aucun utilisateur trouvé"
          emptySubtitle="Aucun compte utilisateur ne correspond aux filtres appliqués."
        />

        <!-- Pagination -->
        @if (paginationMeta().total > 0) {
          <app-pagination
            [currentPage]="paginationMeta().currentPage"
            [perPage]="paginationMeta().perPage"
            [total]="paginationMeta().total"
            (pageChange)="onPageChange($event)"
          />
        }
      }

      <!-- Actions de ligne -->
      <ng-template #rowActionsTpl let-u>
        <div class="row-actions-group">
          <!-- Consulter le détail -->
          <button
            type="button"
            class="action-icon-btn action-view"
            (click)="openDetailModal(u)"
            title="Consulter la fiche détaillée"
            aria-label="Détail"
          >
            <i class="bi bi-eye"></i>
          </button>

          <!-- Suspendre ou Réactiver -->
          @if (u.statut === 'actif') {
            <button
              type="button"
              class="action-icon-btn action-suspend"
              (click)="promptStatusChange(u, 'bloque')"
              title="Suspendre cet utilisateur"
              aria-label="Suspendre"
            >
              <i class="bi bi-pause-circle"></i>
            </button>
          } @else {
            <button
              type="button"
              class="action-icon-btn action-activate"
              (click)="promptStatusChange(u, 'actif')"
              title="Réactiver cet utilisateur"
              aria-label="Réactiver"
            >
              <i class="bi bi-check-circle"></i>
            </button>
          }

          <!-- Reset Password -->
          <button
            type="button"
            class="action-icon-btn action-key"
            (click)="openResetPasswordModal(u)"
            title="Réinitialiser le mot de passe"
            aria-label="Réinitialiser le mot de passe"
          >
            <i class="bi bi-key"></i>
          </button>

          <!-- Supprimer -->
          <button
            type="button"
            class="action-icon-btn action-delete"
            (click)="promptDelete(u)"
            title="Supprimer le compte"
            aria-label="Supprimer"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </ng-template>

      <!-- Modal Fiche Détail Utilisateur -->
      <app-modal
        [isOpen]="detailModalOpen()"
        title="Fiche Utilisateur Plateforme"
        (close)="closeDetailModal()"
      >
        @if (selectedUser; as u) {
          <div class="user-detail-container">
            <!-- Header Profil -->
            <div class="user-profile-header">
              <div class="user-avatar-lg">
                {{ getInitials(u.name || u.nom) }}
              </div>
              <div class="user-profile-meta">
                <h3 class="profile-name">{{ u.name || u.nom }}</h3>
                <span class="profile-email">{{ u.email }}</span>
                <div class="profile-badges-row">
                  <span class="badge-role">{{ u.profil?.nom || u.user_type }}</span>
                  <span [class]="'badge-status ' + (u.statut === 'actif' ? 'active' : 'suspended')">
                    ● {{ u.statut === 'actif' ? 'Actif' : 'Suspendu / Bloqué' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Onglets internes : Informations, Permissions, Actions -->
            <div class="detail-nav-tabs">
              <button
                type="button"
                class="detail-tab-btn"
                [class.is-active]="activeDetailTab() === 'info'"
                (click)="activeDetailTab.set('info')"
              >
                Informations
              </button>
              <button
                type="button"
                class="detail-tab-btn"
                [class.is-active]="activeDetailTab() === 'perms'"
                (click)="activeDetailTab.set('perms')"
              >
                Permissions
              </button>
              <button
                type="button"
                class="detail-tab-btn"
                [class.is-active]="activeDetailTab() === 'actions'"
                (click)="activeDetailTab.set('actions')"
              >
                Actions Rapides
              </button>
            </div>

            <!-- Tab 1 : Informations -->
            @if (activeDetailTab() === 'info') {
              <div class="detail-info-grid">
                <div class="info-cell">
                  <span class="info-label">Téléphone</span>
                  <span class="info-value">{{ u.telephone || 'Non renseigné' }}</span>
                </div>

                <div class="info-cell">
                  <span class="info-label">Paroisse rattachée</span>
                  <span class="info-value">{{ getParoisseDisplay(u) }}</span>
                </div>

                <div class="info-cell">
                  <span class="info-label">Organisation Pastorale</span>
                  <span class="info-value">{{ getOrganisationDisplay(u) }}</span>
                </div>

                <div class="info-cell">
                  <span class="info-label">Dernière connexion</span>
                  <span class="info-value">{{ formatDate(u.dernier_login_at) }}</span>
                </div>

                <div class="info-cell">
                  <span class="info-label">Date de création</span>
                  <span class="info-value">{{ formatDate(u.created_at) }}</span>
                </div>
              </div>
            }

            <!-- Tab 2 : Permissions -->
            @if (activeDetailTab() === 'perms') {
              <div class="permissions-tab-content">
                <span class="tab-subtitle">Permissions effectives accordées au profil :</span>
                <div class="permissions-chips-wrap">
                  <span class="perm-chip">users.view</span>
                  <span class="perm-chip">organisations.manage</span>
                  <span class="perm-chip">paroisses.read</span>
                  <span class="perm-chip">abonnements.access</span>
                  <span class="perm-chip">audit.read</span>
                </div>
              </div>
            }

            <!-- Tab 3 : Actions Rapides -->
            @if (activeDetailTab() === 'actions') {
              <div class="actions-tab-content">
                <div class="quick-action-card">
                  <div class="action-desc">
                    <strong>Statut du compte</strong>
                    <span>{{ u.statut === 'actif' ? 'Suspendre l’accès immédiatement' : 'Réactiver l’accès' }}</span>
                  </div>
                  <app-btn
                    [variant]="u.statut === 'actif' ? 'warning' : 'success'"
                    [size]="'sm'"
                    (btnClick)="promptStatusChange(u, u.statut === 'actif' ? 'bloque' : 'actif')"
                  >
                    {{ u.statut === 'actif' ? 'Suspendre' : 'Réactiver' }}
                  </app-btn>
                </div>

                <div class="quick-action-card">
                  <div class="action-desc">
                    <strong>Mot de passe</strong>
                    <span>Envoyer ou forcer un nouveau mot de passe</span>
                  </div>
                  <app-btn
                    [variant]="'outline'"
                    [size]="'sm'"
                    (btnClick)="openResetPasswordModal(u)"
                  >
                    <i class="bi bi-key me-1"></i> Réinitialiser
                  </app-btn>
                </div>

                <div class="quick-action-card delete-box">
                  <div class="action-desc">
                    <strong class="text-danger">Supprimer le compte</strong>
                    <span>Suppression définitive des accès de cet utilisateur</span>
                  </div>
                  <app-btn
                    [variant]="'danger'"
                    [size]="'sm'"
                    (btnClick)="promptDelete(u)"
                  >
                    Supprimer
                  </app-btn>
                </div>
              </div>
            }
          </div>
        }

        <div modal-footer class="modal-footer-actions">
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            (btnClick)="closeDetailModal()"
          >
            Fermer
          </app-btn>
        </div>
      </app-modal>

      <!-- Modal Reset Password -->
      <app-modal
        [isOpen]="resetPasswordModalOpen()"
        title="Réinitialiser le mot de passe"
        (close)="closeResetPasswordModal()"
      >
        <div class="reset-pwd-form">
          <p class="reset-intro">
            Définir un nouveau mot de passe pour <strong>{{ selectedUser?.name || selectedUser?.nom }}</strong> ({{ selectedUser?.email }}).
          </p>

          <div class="field-group">
            <label class="field-label required">Nouveau mot de passe</label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              class="form-input"
              placeholder="Minimum 8 caractères..."
            />
          </div>

          <div class="field-group">
            <label class="field-label required">Confirmer le mot de passe</label>
            <input
              type="password"
              [(ngModel)]="newPasswordConfirmation"
              class="form-input"
              placeholder="Confirmer le nouveau mot de passe..."
            />
          </div>

          @if (resetError()) {
            <span class="field-error">{{ resetError() }}</span>
          }
        </div>

        <div modal-footer class="modal-footer-actions">
          <app-btn
            [variant]="'secondary'"
            [size]="'md'"
            (btnClick)="closeResetPasswordModal()"
          >
            Annuler
          </app-btn>

          <app-btn
            [variant]="'primary'"
            [size]="'md'"
            [loading]="actionLoading()"
            (btnClick)="executeResetPassword()"
          >
            <i class="bi bi-check-lg"></i>
            <span>Enregistrer</span>
          </app-btn>
        </div>
      </app-modal>

      <!-- Dialogue de confirmation de suppression / changement de statut -->
      <app-confirm-dialog
        [isOpen]="confirmDialogOpen()"
        [title]="confirmTitle()"
        [message]="confirmMessage()"
        [variant]="confirmVariant()"
        [confirmText]="confirmActionLabel()"
        [loading]="actionLoading()"
        (confirmed)="executeConfirmAction()"
        (cancelled)="closeConfirmDialog()"
      />
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .filter-select {
      height: 36px;
      padding: 0 0.75rem;
      background-color: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.8125rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      cursor: pointer;
    }
    .filter-select:focus {
      border-color: var(--primary-600, #0284c7);
    }
    .row-actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
    }
    .action-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
      background-color: var(--bg-surface, #ffffff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
      color: var(--text-secondary, #475569);
    }
    .action-icon-btn:hover {
      background-color: var(--neutral-100, #f1f5f9);
    }
    .action-view:hover {
      color: var(--primary-600, #0284c7);
      border-color: var(--primary-300, #93c5fd);
    }
    .action-activate:hover {
      color: var(--success-600, #059669);
      border-color: var(--success-300, #6ee7b7);
    }
    .action-suspend:hover {
      color: var(--warning-600, #d97706);
      border-color: var(--warning-300, #fcd34d);
    }
    .action-key:hover {
      color: #9333ea;
      border-color: #d8b4fe;
    }
    .action-delete:hover {
      color: var(--danger-600, #dc2626);
      border-color: var(--danger-300, #fca5a5);
    }
    /* User Detail Modal styles */
    .user-detail-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .user-profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-md, 8px);
    }
    .user-avatar-lg {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      color: #ffffff;
      font-weight: 700;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-profile-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .profile-name {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
    }
    .profile-email {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .profile-badges-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .badge-role {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-status {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .badge-status.active {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-status.suspended {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .detail-nav-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color, #e2e8f0);
    }
    .detail-tab-btn {
      padding: 0.5rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      transition: all var(--transition-fast, 150ms ease);
    }
    .detail-tab-btn.is-active {
      color: var(--primary-600, #0284c7);
      border-bottom-color: var(--primary-600, #0284c7);
    }
    .detail-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    @media (max-width: 600px) {
      .detail-info-grid {
        grid-template-columns: 1fr;
      }
    }
    .info-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
    }
    .info-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary, #64748b);
    }
    .info-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }
    .permissions-tab-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .tab-subtitle {
      font-size: 0.8125rem;
      color: var(--text-secondary, #64748b);
    }
    .permissions-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .perm-chip {
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm, 6px);
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .actions-tab-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .quick-action-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: var(--neutral-50, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: var(--radius-sm, 6px);
    }
    .action-desc {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .action-desc strong {
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
    }
    .action-desc span {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }
    .delete-box {
      border-color: #fecaca;
      background: #fff5f5;
    }
    /* Reset Password form */
    .reset-pwd-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .reset-intro {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      margin: 0;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
    }
    .field-label.required::after {
      content: ' *';
      color: var(--danger-600, #dc2626);
    }
    .form-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.875rem;
      color: var(--text-primary, #0f172a);
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }
    .form-input:focus {
      border-color: var(--primary-600, #0284c7);
    }
    .field-error {
      font-size: 0.75rem;
      color: var(--danger-600, #dc2626);
      font-weight: 500;
    }
    .modal-footer-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilisateursListPageComponent implements OnInit {
  private readonly userService = inject(UtilisateurService);
  private readonly paroisseService = inject(ParoisseService);
  private readonly orgService = inject(SuperAdminOrganisationService);
  private readonly toast = inject(ToastService);

  public readonly rowActionsTpl = viewChild<TemplateRef<any>>('rowActionsTpl');

  // State signals
  protected readonly utilisateurs = signal<Utilisateur[]>([]);
  protected readonly paroissesList = signal<Paroisse[]>([]);
  protected readonly orgsList = signal<SuperAdminOrganisation[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');

  // Filters
  protected readonly filterProfil = signal<string>('');
  protected readonly filterParoisseId = signal<string>('');
  protected readonly filterOrgId = signal<string>('');
  protected readonly filterStatut = signal<string>('tous');
  protected readonly searchTerm = signal<string>('');

  // Pagination
  protected readonly paginationMeta = signal<PaginationState>({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // User Detail Modal
  protected readonly detailModalOpen = signal<boolean>(false);
  protected readonly activeDetailTab = signal<'info' | 'perms' | 'actions'>('info');
  protected selectedUser: Utilisateur | null = null;

  // Reset Password Modal
  protected readonly resetPasswordModalOpen = signal<boolean>(false);
  protected readonly resetError = signal<string>('');
  protected newPassword = '';
  protected newPasswordConfirmation = '';

  // Confirm Action Dialog
  protected readonly confirmDialogOpen = signal<boolean>(false);
  protected readonly confirmTitle = signal<string>('');
  protected readonly confirmMessage = signal<string>('');
  protected readonly confirmVariant = signal<'danger' | 'warning' | 'info'>('warning');
  protected readonly confirmActionLabel = signal<string>('Confirmer');
  protected readonly actionLoading = signal<boolean>(false);
  private targetAction: 'toggle_status' | 'delete' = 'toggle_status';
  private targetStatus: 'actif' | 'bloque' = 'bloque';

  protected readonly columns: TableColumn<Utilisateur>[] = [
    {
      key: 'name',
      label: 'Nom & Email',
      sortable: true,
      formatter: (val, row) => `${val || row.nom || '—'}\n${row.email}`,
    },
    {
      key: 'profil',
      label: 'Profil / Rôle',
      sortable: true,
      formatter: (val, row) => row.profil?.nom || row.user_type || '—',
    },
    {
      key: 'organisation',
      label: 'Organisation',
      formatter: (val, row) =>
        row.organisation?.nom
          ? `${row.organisation.nom} (${row.organisation.type_organisation})`
          : '—',
    },
    {
      key: 'paroisse',
      label: 'Paroisse',
      formatter: (val, row) =>
        row.paroisse?.nom_paroisse
          ? `${row.paroisse.nom_paroisse} (${row.paroisse.code_paroisse})`
          : '—',
    },
    {
      key: 'dernier_login_at',
      label: 'Dernière connexion',
      width: '160px',
      formatter: (val) => this.formatDate(val),
    },
    {
      key: 'statut',
      label: 'Statut',
      width: '120px',
      formatter: (val) => (val === 'actif' ? '● Actif' : '● Suspendu'),
    },
  ];

  public ngOnInit(): void {
    this.loadFilterOptions();
    this.refresh();
  }

  private loadFilterOptions(): void {
    this.paroisseService.getParoisses({ per_page: 100 }).subscribe({
      next: (res) => this.paroissesList.set(res.data),
      error: () => {},
    });

    this.orgService.getOrganisations({ per_page: 100 }).subscribe({
      next: (res) => this.orgsList.set(res.data),
      error: () => {},
    });
  }

  public refresh(): void {
    this.loading.set(true);
    this.hasError.set(false);

    const filters: UtilisateurFilters = {
      profil: this.filterProfil() || undefined,
      paroisse_id: this.filterParoisseId() || undefined,
      organisation_id: this.filterOrgId() || undefined,
      statut: this.filterStatut() !== 'tous' ? this.filterStatut() : undefined,
      search: this.searchTerm() || undefined,
      page: this.paginationMeta().currentPage,
      per_page: this.paginationMeta().perPage,
    };

    this.userService.getUtilisateurs(filters).subscribe({
      next: (res) => {
        this.utilisateurs.set(res.data);
        this.paginationMeta.set({
          currentPage: res.meta.current_page,
          perPage: res.meta.per_page,
          total: res.meta.total,
          lastPage: res.meta.last_page,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set(
          err?.message || 'Erreur lors de la récupération des utilisateurs.'
        );
        this.loading.set(false);
      },
    });
  }

  protected hasActiveFilters(): boolean {
    return (
      this.filterProfil() !== '' ||
      this.filterParoisseId() !== '' ||
      this.filterOrgId() !== '' ||
      this.filterStatut() !== 'tous' ||
      this.searchTerm() !== ''
    );
  }

  protected onSearchChange(search: string): void {
    this.searchTerm.set(search);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onProfilChange(event: Event): void {
    this.filterProfil.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onParoisseChange(event: Event): void {
    this.filterParoisseId.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onOrgChange(event: Event): void {
    this.filterOrgId.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onStatutChange(event: Event): void {
    this.filterStatut.set((event.target as HTMLSelectElement).value);
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onResetFilters(): void {
    this.filterProfil.set('');
    this.filterParoisseId.set('');
    this.filterOrgId.set('');
    this.filterStatut.set('tous');
    this.searchTerm.set('');
    this.paginationMeta.update((m) => ({ ...m, currentPage: 1 }));
    this.refresh();
  }

  protected onPageChange(event: PageChangeEvent): void {
    this.paginationMeta.update((m) => ({
      ...m,
      currentPage: event.page,
      perPage: event.perPage,
    }));
    this.refresh();
  }

  // Detail Modal
  protected openDetailModal(u: Utilisateur): void {
    this.selectedUser = u;
    this.activeDetailTab.set('info');
    this.detailModalOpen.set(true);
  }

  protected closeDetailModal(): void {
    this.detailModalOpen.set(false);
  }

  // Reset Password Modal
  protected openResetPasswordModal(u: Utilisateur): void {
    this.selectedUser = u;
    this.newPassword = '';
    this.newPasswordConfirmation = '';
    this.resetError.set('');
    this.resetPasswordModalOpen.set(true);
  }

  protected closeResetPasswordModal(): void {
    this.resetPasswordModalOpen.set(false);
  }

  protected executeResetPassword(): void {
    if (!this.selectedUser) return;

    if (!this.newPassword || this.newPassword.length < 8) {
      this.resetError.set('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (this.newPassword !== this.newPasswordConfirmation) {
      this.resetError.set('Les mots de passe saisis ne sont pas identiques.');
      return;
    }

    this.actionLoading.set(true);
    this.resetError.set('');

    const targetUuid = this.selectedUser.uuid || this.selectedUser.id;
    this.userService
      .resetPassword(targetUuid, {
        password: this.newPassword,
        password_confirmation: this.newPasswordConfirmation,
      })
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.resetPasswordModalOpen.set(false);
          this.toast.success(
            'Mot de passe mis à jour',
            `Le mot de passe de ${this.selectedUser?.name || this.selectedUser?.nom} a été réinitialisé.`
          );
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.resetError.set(
            err?.message || 'Erreur lors de la réinitialisation du mot de passe.'
          );
        },
      });
  }

  // Status Change Dialog
  protected promptStatusChange(u: Utilisateur, newStatut: 'actif' | 'bloque'): void {
    this.selectedUser = u;
    this.targetAction = 'toggle_status';
    this.targetStatus = newStatut;

    if (newStatut === 'actif') {
      this.confirmTitle.set('Réactiver le compte');
      this.confirmMessage.set(
        `Voulez-vous réactiver le compte de ${u.name || u.nom} (${u.email}) ? L'accès sera rétabli immédiatement.`
      );
      this.confirmVariant.set('info');
      this.confirmActionLabel.set('Réactiver');
    } else {
      this.confirmTitle.set('Suspendre le compte');
      this.confirmMessage.set(
        `Voulez-vous suspendre le compte de ${u.name || u.nom} (${u.email}) ? L'utilisateur sera déconnecté et ses accès bloqués.`
      );
      this.confirmVariant.set('warning');
      this.confirmActionLabel.set('Suspendre');
    }

    this.confirmDialogOpen.set(true);
  }

  // Delete User Dialog
  protected promptDelete(u: Utilisateur): void {
    this.selectedUser = u;
    this.targetAction = 'delete';
    this.confirmTitle.set('Supprimer l’utilisateur');
    this.confirmMessage.set(
      `ATTENTION : Vous êtes sur le point de supprimer le compte de ${u.name || u.nom} (${u.email}). Cette action désactivera tous ses droits.`
    );
    this.confirmVariant.set('danger');
    this.confirmActionLabel.set('Supprimer');
    this.confirmDialogOpen.set(true);
  }

  protected executeConfirmAction(): void {
    if (!this.selectedUser) return;
    const targetUuid = this.selectedUser.uuid || this.selectedUser.id;
    this.actionLoading.set(true);

    if (this.targetAction === 'toggle_status') {
      this.userService.changeStatut(targetUuid, this.targetStatus).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          if (this.detailModalOpen()) this.closeDetailModal();
          this.toast.success(
            'Statut utilisateur mis à jour',
            `Le compte est désormais [${this.targetStatus === 'actif' ? 'Actif' : 'Suspendu'}].`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur',
            err?.message || 'Erreur lors du changement de statut.'
          );
        },
      });
    } else {
      this.userService.deleteUtilisateur(targetUuid).subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          if (this.detailModalOpen()) this.closeDetailModal();
          this.toast.success(
            'Utilisateur supprimé',
            `Le compte de ${this.selectedUser?.name || this.selectedUser?.nom} a été supprimé.`
          );
          this.refresh();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.confirmDialogOpen.set(false);
          this.toast.error(
            'Erreur de suppression',
            err?.message || 'Impossible de supprimer cet utilisateur.'
          );
        },
      });
    }
  }

  protected closeConfirmDialog(): void {
    this.confirmDialogOpen.set(false);
  }

  protected getInitials(name: string | undefined): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  protected formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Jamais';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? String(dateStr)
        : d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return String(dateStr);
    }
  }

  protected getParoisseDisplay(u: Utilisateur): string {
    if (u.paroisse?.nom_paroisse) {
      return u.paroisse.nom_paroisse + (u.paroisse.code_paroisse ? ` (${u.paroisse.code_paroisse})` : '');
    }
    return 'Aucune (Niveau Central)';
  }

  protected getOrganisationDisplay(u: Utilisateur): string {
    if (u.organisation?.nom) {
      return u.organisation.nom + (u.organisation.type_organisation ? ` [${u.organisation.type_organisation}]` : '');
    }
    return 'Aucune';
  }
}
