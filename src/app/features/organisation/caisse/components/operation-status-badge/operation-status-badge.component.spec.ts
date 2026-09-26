import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationStatusBadgeComponent } from './operation-status-badge.component';

describe('OperationStatusBadgeComponent', () => {
  let component: OperationStatusBadgeComponent;
  let fixture: ComponentFixture<OperationStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('statut', 'valide');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render "Validé" with success variant for statut "valide"', () => {
    fixture.componentRef.setInput('statut', 'valide');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('Validé');
    expect(config.variant).toBe('success');
    expect(config.icon).toBe('check-circle');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Validé');
  });

  it('should render "Annulé" with danger variant for statut "annule"', () => {
    fixture.componentRef.setInput('statut', 'annule');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('Annulé');
    expect(config.variant).toBe('danger');
    expect(config.icon).toBe('x-circle');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Annulé');
  });

  it('should fallback to neutral variant for unknown statut', () => {
    fixture.componentRef.setInput('statut', 'suspendu');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('suspendu');
    expect(config.variant).toBe('neutral');
  });
});
