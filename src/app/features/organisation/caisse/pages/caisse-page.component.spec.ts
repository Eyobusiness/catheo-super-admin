import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CaissePageComponent } from './caisse-page.component';
import { CaisseService } from '../services/caisse.service';
import { OrganisationContextService } from '../../../../core/services/organisation-context.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiClient } from '../../../../core/services/api-client.service';
import { CaisseResponse } from '../models/caisse.model';
import { formatCfa } from '../../../../shared/utils/format.utils';

describe('CaissePageComponent', () => {
  let component: CaissePageComponent;
  let fixture: ComponentFixture<CaissePageComponent>;

  let caisseServiceSpy: {
    getEtatCaisse: ReturnType<typeof vi.fn>;
    getCampagnes: ReturnType<typeof vi.fn>;
    getPaiementsCampagne: ReturnType<typeof vi.fn>;
    getPaiementsInscription: ReturnType<typeof vi.fn>;
    enregistrerPaiement: ReturnType<typeof vi.fn>;
    annulerPaiement: ReturnType<typeof vi.fn>;
  };

  let orgContextSpy: {
    currentOrganisation: ReturnType<typeof vi.fn>;
    typeOrganisation: ReturnType<typeof vi.fn>;
  };

  let permissionServiceSpy: {
    hasPermission: ReturnType<typeof vi.fn>;
  };

  let toastServiceSpy: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  let apiClientSpy: {
    downloadBlob: ReturnType<typeof vi.fn>;
  };

  const mockSynthese = {
    periode_debut: '2026-09-01',
    periode_fin: '2026-09-30',
    solde_initial: 50000,
    total_entrees: 250000,
    total_sorties: 20000,
    solde_periode: 230000,
    solde_final: 280000,
    nombre_operations: 12,
  };

  const mockOperations = [
    {
      id: 1,
      uuid: 'op-1',
      organisation_id: 2,
      reference: 'OP-ORG-2026-0001',
      type_operation: 'entree' as const,
      montant: 25000,
      devise: 'XOF',
      libelle: 'Paiement pèlerinage [Koffi Jean]',
      mode_reglement: 'especes',
      date_operation: '2026-09-23T10:00:00Z',
      statut: 'valide' as const,
      operateur: { id: 5, name: 'Trésorier OPPE' },
    },
    {
      id: 2,
      uuid: 'op-2',
      organisation_id: 2,
      reference: 'OP-ORG-2026-0002',
      type_operation: 'sortie' as const,
      montant: 5000,
      devise: 'XOF',
      libelle: 'Achat fournitures kit',
      mode_reglement: 'especes',
      date_operation: '2026-09-23T11:00:00Z',
      statut: 'valide' as const,
      operateur: { id: 5, name: 'Trésorier OPPE' },
    },
  ];

  const mockCaisseResponse: CaisseResponse = {
    status: 'success',
    message: 'État de caisse récupéré avec succès.',
    synthese: mockSynthese,
    data: mockOperations,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 25,
      total: 2,
    },
  };

  const mockCampagnes = [
    { id: 1, nom: 'Pèlerinage Yamoussoukro 2026' },
    { id: 2, nom: 'Pèlerinage Kiri 2026' },
  ];

  const mockPaiements: any[] = [
    {
      id: 10,
      uuid: 'pay-10',
      inscription_pelerinage_id: 4,
      reference: 'PAY-2026-0010',
      montant: 25000,
      devise: 'XOF',
      mode_paiement: 'especes',
      date_paiement: '2026-09-23',
      statut: 'valide',
      inscription: {
        id: 4,
        nom_complet: 'Koffi Jean',
        reference: 'INSC-2026-0004',
      },
      caissier: { id: 1, name: 'Trésorier OPPE', email: 'tresorier@oppe.ci' },
    },
  ];

  beforeEach(async () => {
    caisseServiceSpy = {
      getEtatCaisse: vi.fn().mockReturnValue(of(mockCaisseResponse)),
      getCampagnes: vi.fn().mockReturnValue(of(mockCampagnes)),
      getPaiementsCampagne: vi.fn().mockReturnValue(
        of({
          data: mockPaiements,
          meta: { current_page: 1, total: 1 },
        })
      ),
      getPaiementsInscription: vi.fn().mockReturnValue(
        of({
          status: 'success',
          data: mockPaiements,
          meta: {
            montant_total: 25000,
            montant_paye: 25000,
            reste_a_payer: 0,
            statut: 'payee',
          },
        })
      ),
      enregistrerPaiement: vi.fn().mockReturnValue(of({})),
      annulerPaiement: vi.fn().mockReturnValue(of({})),
    };

    orgContextSpy = {
      currentOrganisation: vi.fn().mockReturnValue({ id: 2, type: 'OPPE', nom: 'OPPE Abidjan' }),
      typeOrganisation: vi.fn().mockReturnValue('OPPE'),
    };

    permissionServiceSpy = {
      hasPermission: vi.fn().mockReturnValue(true),
    };

    toastServiceSpy = {
      success: vi.fn(),
      error: vi.fn(),
    };

    apiClientSpy = {
      downloadBlob: vi.fn().mockReturnValue(of(new Blob(['csv content']))),
    };

    await TestBed.configureTestingModule({
      imports: [CaissePageComponent],
      providers: [
        { provide: CaisseService, useValue: caisseServiceSpy },
        { provide: OrganisationContextService, useValue: orgContextSpy },
        { provide: PermissionService, useValue: permissionServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CaissePageComponent);
    component = fixture.componentInstance;
  });

  it('should create and load initial caisse data and campaigns', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(caisseServiceSpy.getCampagnes).toHaveBeenCalled();
    expect(caisseServiceSpy.getEtatCaisse).toHaveBeenCalled();
    expect(component.synthese().solde_final).toBe(280000);
    expect(component.operations().length).toBe(2);
  });

  it('should render correct real statistics in KPI cards', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(formatCfa(280000)); // Solde final
    expect(compiled.textContent).toContain(formatCfa(250000)); // Entrées
    expect(compiled.textContent).toContain(formatCfa(20000));  // Sorties
    expect(compiled.textContent).toContain('12');              // Nombre opérations
  });

  it('should display operations in table with correct formatters', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('OP-ORG-2026-0001');
    expect(compiled.textContent).toContain('+ ' + formatCfa(25000));
    expect(compiled.textContent).toContain('Paiement pèlerinage [Koffi Jean]');
    expect(compiled.textContent).toContain('OP-ORG-2026-0002');
    expect(compiled.textContent).toContain('- ' + formatCfa(5000));
    expect(compiled.textContent).toContain('Achat fournitures kit');
  });

  it('should switch tabs between journal and pelerinages', () => {
    fixture.detectChanges();

    expect(component.activeTab()).toBe('journal');

    component.setActiveTab('pelerinages');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('pelerinages');
    expect(caisseServiceSpy.getPaiementsCampagne).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('should update filters and reload caisse on search or filter change', () => {
    fixture.detectChanges();

    component.onSearchChangeJournal('Koffi');
    expect(component.searchJournal()).toBe('Koffi');
    expect(component.currentPageJournal()).toBe(1);
    expect(caisseServiceSpy.getEtatCaisse).toHaveBeenCalledTimes(2);

    const typeEvent = { target: { value: 'entree' } } as any;
    component.onTypeOperationChange(typeEvent);
    expect(component.selectedTypeOperation()).toBe('entree');
    expect(caisseServiceSpy.getEtatCaisse).toHaveBeenCalledTimes(3);

    component.onResetFiltersJournal();
    expect(component.searchJournal()).toBe('');
    expect(component.selectedTypeOperation()).toBe('tous');
  });

  it('should handle pagination changes', () => {
    fixture.detectChanges();

    component.onPageChangeJournal({ page: 2, perPage: 10 });
    expect(component.currentPageJournal()).toBe(2);
    expect(component.perPageJournal()).toBe(10);
    expect(caisseServiceSpy.getEtatCaisse).toHaveBeenCalledTimes(2);
  });

  it('should display error state when getEtatCaisse fails', () => {
    caisseServiceSpy.getEtatCaisse.mockReturnValue(
      throwError(() => ({ error: { message: 'Erreur réseau 500' } }))
    );

    component.loadCaisse();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Erreur réseau 500');
    expect(component.isLoading()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Erreur lors de la récupération de la caisse');
  });

  it('should open operation detail modal when selected', () => {
    fixture.detectChanges();

    const op = mockOperations[0];
    component.openOperationDetail(op);

    expect(component.showOpDetailModal()).toBe(true);
    expect(component.selectedOperation()).toEqual(op);
  });

  it('should open paiement detail modal when selected from pelerinages tab', () => {
    fixture.detectChanges();
    component.setActiveTab('pelerinages');
    fixture.detectChanges();

    const p = mockPaiements[0];
    component.openPaiementDetail(p);

    expect(component.showPaiementModal()).toBe(true);
    expect(component.selectedInscriptionForModal()).toEqual(p.inscription);
  });

  it('should export caisse CSV when exportCaisse is triggered', () => {
    fixture.detectChanges();

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/123');
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    component.exportCaisse();

    expect(apiClientSpy.downloadBlob).toHaveBeenCalledWith('organisation/exports/caisse');
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Export réussi', expect.any(String));
  });
});
