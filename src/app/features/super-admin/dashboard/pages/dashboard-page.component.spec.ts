import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardService } from '../services/dashboard.service';
import { SuperAdminDashboardData } from '../models/dashboard.model';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let dashboardServiceMock: { getDashboardData: ReturnType<typeof vi.fn> };

  const mockData: SuperAdminDashboardData = {
    paroisses: { total: 5, actives: 4 },
    produits_actifs: 3,
    abonnements: {
      actifs: 6,
      en_attente: 2,
      suspendus: 1,
      expires: 0,
      resilies: 0,
    },
    finances: {
      ca_total_encaisse: 350000,
      ca_mois_courant: 85000,
      echeances_en_retard: 1,
      montant_en_retard: 25000,
      devise: 'XOF',
    },
    repartition_produits: [
      { produit_id: 1, produit_code: 'OPPE', produit_nom: 'OPPE', abonnements_actifs: 4 },
      { produit_id: 2, produit_code: 'OPPJ', produit_nom: 'OPPJ', abonnements_actifs: 2 },
    ],
    paiements_recents: [
      {
        id: 'p-1',
        reference: 'REC-001',
        montant: 25000,
        devise: 'XOF',
        mode_paiement: 'wave',
        date_paiement: '2026-09-19',
        paroisse_nom: 'St Jean',
        produit_code: 'OPPE',
      },
    ],
  };

  beforeEach(async () => {
    dashboardServiceMock = {
      getDashboardData: vi.fn().mockReturnValue(of(mockData)),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
  });

  it('should create and load dashboard data on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(dashboardServiceMock.getDashboardData).toHaveBeenCalledTimes(1);
    expect(component.isLoading()).toBe(false);
    expect(component.dashboardData()).toEqual(mockData);
  });

  it('should display KPI stat cards when data is loaded', () => {
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    const statCards = compiled.querySelectorAll('app-stat-card');
    expect(statCards.length).toBe(4);
    expect(compiled.textContent).toContain('Tableau de bord');
    expect(compiled.textContent).toContain('Chiffre d\'Affaires Total');
  });

  it('should display error state and allow retry when service fails', () => {
    dashboardServiceMock.getDashboardData.mockReturnValue(
      throwError(() => new Error('Connexion au serveur impossible.'))
    );

    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toContain('Connexion au serveur impossible.');

    const compiled: HTMLElement = fixture.nativeElement;
    const errorState = compiled.querySelector('app-error-state');
    expect(errorState).toBeTruthy();

    // Now test retry
    dashboardServiceMock.getDashboardData.mockReturnValue(of(mockData));
    component.loadDashboard();
    fixture.detectChanges();

    expect(component.errorMessage()).toBeNull();
    expect(component.dashboardData()).toEqual(mockData);
  });

  it('should re-fetch data when refresh is called', () => {
    fixture.detectChanges();
    expect(dashboardServiceMock.getDashboardData).toHaveBeenCalledTimes(1);

    component.loadDashboard();
    expect(dashboardServiceMock.getDashboardData).toHaveBeenCalledTimes(2);
  });
});
