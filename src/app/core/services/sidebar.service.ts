import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

export interface NavSubItem {
  libelle: string;
  path: string;
  icon?: string;
  permission?: string;
}

export interface NavItem {
  id: string;
  libelle: string;
  icon: string;
  path: string;
  isDivider?: boolean;
  permission?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
  sousMenus?: NavSubItem[];
}

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private readonly authService = inject(AuthService);
  private readonly permissionService = inject(PermissionService);

  public readonly isCollapsed = signal<boolean>(false);
  public readonly isMobileOpen = signal<boolean>(false);
  public readonly expandedMenus = signal<Set<string>>(new Set());

  // Menu dynamique selon le rôle, le contexte et les permissions RBAC réelles
  public readonly menuItems = computed<NavItem[]>(() => {
    if (this.authService.isSuperAdmin()) {
      return this.getSuperAdminMenu();
    }
    if (this.authService.isOrganisationUser()) {
      return this.getOrganisationMenu().filter((item) => {
        if (!item.permission) return true;
        return this.permissionService.hasPermission(item.permission);
      });
    }
    return [];
  });

  public toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  public toggleMobile(): void {
    this.isMobileOpen.update((v) => !v);
  }

  public closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  public toggleSubMenu(id: string): void {
    this.expandedMenus.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public expandSubMenu(id: string): void {
    this.expandedMenus.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  }

  public isExpanded(id: string): boolean {
    return this.expandedMenus().has(id);
  }

  private getSuperAdminMenu(): NavItem[] {
    return [
      {
        id: 'sa_dashboard',
        libelle: 'Tableau de bord',
        icon: 'bi bi-speedometer2',
        path: '/super-admin/dashboard',
      },
      {
        id: 'sa_paroisses',
        libelle: 'Paroisses',
        icon: 'bi bi-building',
        path: '/super-admin/paroisses',
      },
      {
        id: 'sa_organisations',
        libelle: 'Organisations',
        icon: 'bi bi-diagram-3',
        path: '/super-admin/organisations',
      },
      {
        id: 'sa_abonnements',
        libelle: 'Abonnements',
        icon: 'bi bi-credit-card-2-front',
        path: '/super-admin/abonnements',
      },
      {
        id: 'sa_produits',
        libelle: 'Produits',
        icon: 'bi bi-box-seam',
        path: '/super-admin/produits',
      },
      {
        id: 'sa_formules',
        libelle: 'Formules',
        icon: 'bi bi-tags',
        path: '/super-admin/formules',
      },
      {
        id: 'sa_utilisateurs',
        libelle: 'Utilisateurs',
        icon: 'bi bi-people',
        path: '/super-admin/utilisateurs',
      },
      {
        id: 'sa_div_audit',
        libelle: '',
        icon: '',
        path: '',
        isDivider: true,
      },
      {
        id: 'sa_audit',
        libelle: 'Journal d’activité',
        icon: 'bi bi-journal-text',
        path: '/super-admin/audit',
      },
      {
        id: 'sa_trash',
        libelle: 'Audit des suppressions',
        icon: 'bi bi-trash3',
        path: '/super-admin/trash',
      },
      {
        id: 'sa_div_settings',
        libelle: '',
        icon: '',
        path: '',
        isDivider: true,
      },
      {
        id: 'sa_sante_api',
        libelle: 'Paramètres & Santé API',
        icon: 'bi bi-sliders',
        path: '/super-admin/sante-api',
      },
    ];
  }

  private getOrganisationMenu(): NavItem[] {
    return [
      {
        id: 'org_dashboard',
        libelle: 'Dashboard',
        icon: 'bi bi-speedometer2',
        path: '/organisation/dashboard',
        permission: 'dashboard.read',
      },
      {
        id: 'org_membres',
        libelle: 'Membres du bureau',
        icon: 'bi bi-people',
        path: '/organisation/membres',
        permission: 'membres.view',
      },
      {
        id: 'org_activites',
        libelle: 'Activité',
        icon: 'bi bi-calendar-event',
        path: '/organisation/activites',
        permission: 'activites.view',
      },
      {
        id: 'org_pelerinages',
        libelle: 'Campagnes de pèlerinage',
        icon: 'bi bi-compass',
        path: '/organisation/pelerinages',
        permission: 'pelerinages.read',
      },
      {
        id: 'org_tarifs',
        libelle: 'Tarifs',
        icon: 'bi bi-tags',
        path: '/organisation/tarifs',
        permission: 'pelerinages.read',
      },
      {
        id: 'org_participants',
        libelle: 'Participants',
        icon: 'bi bi-person-lines-fill',
        path: '/organisation/participants',
        permission: 'pelerinages.read',
      },
      {
        id: 'org_caisse',
        libelle: 'Caisse',
        icon: 'bi bi-wallet2',
        path: '/organisation/caisse',
        permission: 'caisse.read',
      },
      {
        id: 'org_paiements',
        libelle: 'Paiements',
        icon: 'bi bi-credit-card-2-front',
        path: '/organisation/paiements',
        permission: 'pelerinages.read',
      },
      {
        id: 'org_statistiques',
        libelle: 'Statistiques',
        icon: 'bi bi-graph-up',
        path: '/organisation/statistiques',
        permission: 'statistiques.read',
      },
      {
        id: 'org_informations',
        libelle: 'Informations',
        icon: 'bi bi-info-circle',
        path: '/organisation/informations',
        permission: 'organisation.view',
      },
      {
        id: 'org_utilisateurs',
        libelle: 'Utilisateurs & rôles',
        icon: 'bi bi-shield-lock',
        path: '/organisation/utilisateurs',
        permission: 'organisation.users.manage',
      },
      {
        id: 'org_historique',
        libelle: 'Historique',
        icon: 'bi bi-clock-history',
        path: '/organisation/historique',
        permission: 'organisation.view',
      },
    ];
  }
}
