import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { AbonnementsListPageComponent } from './abonnements-list-page.component';
import { AbonnementService } from '../../services/abonnement.service';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { ProduitService } from '../../../produits/services/produit.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Abonnement, AbonnementPaginatedResponse } from '../../models/abonnement.model';
import { Produit } from '../../../produits/models/produit.model';
import { Paroisse } from '../../../paroisses/models/paroisse.model';

describe('AbonnementsListPageComponent', () => {
  let component: AbonnementsListPageComponent;
  let fixture: ComponentFixture<AbonnementsListPageComponent>;

  let abonnementServiceMock: {
    getAbonnements: ReturnType<typeof vi.fn>;
    changerStatut: ReturnType<typeof vi.fn>;
    changeStatut: ReturnType<typeof vi.fn>;
    resilier: ReturnType<typeof vi.fn>;
    resilierAbonnement: ReturnType<typeof vi.fn>;
  };
  let paroisseServiceMock: {
    getParoisses: ReturnType<typeof vi.fn>;
  };
  let produitServiceMock: {
    getProduits: ReturnType<typeof vi.fn>;
  };
  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockAbonnements: Abonnement[] = [
    {
      id: 1,
      uuid: 'uuid-1',
      reference: 'ABO-26-0001',
      paroisse_id: 'paroisse-1',
      paroisse_nom: 'Saint-Michel',
      paroisse_code: 'PSM',
      produit_code: 'CATHEO',
      produit_nom: 'CATHEO',
      formule_id: 10,
      formule_nom: 'CATHEO Standard',
      formule_code: 'CATHEO-STD',
      statut: 'actif',
      date_debut: '2026-01-01',
      date_fin: '2026-12-31',
      montant: 50000,
      devise: 'XOF',
      renouvellement_automatique: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 2,
      uuid: 'uuid-2',
      reference: 'ABO-26-0002',
      paroisse_id: 'paroisse-2',
      paroisse_nom: 'Sainte-Cécile',
      paroisse_code: 'PSC',
      produit_code: 'OPPE',
      produit_nom: 'OPPE',
      formule_id: 20,
      formule_nom: 'OPPE Découverte',
      formule_code: 'OPPE-FREE',
      statut: 'en_attente',
      date_debut: '2026-02-01',
      date_fin: '2027-01-31',
      montant: 0,
      devise: 'XOF',
      renouvellement_automatique: false,
      created_at: '2026-02-01',
      updated_at: '2026-02-01',
    },
  ];

  const mockResponse: AbonnementPaginatedResponse = {
    data: mockAbonnements,
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 15,
      to: 2,
      total: 2,
    },
    links: {
      first: '/first',
      last: '/last',
      prev: null,
      next: null,
    },
  };

  const mockParoisses: Paroisse[] = [
    {
      id: 'paroisse-1',
      id_interne: 1,
      code_paroisse: 'PSM',
      nom_paroisse: 'Saint-Michel',
      diocese: 'Abidjan',
      doyenne: 'Centre',
      telephone: '0102030405',
      email: 'psm@catheo.ci',
      statut: 'actif',
      ville: 'Abidjan',
      commune: 'Cocody',
      total_abonnements: 0,
      produits_souscrits: [],
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const mockProduits: Produit[] = [
    {
      id: 'prod-catheo',
      id_interne: 1,
      code: 'CATHEO',
      nom: 'CATHEO',
      description: null,
      icone: null,
      statut: 'actif',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  beforeEach(async () => {
    abonnementServiceMock = {
      getAbonnements: vi.fn().mockReturnValue(of(mockResponse)),
      changerStatut: vi.fn().mockReturnValue(of({ ...mockAbonnements[0], statut: 'suspendu' })),
      changeStatut: vi.fn().mockReturnValue(of({ ...mockAbonnements[0], statut: 'suspendu' })),
      resilier: vi.fn().mockReturnValue(of({ ...mockAbonnements[0], statut: 'resilie' })),
      resilierAbonnement: vi.fn().mockReturnValue(of({ ...mockAbonnements[0], statut: 'resilie' })),
    };

    paroisseServiceMock = {
      getParoisses: vi.fn().mockReturnValue(
        of({
          data: mockParoisses,
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        })
      ),
    };

    produitServiceMock = {
      getProduits: vi.fn().mockReturnValue(of(mockProduits)),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AbonnementsListPageComponent],
      providers: [
        provideRouter([]),
        { provide: AbonnementService, useValue: abonnementServiceMock },
        { provide: ParoisseService, useValue: paroisseServiceMock },
        { provide: ProduitService, useValue: produitServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AbonnementsListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait charger la liste des abonnements au démarrage', () => {
    expect(component).toBeTruthy();
    expect(abonnementServiceMock.getAbonnements).toHaveBeenCalled();
    expect(component['abonnements']().length).toBe(2);
    expect(component['paginationMeta']().total).toBe(2);
  });

  it('devrait filtrer par statut et déclencher une requête API avec le paramètre statut', () => {
    const event = { target: { value: 'actif' } } as unknown as Event;
    component['onStatutFilterChange'](event);
    expect(component['filterStatut']()).toBe('actif');
    expect(abonnementServiceMock.getAbonnements).toHaveBeenCalledWith(
      expect.objectContaining({ statut: 'actif', page: 1 })
    );
  });

  it('devrait filtrer par produit et déclencher une requête API avec le paramètre produit_id', () => {
    const event = { target: { value: 'prod-catheo' } } as unknown as Event;
    component['onProduitFilterChange'](event);
    expect(component['filterProduitId']()).toBe('prod-catheo');
    expect(abonnementServiceMock.getAbonnements).toHaveBeenCalledWith(
      expect.objectContaining({ produit_id: 'prod-catheo', page: 1 })
    );
  });

  it('devrait changer de page lors d’un événement de pagination', () => {
    component['onPageChange']({ page: 2, perPage: 15 });
    expect(abonnementServiceMock.getAbonnements).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, per_page: 15 })
    );
  });

  it('devrait exécuter le changement de statut via la boîte de dialogue', () => {
    component['promptStatusChange'](mockAbonnements[0], 'suspendu');
    expect(component['confirmDialogOpen']()).toBe(true);

    component['executeStatusChange']();
    expect(abonnementServiceMock.changerStatut).toHaveBeenCalledWith(1, { statut: 'suspendu' });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('devrait refuser la résiliation si le motif est vide et valider lorsqu’il est renseigné', () => {
    component['openResiliationModal'](mockAbonnements[0]);
    expect(component['resiliationModalOpen']()).toBe(true);

    // Motif vide
    component['motifResiliation'] = '   ';
    component['executeResiliation']();
    expect(component['resiliationError']()).toContain('obligatoire');
    expect(abonnementServiceMock.resilier).not.toHaveBeenCalled();

    // Motif valide
    component['motifResiliation'] = 'Résiliation contractuelle demandée.';
    component['executeResiliation']();
    expect(abonnementServiceMock.resilier).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        motif_resiliation: 'Résiliation contractuelle demandée.',
      })
    );
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('devrait afficher l’état d’erreur si l’API échoue', () => {
    abonnementServiceMock.getAbonnements.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    component.refresh();
    expect(component['hasError']()).toBe(true);
  });
});
