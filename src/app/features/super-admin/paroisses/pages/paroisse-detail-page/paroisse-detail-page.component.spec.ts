import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ParoisseDetailPageComponent } from './paroisse-detail-page.component';
import { ParoisseService } from '../../services/paroisse.service';
import { ParoisseDetail } from '../../models/paroisse.model';

describe('ParoisseDetailPageComponent', () => {
  let component: ParoisseDetailPageComponent;
  let fixture: ComponentFixture<ParoisseDetailPageComponent>;
  let paroisseServiceMock: {
    getParoisseDetail: ReturnType<typeof vi.fn>;
  };

  const mockDetail: ParoisseDetail = {
    id: 'uuid-1',
    id_interne: 1,
    nom_paroisse: 'Coeur Immaculé de Marie',
    code_paroisse: 'CIM-01',
    diocese: 'Archidiocèse d\'Abidjan',
    doyenne: 'Père Jacques Nomel',
    ville: 'Abidjan',
    commune: 'Plateau Dokui',
    telephone: '0102030405',
    email: 'cim@catheo.ci',
    site_web: 'https://cim.ci',
    adresse: 'Cité Forest',
    prefixe_matricule: 'CIM',
    prefixe_recu: 'REC',
    cure_nom: 'Père Patrice BOHUI',
    coordination_nom: 'Coordination Catéchèse',
    logo_paroisse_url: 'http://localhost/logo-paroisse.jpg',
    logo_catechese_url: 'http://localhost/logo-catechese.jpg',
    statut: 'actif',
    total_abonnements: 1,
    produits_souscrits: [
      {
        produit_code: 'CATHEO_PASTORALE',
        produit_nom: 'CATHEO PASTORALE',
        formule_nom: 'Annuelle',
        date_fin: '2027-09-18',
      },
    ],
    created_at: '2026-09-10T19:26:10+00:00',
  };

  beforeEach(async () => {
    paroisseServiceMock = {
      getParoisseDetail: vi.fn().mockReturnValue(of(mockDetail)),
    };

    await TestBed.configureTestingModule({
      imports: [ParoisseDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'uuid-1' : null),
              },
            },
          },
        },
        { provide: ParoisseService, useValue: paroisseServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoisseDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('should create and load parish detail on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(paroisseServiceMock.getParoisseDetail).toHaveBeenCalledWith('uuid-1');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Coeur Immaculé de Marie');
    expect(compiled.textContent).toContain('CIM-01');
    expect(compiled.textContent).toContain('Père Patrice BOHUI');
    expect(compiled.textContent).toContain('CATHEO PASTORALE');
  });

  it('should show error state if service call fails', () => {
    paroisseServiceMock.getParoisseDetail.mockReturnValue(
      throwError(() => new Error('Paroisse introuvable'))
    );

    component.loadData();
    fixture.detectChanges();

    expect(component['hasError']()).toBe(true);
    expect(component['errorMessage']()).toContain('Paroisse introuvable');
  });
});
