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
import { TableComponent } from '../../../../shared/components/table/table.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrganisationUserModalComponent } from '../components/organisation-user-modal.component';
import {
  OrganisationAdminService,
  OrgProfilOption,
  OrgUserItem,
} from '../../services/organisation-admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TableColumn } from '../../../../shared/models/table.model';
import { PageChangeEvent } from '../../../../shared/models/pagination.model';

@Component({
  selector: 'app-organisation-users-page',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    ButtonComponent,
    StatCardComponent,
    FilterBarComponent,
    TableComponent,
    PaginationComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    OrganisationUserModalComponent,
  ],
  template: `
    <div class="users-page-container">
      <app-page-header
        title="Utilisateurs & Droits d'Accès (RBAC)"
        subtitle="Gestion des comptes collaborateurs, attribution des profils pastoraux et statut des accès"
        badge="Sécurité"
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

          <app-btn
            variant="primary"
            icon="person-plus"
            (btnClick)="openCreateModal()"
          >
            Inviter un utilisateur
          </app-btn>
        </div>
      </app-page-header>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <app-stat-card
          title="Total utilisateurs"
          [value]="totalUsers()"
          subtitle="Comptes rattachés"
          icon="bi bi-people-fill"
          theme="primary"
        />

        <app-stat-card
          title="Comptes actifs"
          [value]="totalActifs()"
          subtitle="Accès opérationnel"
          icon="bi bi-person-check-fill"
          theme="success"
        />

        <app-stat-card
          title="Comptes suspendus"
          [value]="totalSuspendus()"
          subtitle="Accès temporairement bloqué"
          icon="bi bi-person-x-fill"
          theme="warning"
        />

        <app-stat-card
          title="Rôles & Profils"
          [value]="profils().length"
          subtitle="Profils configurés"
          icon="bi bi-shield-lock"
          theme="accent"
        />
      </div>

      <!-- Filtres et recherche -->
      <div class="mt-6">
        <app-filter-bar
          searchPlaceholder="Rechercher par nom, email, téléphone..."
          [hasActiveFilters]="hasActiveFilters()"
          (searchChange)="onSearchChange($event)"
          (resetFilters)="onResetFilters()"
        >
          <div class="filters-wrap">
            <select
              [value]="selectedStatut()"
              (change)="onStatutChange($event)"
              class="filter-select"
              aria-label="Statut du compte"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>
        </app-filter-bar>
      </div>

      <!-- Erreur -->
      @if (errorMessage() && !isLoading()) {
        <div class="mt-6">
          <app-error-state
            title="Erreur de chargement"
            [message]="errorMessage()!"
            actionText="Réessayer"
            (action)="loadUsers()"
          />
        </div>
      }

      <!-- Tableau des utilisateurs -->
      @if (!errorMessage()) {
        <div class="mt-4">
          <app-table
            [columns]="columns"
            [data]="filteredUsers()"
            [loading]="isLoading()"
            [hasActions]="true"
            [rowActionsTemplate]="rowActionsTpl"
            emptyMessage="Aucun utilisateur trouvé"
            emptySubtitle="Aucun collaborateur ne correspond aux filtres."
          />

          @if (totalItems() > 0) {
            <div class="mt-4">
              <app-pagination
                [currentPage]="currentPage()"
                [perPage]="perPage()"
                [total]="totalItems()"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        </div>
      }

      <ng-template #rowActionsTpl let-u>
        <div class="row-actions-group">
          <button
            type="button"
            class="action-btn action-edit"
            (click)="openEditModal(u)"
            title="Modifier l'utilisateur"
            aria-label="Modifier"
          >
            <i class="bi bi-pencil"></i>
          </button>

          <button
            type="button"
            class="action-btn"
            [class.action-deactivate]="u.statut === 'actif'"
            [class.action-activate]="u.statut !== 'actif'"
            (click)="toggleStatus(u)"
            [title]="u.statut === 'actif' ? 'Suspendre cet utilisateur' : 'Réactiver cet utilisateur'"
            aria-label="Statut"
          >
            <i [class]="u.statut === 'actif' ? 'bi bi-pause-circle' : 'bi bi-play-circle'"></i>
          </button>

          <button
            type="button"
            class="action-btn action-delete"
            (click)="openDeleteConfirm(u)"
            title="Supprimer définitivement"
            aria-label="Supprimer"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </ng-template>

      <!-- Modal de création / édition -->
      <app-organisation-user-modal
        [isOpen]="isModalOpen()"
        [user]="selectedUserForEdit()"
        [profils]="profils()"
        (close)="closeModal()"
        (saved)="onUserSaved()"
      />

      <!-- Dialogue de confirmation de suppression -->
      <app-confirm-dialog
        [isOpen]="isDeleteConfirmOpen()"
        title="Supprimer l'utilisateur"
        [message]="deleteConfirmMessage()"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        [loading]="isDeleting()"
        (confirmed)="confirmDelete()"
        (cancelled)="closeDeleteConfirm()"
      />
    </div>
  `,
  styles: [`
    .users-page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-select {
      height: 38px;
      padding: 0 0.75rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: var(--radius-md, 6px);
      background: var(--bg-surface, #ffffff);
      font-size: 0.85rem;
      color: var(--text-primary, #0f172a);
      outline: none;
    }
    .row-actions-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md, 6px);
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-card, #ffffff);
      color: var(--text-secondary, #475569);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .action-btn:hover {
      background: var(--neutral-100, #f1f5f9);
      color: var(--text-primary, #0f172a);
    }
    .action-edit:hover {
      border-color: var(--primary-400, #60a5fa);
      color: var(--primary-600, #2563eb);
    }
    .action-deactivate:hover {
      border-color: #f59e0b;
      color: #d97706;
    }
    .action-activate:hover {
      border-color: #10b981;
      color: #059669;
    }
    .action-delete:hover {
      border-color: var(--danger-300, #fca5a5);
      color: var(--danger-600, #dc2626);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationUsersPageComponent implements OnInit {
  private readonly adminService = inject(OrganisationAdminService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly users = signal<OrgUserItem[]>([]);
  public readonly profils = signal<OrgProfilOption[]>([]);
  public readonly totalItems = signal<number>(0);
  public readonly currentPage = signal<number>(1);
  public readonly perPage = signal<number>(15);

  public readonly searchQuery = signal<string>('');
  public readonly selectedStatut = signal<string>('tous');

  public readonly isModalOpen = signal<boolean>(false);
  public readonly selectedUserForEdit = signal<OrgUserItem | null>(null);

  public readonly isDeleteConfirmOpen = signal<boolean>(false);
  public readonly selectedUserForDelete = signal<OrgUserItem | null>(null);
  public readonly isDeleting = signal<boolean>(false);

  public readonly totalUsers = computed(() => this.users().length);
  public readonly totalActifs = computed(() => this.users().filter((u) => u.statut === 'actif').length);
  public readonly totalSuspendus = computed(
    () => this.users().filter((u) => u.statut === 'suspendu' || u.statut === 'inactif').length
  );

  public readonly hasActiveFilters = computed(
    () => this.searchQuery().length > 0 || this.selectedStatut() !== 'tous'
  );

  public readonly filteredUsers = computed(() => {
    let list = this.users();
    const st = this.selectedStatut();
    if (st !== 'tous') {
      list = list.filter((u) => u.statut === st);
    }
    return list;
  });

  public readonly deleteConfirmMessage = computed(() => {
    const u = this.selectedUserForDelete();
    return u
      ? `Êtes-vous sûr de vouloir supprimer le compte de "${u.name}" (${u.email}) ?`
      : '';
  });

  public readonly columns: TableColumn<OrgUserItem>[] = [
    {
      key: 'name',
      label: 'Utilisateur',
      sortable: true,
      formatter: (val, row) => `${val}\n${row.email}`,
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      formatter: (val) => val || '—',
    },
    {
      key: 'profil',
      label: 'Profil / Rôle',
      formatter: (_, row) => row.profil?.name || 'Responsable',
    },
    {
      key: 'statut',
      label: 'Statut',
      align: 'center',
      formatter: (val) => {
        if (val === 'actif') return 'Actif';
        if (val === 'suspendu') return 'Suspendu';
        return val || 'Inactif';
      },
    },
    {
      key: 'dernier_login_at',
      label: 'Dernière connexion',
      formatter: (val) => (val ? new Date(val).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'Jamais connecté'),
    },
  ];

  public ngOnInit(): void {
    this.loadProfils();
    this.loadUsers();
  }

  public loadProfils(): void {
    this.adminService.getProfils().subscribe({
      next: (list) => this.profils.set(list),
      error: () => {},
    });
  }

  public loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService
      .getUsers({
        search: this.searchQuery().trim() || undefined,
        statut: this.selectedStatut() !== 'tous' ? this.selectedStatut() : undefined,
        page: this.currentPage(),
        per_page: this.perPage(),
      })
      .subscribe({
        next: ({ data, meta }) => {
          this.users.set(data);
          this.totalItems.set(meta.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'Impossible de charger les utilisateurs.');
        },
      });
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    this.loadUsers();
  }

  public onStatutChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatut.set(val);
    this.currentPage.set(1);
    this.loadUsers();
  }

  public onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatut.set('tous');
    this.currentPage.set(1);
    this.loadUsers();
  }

  public onPageChange(evt: PageChangeEvent): void {
    this.currentPage.set(evt.page);
    this.perPage.set(evt.perPage);
    this.loadUsers();
  }

  public refreshData(): void {
    this.loadUsers();
    this.toast.info('Actualisation', 'Rechargement des utilisateurs...');
  }

  public openCreateModal(): void {
    this.selectedUserForEdit.set(null);
    this.isModalOpen.set(true);
  }

  public openEditModal(user: OrgUserItem): void {
    this.selectedUserForEdit.set(user);
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedUserForEdit.set(null);
  }

  public onUserSaved(): void {
    this.closeModal();
    this.loadUsers();
  }

  public toggleStatus(user: OrgUserItem): void {
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: () => {
        const nextStatut = user.statut === 'actif' ? 'suspendu' : 'actif';
        this.toast.success(
          'Statut mis à jour',
          `Le compte de ${user.name} est désormais ${nextStatut}.`
        );
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de modifier le statut.');
      },
    });
  }

  public openDeleteConfirm(user: OrgUserItem): void {
    this.selectedUserForDelete.set(user);
    this.isDeleteConfirmOpen.set(true);
  }

  public closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen.set(false);
    this.selectedUserForDelete.set(null);
  }

  public confirmDelete(): void {
    const u = this.selectedUserForDelete();
    if (!u) return;

    this.isDeleting.set(true);
    this.adminService.deleteUser(u.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.toast.success('Supprimé', `Le compte de ${u.name} a été supprimé.`);
        this.loadUsers();
      },
      error: () => {
        this.isDeleting.set(false);
        this.toast.error('Erreur', 'Impossible de supprimer cet utilisateur.');
      },
    });
  }
}
