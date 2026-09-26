import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarService, NavItem, NavSubItem } from '@core/services/sidebar.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar implements OnInit {
  protected readonly sidebarService: SidebarService = inject(SidebarService);
  protected readonly authService: AuthService = inject(AuthService);
  protected readonly router: Router = inject(Router);

  protected readonly isCollapsed = this.sidebarService.isCollapsed;
  protected readonly isMobileOpen = this.sidebarService.isMobileOpen;
  protected readonly menuItems = this.sidebarService.menuItems;

  public readonly brandTitle = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return 'CATHÉO';
    }
    const org = this.authService.currentOrganisation();
    return org?.code || 'ORGANISATION';
  });

  public readonly brandTagline = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return 'Super Administrateur';
    }
    const org = this.authService.currentOrganisation();
    return org?.nom || 'Espace Pastoral';
  });

  public readonly spaceBadge = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return 'SUPER ADMIN';
    }
    const org = this.authService.currentOrganisation();
    return org?.type_organisation || 'PASTORAL';
  });

  public ngOnInit(): void {
    this.autoExpandActiveMenu(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.autoExpandActiveMenu(e.urlAfterRedirects || e.url);
      });
  }

  private autoExpandActiveMenu(currentUrl: string): void {
    if (!currentUrl) return;
    const items: NavItem[] = this.menuItems();
    for (const item of items) {
      if (item.sousMenus && item.sousMenus.length > 0) {
        const hasActiveChild = item.sousMenus.some(
          (sub: NavSubItem) => sub.path && sub.path !== '#' && (currentUrl === sub.path || currentUrl.startsWith(sub.path + '/'))
        );
        if (hasActiveChild) {
          this.sidebarService.expandSubMenu(item.id);
        }
      }
    }
  }

  protected closeMobile(): void {
    this.sidebarService.closeMobile();
  }

  protected toggleMenu(item: NavItem, event: MouseEvent): void {
    if (item.sousMenus && item.sousMenus.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      if (this.sidebarService.isCollapsed()) {
        this.sidebarService.isCollapsed.set(false);
      }
      this.sidebarService.toggleSubMenu(item.id);
    } else {
      this.closeMobile();
    }
  }

  protected isMenuExpanded(item: NavItem): boolean {
    return this.sidebarService.isExpanded(item.id);
  }
}
