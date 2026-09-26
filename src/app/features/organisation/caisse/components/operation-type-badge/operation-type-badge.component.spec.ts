import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperationTypeBadgeComponent } from './operation-type-badge.component';

describe('OperationTypeBadgeComponent', () => {
  let component: OperationTypeBadgeComponent;
  let fixture: ComponentFixture<OperationTypeBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationTypeBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationTypeBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('type', 'entree');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render "Entrée" with success variant for type "entree"', () => {
    fixture.componentRef.setInput('type', 'entree');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('Entrée');
    expect(config.variant).toBe('success');
    expect(config.icon).toBe('arrow-down-left');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Entrée');
  });

  it('should render "Sortie" with danger variant for type "sortie"', () => {
    fixture.componentRef.setInput('type', 'sortie');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('Sortie');
    expect(config.variant).toBe('danger');
    expect(config.icon).toBe('arrow-up-right');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sortie');
  });

  it('should fallback to neutral variant for unknown type', () => {
    fixture.componentRef.setInput('type', 'autre');
    fixture.detectChanges();

    const config = component.config();
    expect(config.label).toBe('autre');
    expect(config.variant).toBe('neutral');
  });
});
