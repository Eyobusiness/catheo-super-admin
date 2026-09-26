import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PaiementDetailModalComponent } from './paiement-detail-modal.component';
import { CaisseService } from '../../services/caisse.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { formatCfa } from '../../../../../shared/utils/format.utils';

describe('PaiementDetailModalComponent', () => {
  let component: PaiementDetailModalComponent;
  let fixture: ComponentFixture<PaiementDetailModalComponent>;
  let caisseServiceSpy: {
    getPaiementsInscription: ReturnType<typeof vi.fn>;
    enregistrerPaiement: ReturnType<typeof vi.fn>;
    annulerPaiement: ReturnType<typeof vi.fn>;
  };
  let permissionServiceSpy: {
    hasPermission: ReturnType<typeof vi.fn>;
  };
  let toastServiceSpy: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockInscription = {
    id: 10,
    uuid: 'insc-10',
    reference: 'INSC-2026-0010',
    nom_complet: 'Koffi Jean-Eudes',
    montant: 30000,
  };

  const mockPaiement = {
    id: 1,
    uuid: 'pay-1',
    reference: 'PAY-2026-0001',
    montant: 15000,
    mode_paiement: 'especes',
    date_paiement: '2026-09-10',
    statut: 'valide',
    caissier: { name: 'Trésorier OPPE' },
    observation: 'Acompte',
  };

  beforeEach(async () => {
    caisseServiceSpy = {
      getPaiementsInscription: vi.fn().mockReturnValue(
        of({
          status: 'success',
          data: [mockPaiement],
          meta: {
            montant_total: 30000,
            montant_paye: 15000,
            reste_a_payer: 15000,
            statut: 'partiellement_payee',
          },
        })
      ),
      enregistrerPaiement: vi.fn().mockReturnValue(
        of({
          paiement: { id: 2, reference: 'PAY-2026-0002', montant: 15000 },
          inscription: { id: 10, reste_a_payer: 0 },
        })
      ),
      annulerPaiement: vi.fn().mockReturnValue(
        of({
          paiement: { id: 1, statut: 'annule' },
          inscription: { id: 10, reste_a_payer: 30000 },
        })
      ),
    };

    permissionServiceSpy = {
      hasPermission: vi.fn().mockReturnValue(true),
    };

    toastServiceSpy = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaiementDetailModalComponent],
      providers: [
        { provide: CaisseService, useValue: caisseServiceSpy },
        { provide: PermissionService, useValue: permissionServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should create and load payments when opened', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('campagneId', 1);
    fixture.componentRef.setInput('campagneNom', 'Pèlerinage Yamoussoukro');
    fixture.componentRef.setInput('inscription', mockInscription);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(caisseServiceSpy.getPaiementsInscription).toHaveBeenCalledWith(1, 10);
    expect(component.paiements().length).toBe(1);
    expect(component.montantTotal()).toBe(30000);
    expect(component.montantPaye()).toBe(15000);
    expect(component.resteAPayer()).toBe(15000);
  });

  it('should display participant name and financial summary', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('campagneId', 1);
    fixture.componentRef.setInput('campagneNom', 'Pèlerinage Yamoussoukro');
    fixture.componentRef.setInput('inscription', mockInscription);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Koffi Jean-Eudes');
    expect(compiled.textContent).toContain('INSC-2026-0010');
    expect(compiled.textContent).toContain(formatCfa(30000));
    expect(compiled.textContent).toContain(formatCfa(15000));
  });

  it('should open new payment form and validate payment amount against reste_a_payer', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('campagneId', 1);
    fixture.componentRef.setInput('inscription', mockInscription);
    fixture.detectChanges();

    component.openNewPaymentForm();
    expect(component.showNewPaymentForm()).toBe(true);

    component.paymentForm.patchValue({
      montant: 20000, // strictly greater than resteAPayer = 15000
      mode_paiement: 'especes',
    });

    component.submitPayment();
    expect(component.formError()).toContain('ne peut pas dépasser le reste à payer');
    expect(caisseServiceSpy.enregistrerPaiement).not.toHaveBeenCalled();
  });

  it('should submit valid new payment and emit paymentChanged', () => {
    const paymentChangedSpy = vi.fn();
    component.paymentChanged.subscribe(paymentChangedSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('campagneId', 1);
    fixture.componentRef.setInput('inscription', mockInscription);
    fixture.detectChanges();

    component.openNewPaymentForm();
    component.paymentForm.patchValue({
      montant: 15000,
      mode_paiement: 'especes',
      date_paiement: '2026-09-23',
    });

    component.submitPayment();
    expect(caisseServiceSpy.enregistrerPaiement).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(paymentChangedSpy).toHaveBeenCalled();
  });

  it('should prompt cancellation and cancel payment successfully', () => {
    const paymentChangedSpy = vi.fn();
    component.paymentChanged.subscribe(paymentChangedSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('campagneId', 1);
    fixture.componentRef.setInput('inscription', mockInscription);
    fixture.detectChanges();

    component.promptCancel(mockPaiement);
    expect(component.showCancelDialog()).toBe(true);
    expect(component.selectedPaymentToCancel()).toEqual(mockPaiement);

    component.confirmCancelPayment();
    expect(caisseServiceSpy.annulerPaiement).toHaveBeenCalledWith(1, 1, 'Annulé par le trésorier');
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(paymentChangedSpy).toHaveBeenCalled();
  });

  it('should trigger window.print when printQuittance is called', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printQuittance();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
