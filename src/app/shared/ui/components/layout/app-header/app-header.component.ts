import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '@core/services/sidebar.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeUserMenu()'
  }
})
export class AppHeader {
  private readonly elementRef = inject(ElementRef);
  protected readonly sidebarService: SidebarService = inject(SidebarService);
  protected readonly toastService: ToastService = inject(ToastService);
  protected readonly authService: AuthService = inject(AuthService);
  protected readonly router: Router = inject(Router);

  public toggleMobile(): void {
    this.sidebarService.toggleMobile();
  }

  public toggleCollapse(): void {
    this.sidebarService.toggleCollapse();
  }

  public readonly showUserMenu = signal<boolean>(false);
  public readonly isFullscreen = signal<boolean>(false);

  // Authenticated user signals
  protected readonly user = this.authService.currentUser;
  protected readonly org = this.authService.currentOrganisation;

  protected readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return 'Administrateur';
    if (u.nom && u.prenoms) return `${u.nom} ${u.prenoms}`;
    if (u.name) return u.name;
    if (u.nom) return u.nom;
    return u.email ? u.email.split('@')[0] : 'Administrateur';
  });

  protected readonly userInitials = computed(() => {
    const u = this.user();
    if (u?.nom && u?.prenoms) {
      return `${u.nom.charAt(0)}${u.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.displayName();
    if (!name) return 'SA';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  protected readonly userRole = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (this.authService.isSuperAdmin()) {
      return 'Super Administrateur';
    }
    const o = this.org();
    if (o) {
      return `${u.profil?.nom || 'Responsable'} (${o.type_organisation})`;
    }
    return u.profil?.nom || 'Utilisateur';
  });

  protected readonly headerTitle = computed(() => {
    if (this.authService.isSuperAdmin()) {
      return 'Plateforme Centrale CATHEO';
    }
    const o = this.org();
    if (o) {
      return `${o.nom} - ${o.paroisse?.nom_paroisse || 'Paroisse'}`;
    }
    return 'Espace Pastoral';
  });

  public toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu.update((v) => !v);
  }

  public closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => this.isFullscreen.set(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => this.isFullscreen.set(false)).catch(() => {});
      }
    }
  }

  public logout(): void {
    this.closeUserMenu();
    this.authService.logout().subscribe();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeUserMenu();
    }
  }
}
