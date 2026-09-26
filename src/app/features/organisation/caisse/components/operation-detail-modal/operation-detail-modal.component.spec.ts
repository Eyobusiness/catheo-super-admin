import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationDetailModalComponent } from './operation-detail-modal.component';
import { OperationCaisse } from '../../models/caisse.model';
import { formatCfa } from '../../../../../shared/utils/format.utils';

describe('OperationDetailModalComponent', () => {
  let component: OperationDetailModalComponent;
  let fixture: ComponentFixture<OperationDetailModalComponent>;

  const mockOperation: OperationCaisse = {
    id: 1,
    uuid: 'op-123',
    organisation_id: 2,
    reference: 'OP-ORG-2026-0001',
    type_operation: 'entree',
    montant: 25000,
    devise: 'XOF',
    libelle: 'Paiement pèlerinage [Koffi Jean] - Ref: PAY-2026-0001',
    mode_reglement: 'especes',
    date_operation: '2026-09-23T10:15:00Z',
    statut: 'valide',
    operateur: { id: 5, name: 'Trésorier OPPE' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('operation', mockOperation);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display operation reference, amount, libelle and operator', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('operation', mockOperation);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('OP-ORG-2026-0001');
    expect(compiled.textContent).toContain(formatCfa(25000));
    expect(compiled.textContent).toContain('Paiement pèlerinage [Koffi Jean]');
    expect(compiled.textContent).toContain('Trésorier OPPE');
  });

  it('should emit close event when onClose is called', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should trigger window.print when printReceipt is called', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printReceipt();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
