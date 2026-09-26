import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { PelerinageDetailPageComponent } from './pelerinage-detail-page.component';
import { PelerinageService } from '../services/pelerinage.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CampagnePelerinage,
  CampagneStatistiques,
  InscriptionPelerinage,
  PaiementPelerinage,
  TarifPelerinage,
} from '../models/pelerinage.model';
describe('PelerinageDetailPageComponent', () => {
  let component: PelerinageDetailPageComponent;
  let fixture: ComponentFixture<PelerinageDetailPageComponent>;
  let mockPelerinageService: {
    getCampagne: ReturnType<typeof vi.fn>;
    getInscriptions: ReturnType<typeof vi.fn>;
    getTarifs: ReturnType<typeof vi.fn>;
    getCampagnePaiements: ReturnType<typeof vi.fn>;
    updateParticipation: ReturnType<typeof vi.fn>;
    annulerInscription: ReturnType<typeof vi.fn>;
    deleteTarif: ReturnType<typeof vi.fn>;
    annulerPaiement: ReturnType<typeof vi.fn>;
  };

  let mockPermissionService: {
    hasPermission: ReturnType<typeof vi.fn>;
  };

  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const sampleCampagne: CampagnePelerinage = {
    id: 1,
    uuid: 'uuid-pel-1',
    organisation_id: 10,
    code: 'PEL-2026-001',
    nom: 'Pèlerinage Marial d’Issia',
    destination: 'Issia',
    description: 'Pèlerinage annuel',
    date_depart: '2026-04-10',
    heure_depart: '06:00:00',
    date_fin: '2026-04-12',
    heure_fin: '18:00:00',
    capacite: 50,
    places_occupees: 25,
    places_restantes: 25,
    total_inscrits: 25,
    statut: 'ouverte',
    tarifs: [
      {
        id: 1,
        uuid: 'uuid-tarif-1',
        campagne_pelerinage_id: 1,
        code: 'TARIF-01',
        libelle: 'Forfait Standard',
        montant: 45000,
        devise: 'XOF',
        statut: 'actif',
      },
    ],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const sampleStats: CampagneStatistiques = {
    campagne_id: 1,
    capacite: 50,
    places_occupees: 25,
    places_restantes: 25,
    est_complete: false,
    montant_attendu: 1125000,
    montant_collecte: 800000,
    solde_restant: 325000,
    repartition_participation: {
      prevue: 25,
      presente: 0,
      absente: 0,
    },
    repartition_statuts: {
      en_attente: 5,
      partiellement_payee: 10,
      payee: 10,
      annulee: 2,
    },
    total_inscrits: 25,
  };

  const sampleInscription: InscriptionPelerinage = {
    id: 10,
    uuid: 'uuid-ins-1',
    tarif_pelerinage_id: 1,
    nom: 'Yao',
    prenoms: 'Kouassi',
    reference: 'INS-2026-001',
    campagne_pelerinage_id: 1,
    type_participant: 'EXTERNE',
    nom_complet: 'Yao Kouassi',
    telephone: '0701020304',
    montant: 45000,
    montant_paye: 45000,
    reste_a_payer: 0,
    statut_inscription: 'payee',
    statut_participation: 'prevue',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  };

  const sampleTarifs: TarifPelerinage[] = [
    {
      id: 1,
      uuid: 'uuid-tarif-1',
      campagne_pelerinage_id: 1,
      code: 'TARIF-01',
      libelle: 'Forfait Standard',
      montant: 45000,
      devise: 'XOF',
      statut: 'actif',
    },
    {
      id: 2,
      uuid: 'uuid-tarif-2',
      campagne_pelerinage_id: 1,
      code: 'TARIF-02',
      libelle: 'Forfait Réduit Jeune',
      montant: 30000,
      devise: 'XOF',
      statut: 'actif',
    },
  ];

  const samplePaiement: PaiementPelerinage = {
    id: 100,
    uuid: 'uuid-pai-1',
    reference: 'PAI-2026-001',
    inscription_pelerinage_id: 10,
    montant: 45000,
    devise: 'XOF',
    mode_paiement: 'ESPECES',
    date_paiement: '2026-01-15T10:00:00Z',
    statut: 'valide',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    inscription: sampleInscription,
  };

  beforeEach(async () => {
    mockPelerinageService = {
      getCampagne: vi.fn().mockReturnValue(
        of({
          data: sampleCampagne,
          stats: sampleStats,
        })
      ),
      getInscriptions: vi.fn().mockReturnValue(
        of({
          data: [sampleInscription],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
      getTarifs: vi.fn().mockReturnValue(of(sampleTarifs)),
      getCampagnePaiements: vi.fn().mockReturnValue(
        of({
          data: [samplePaiement],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        })
      ),
      updateParticipation: vi.fn().mockReturnValue(of({ ...sampleInscription, statut_participation: 'presente' })),
      annulerInscription: vi.fn().mockReturnValue(of({ ...sampleInscription, statut_inscription: 'annulee' })),
      deleteTarif: vi.fn().mockReturnValue(of(undefined)),
      annulerPaiement: vi.fn().mockReturnValue(of({ paiement: { ...samplePaiement, statut: 'annule' }, inscription: sampleInscription })),
    };

    mockPermissionService = {
      hasPermission: vi.fn().mockImplementation((perm: string) => {
        return ['pelerinages.create', 'pelerinages.update', 'pelerinages.delete', 'pelerinages.paiements'].includes(perm);
      }),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PelerinageDetailPageComponent],
      providers: [
        { provide: PelerinageService, useValue: mockPelerinageService },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: ToastService, useValue: mockToast },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PelerinageDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load campagne and inscriptions', () => {
    expect(component).toBeTruthy();
    expect(mockPelerinageService.getCampagne).toHaveBeenCalledWith('1');
    expect(mockPelerinageService.getInscriptions).toHaveBeenCalledWith(1, expect.any(Object));
    expect(component.campagne()?.nom).toBe('Pèlerinage Marial d’Issia');
    expect(component.inscriptions().length).toBe(1);
  });

  it('should calculate capacity and subtitle correctly', () => {
    expect(component.capaciteDisplay()).toBe('25 / 50');
    expect(component.capaciteSubtitle()).toBe('25 places restantes');
  });

  it('should switch tabs and load corresponding datasets', () => {
    component.setTab('tarifs');
    expect(component.activeTab()).toBe('tarifs');
    expect(mockPelerinageService.getTarifs).toHaveBeenCalledWith(1);

    component.setTab('paiements');
    expect(component.activeTab()).toBe('paiements');
    expect(mockPelerinageService.getCampagnePaiements).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('should update participation presence and show success toast', () => {
    component.setParticipation(sampleInscription, 'presente');
    expect(mockPelerinageService.updateParticipation).toHaveBeenCalledWith(1, 10, 'presente');
    expect(mockToast.success).toHaveBeenCalledWith('Pointage enregistré', expect.stringContaining('Présence mise à jour'));
  });

  it('should confirm and execute inscription annulation', () => {
    component.confirmAnnulerInscription(sampleInscription);
    expect(component.isConfirmDialogOpen()).toBe(true);
    expect(component.confirmTitle()).toContain('Annuler');

    component.executeConfirmedAction();
    expect(mockPelerinageService.annulerInscription).toHaveBeenCalledWith(1, 10);
    expect(mockToast.success).toHaveBeenCalledWith('Inscription annulée', expect.stringContaining('annulée'));
  });

  it('should confirm and execute paiement annulation', () => {
    component.confirmAnnulerPaiement(samplePaiement);
    expect(component.isConfirmDialogOpen()).toBe(true);
    expect(component.confirmTitle()).toContain('Annuler le versement');

    component.executeConfirmedAction();
    expect(mockPelerinageService.annulerPaiement).toHaveBeenCalledWith(1, 100);
    expect(mockToast.success).toHaveBeenCalledWith('Paiement annulé', expect.stringContaining('annulé'));
  });

  it('should confirm and execute tarif deletion', () => {
    const tarif = sampleTarifs[0];
    component.confirmDeleteTarif(tarif);
    expect(component.isConfirmDialogOpen()).toBe(true);

    component.executeConfirmedAction();
    expect(mockPelerinageService.deleteTarif).toHaveBeenCalledWith(1, tarif.id);
    expect(mockToast.success).toHaveBeenCalledWith('Tarif supprimé', expect.stringContaining('supprimé'));
  });

  it('should open and close inscription modal', () => {
    component.openInscriptionModal();
    expect(component.isInscriptionModalOpen()).toBe(true);

    component.closeInscriptionModal();
    expect(component.isInscriptionModalOpen()).toBe(false);
  });

  it('should open and close paiement modal', () => {
    component.openPaiementModal(sampleInscription);
    expect(component.isPaiementModalOpen()).toBe(true);
    expect(component.selectedInscriptionForPaiement()).toEqual(sampleInscription);

    component.closePaiementModal();
    expect(component.isPaiementModalOpen()).toBe(false);
    expect(component.selectedInscriptionForPaiement()).toBeNull();
  });

  it('should open and close tarif modal', () => {
    component.openTarifModal();
    expect(component.isTarifModalOpen()).toBe(true);
    expect(component.selectedTarifForEdit()).toBeNull();

    component.openEditTarifModal(sampleTarifs[1]);
    expect(component.selectedTarifForEdit()).toEqual(sampleTarifs[1]);

    component.closeTarifModal();
    expect(component.isTarifModalOpen()).toBe(false);
  });

  it('should filter inscriptions by search text', () => {
    component.onSearchInscriptionChange('Kouassi');
    expect(component.insSearch()).toBe('Kouassi');
    expect(component.insPage()).toBe(1);
    expect(mockPelerinageService.getInscriptions).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ search: 'Kouassi', page: 1 })
    );
  });

  it('should reset inscription filters', () => {
    component.onSearchInscriptionChange('Kouassi');
    expect(component.hasActiveInscriptionFilters()).toBe(true);

    component.onResetInscriptionFilters();
    expect(component.insSearch()).toBe('');
    expect(component.insStatutFilter()).toBe('tous');
    expect(component.insPresenceFilter()).toBe('tous');
    expect(component.insTypeFilter()).toBe('tous');
  });

  it('should navigate back to pelerinages list', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/organisation/pelerinages']);
  });

  it('should handle 404 error when campagne is not found', () => {
    mockPelerinageService.getCampagne.mockReturnValueOnce(
      throwError(() => ({ status: 404, message: 'Not found' }))
    );

    component.refreshAll();
    expect(component.errorMessage()).toContain('Campagne de pèlerinage introuvable');
  });
});
