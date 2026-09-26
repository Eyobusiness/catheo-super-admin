import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Router, provideRouter } from '@angular/router';
import { AbonnementCreatePageComponent } from './abonnement-create-page.component';
import { AbonnementService } from '../../services/abonnement.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ParoisseService } from '../../../paroisses/services/paroisse.service';
import { FormuleService } from '../../../formules/services/formule.service';
import { Abonnement, AbonnementFormData } from '../../models/abonnement.model';

describe('AbonnementCreatePageComponent', () => {
  let component: AbonnementCreatePageComponent;
  let fixture: ComponentFixture<AbonnementCreatePageComponent>;

  let abonnementServiceMock: {
    createAbonnement: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };
  let toastMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const createdAbonnement: Abonnement = {
    id: 99,
    uuid: 'uuid-new',
    reference: 'ABO-26-0099',
    paroisse_id: 'paroisse-1',
    formule_id: 10,
    statut: 'en_attente',
    date_debut: '2026-03-01',
    date_fin: '2027-02-28',
    montant: 50000,
    montant_total: 50000,
    devise: 'XOF',
    renouvellement_automatique: true,
    observation: null,
    date_resiliation: null,
    motif_resiliation: null,
    created_at: '2026-03-01',
    updated_at: '2026-03-01',
    echeances: [],
  };

  beforeEach(async () => {
    abonnementServiceMock = {
      createAbonnement: vi.fn().mockReturnValue(of(createdAbonnement)),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AbonnementCreatePageComponent],
      providers: [
        provideRouter([]),
        { provide: AbonnementService, useValue: abonnementServiceMock },
        { provide: ToastService, useValue: toastMock },
        {
          provide: ParoisseService,
          useValue: {
            getParoisses: vi.fn().mockReturnValue(of({ data: [], meta: {} })),
          },
        },
        {
          provide: FormuleService,
          useValue: {
            getFormules: vi.fn().mockReturnValue(of({ data: [], meta: {} })),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    routerMock = router as any;

    fixture = TestBed.createComponent(AbonnementCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler createAbonnement, afficher un toast et rediriger au détail en cas de succès', () => {
    const formData: AbonnementFormData = {
      paroisse_configuration_id: 'paroisse-1',
      formule_id: 10,
      date_debut: '2026-03-01',
      date_fin: '2027-02-28',
      renouvellement_automatique: true,
    };

    component.onSubmit(formData);

    expect(abonnementServiceMock.createAbonnement).toHaveBeenCalledWith(formData);
    expect(toastMock.success).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/super-admin/abonnements', 99]);
  });

  it('devrait gérer l’erreur 422 en transmettant les erreurs de validation aux champs', () => {
    const errorResponse = {
      status: 422,
      error: {
        errors: {
          paroisse_configuration_id: ['Cette paroisse a déjà un abonnement actif pour ce produit.'],
        },
      },
    };
    abonnementServiceMock.createAbonnement.mockReturnValue(throwError(() => errorResponse));

    component.onSubmit({
      paroisse_configuration_id: 'paroisse-1',
      formule_id: 10,
      date_debut: '2026-03-01',
    });

    expect(component['serverErrors']()).toEqual(errorResponse.error.errors);
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('devrait rediriger vers la liste en cas d’annulation', () => {
    component.onCancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/super-admin/abonnements']);
  });
});
