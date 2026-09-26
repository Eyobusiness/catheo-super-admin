import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AbonnementDetailPageComponent } from './abonnement-detail-page.component';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Abonnement } from '../../models/abonnement.model';

describe('AbonnementDetailPageComponent', () => {
  let component: AbonnementDetailPageComponent;
  let fixture: ComponentFixture<AbonnementDetailPageComponent>;

  let abonnementServiceMock: {
    getAbonnement: ReturnType<typeof vi.fn>;
    changeStatut: ReturnType<typeof vi.fn>;
    resilierAbonnement: ReturnType<typeof vi.fn>;
  };

  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockDetailAbonnement: Abonnement = {
    id: 1,
    uuid: 'uuid-abo-1',
    reference: 'ABO-26-0001',
    paroisse_id: 'paroisse-1',
    formule_id: 10,
    statut: 'actif',
    date_debut: '2026-01-01',
    date_fin: '2026-12-31',
    montant: 50000,
    montant_total: 50000,
    devise: 'XOF',
    renouvellement_automatique: true,
    observation: 'Souscription test',
    date_resiliation: null,
    motif_resiliation: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    paroisse: {
      id: 'paroisse-1',
      nom_paroisse: 'Saint-Michel',
      code_paroisse: 'PSM',
      diocese: 'Abidjan',
    },
    formule: {
      id: 10,
      uuid: 'formule-10',
      produit_id: 'prod-catheo',
      code: 'CATHEO-STD',
      nom: 'CATHEO Standard',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      produit: { id: 'prod-catheo', code: 'CATHEO', nom: 'CATHEO' },
    },
    echeances: [
      {
        id: 101,
        reference: 'ECH-26-0001',
        abonnement_id: 1,
        periode_debut: '2026-01-01',
        periode_fin: '2026-12-31',
        date_echeance: '2026-01-15',
        montant: 50000,
        montant_paye: 0,
        solde_restant: 50000,
        devise: 'XOF',
        statut: 'en_attente',
        created_at: '2026-01-01',
      },
    ],
  };

  beforeEach(async () => {
    abonnementServiceMock = {
      getAbonnement: vi.fn().mockReturnValue(of(mockDetailAbonnement)),
      changeStatut: vi.fn().mockReturnValue(of({ ...mockDetailAbonnement, statut: 'suspendu' })),
      resilierAbonnement: vi.fn().mockReturnValue(of({ ...mockDetailAbonnement, statut: 'resilie' })),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AbonnementDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('1'),
              },
            },
          },
        },
        { provide: AbonnementService, useValue: abonnementServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AbonnementDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait charger et afficher les sections de détail au démarrage', () => {
    expect(component).toBeTruthy();
    expect(abonnementServiceMock.getAbonnement).toHaveBeenCalledWith('1');
    expect(component['abonnement']()).toEqual(mockDetailAbonnement);

    const compiled = fixture.nativeElement as HTMLElement;
    // Section 1 Identité
    expect(compiled.textContent).toContain('ABO-26-0001');
    expect(compiled.textContent).toContain('Saint-Michel');
    expect(compiled.textContent).toContain('CATHEO Standard');

    // Section 2 Conditions financières
    expect(compiled.textContent).toContain('XOF');
    expect(compiled.textContent).toContain('Snapshot du prix');

    // Section 3 Échéances
    expect(compiled.textContent).toContain('ECH-26-0001');
  });

  it('devrait permettre de suspendre un abonnement actif', () => {
    expect(component['canSuspendre']()).toBe(true);

    component.openConfirmStatut('suspendu');
    expect(component['isConfirmStatutOpen']()).toBe(true);

    component.executeStatutChange();
    expect(abonnementServiceMock.changeStatut).toHaveBeenCalledWith(1, 'suspendu');
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('devrait permettre la résiliation avec un motif', () => {
    expect(component['canResilier']()).toBe(true);

    component.openResilierModal();
    expect(component['isResilierModalOpen']()).toBe(true);

    component['motifResiliation'].set('Résiliation demandée');
    component.executeResiliation();

    expect(abonnementServiceMock.resilierAbonnement).toHaveBeenCalledWith(1, {
      motif_resiliation: 'Résiliation demandée',
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('devrait afficher une alerte si l’abonnement est résilié', () => {
    const resilieAbo: Abonnement = {
      ...mockDetailAbonnement,
      statut: 'resilie',
      motif_resiliation: 'Fin de contrat paroissial',
      date_resiliation: '2026-03-01T12:00:00Z',
    };
    abonnementServiceMock.getAbonnement.mockReturnValue(of(resilieAbo));

    component.loadAbonnement();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cet abonnement a été résilié');
    expect(compiled.textContent).toContain('Fin de contrat paroissial');
  });

  it('devrait afficher une erreur 404 appropriée si l’abonnement n’existe pas', () => {
    abonnementServiceMock.getAbonnement.mockReturnValue(
      throwError(() => ({ status: 404, message: 'Not found' }))
    );

    component.loadAbonnement();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(true);
    expect(component['errorTitle']()).toBe('Abonnement introuvable');
  });

  it('devrait afficher une erreur 403 si l’accès est refusé', () => {
    abonnementServiceMock.getAbonnement.mockReturnValue(
      throwError(() => ({ status: 403, message: 'Forbidden' }))
    );

    component.loadAbonnement();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(true);
    expect(component['errorTitle']()).toBe('Accès refusé');
  });
});
