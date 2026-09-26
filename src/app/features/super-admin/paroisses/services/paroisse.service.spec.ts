import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ParoisseService } from './paroisse.service';
import { Paroisse, ParoisseDetail } from '../models/paroisse.model';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('ParoisseService', () => {
  let service: ParoisseService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'http://localhost/api/v1';

  const mockParoisses: Paroisse[] = [
    {
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
      statut: 'actif',
      total_abonnements: 2,
      produits_souscrits: [
        {
          produit_code: 'CATHEO_PASTORALE',
          produit_nom: 'CATHEO PASTORALE',
          formule_nom: 'Annuelle',
          date_fin: '2027-09-18',
        },
      ],
      created_at: '2026-09-10T19:26:10+00:00',
    },
    {
      id: 'uuid-2',
      id_interne: 2,
      nom_paroisse: 'Sainte Monique',
      code_paroisse: 'SM-01',
      diocese: 'Archidiocèse d\'Abidjan',
      doyenne: 'Père Jacques Nomel',
      ville: 'Abidjan',
      commune: 'Plateau Dokui',
      telephone: null,
      email: null,
      statut: 'suspendu',
      total_abonnements: 0,
      produits_souscrits: [],
      created_at: '2026-08-30T14:56:17+00:00',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockApiUrl },
        ParoisseService,
      ],
    });

    service = TestBed.inject(ParoisseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get paroisses list with pagination and query filters', () => {
    service
      .getParoisses({ search: 'Coeur', statut: 'actif', page: 1, per_page: 15 })
      .subscribe((res) => {
        expect(res.data.length).toBe(2);
        expect(res.data[0].nom_paroisse).toBe('Coeur Immaculé de Marie');
        expect(res.meta.total).toBe(2);
      });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/paroisses?search=Coeur&statut=actif&page=1&per_page=15`
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      data: mockParoisses,
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
    });
  });

  it('should get single paroisse by id', () => {
    service.getParoisse('uuid-1').subscribe((data) => {
      expect(data.nom_paroisse).toBe('Coeur Immaculé de Marie');
      expect(data.code_paroisse).toBe('CIM-01');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/paroisses/uuid-1`);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: mockParoisses[0],
    });
  });

  it('should get detailed paroisse merging supervision and configuration data', () => {
    service.getParoisseDetail('uuid-1').subscribe((detail: ParoisseDetail) => {
      expect(detail.nom_paroisse).toBe('Coeur Immaculé de Marie');
      expect(detail.prefixe_matricule).toBe('CIM');
      expect(detail.prefixe_recu).toBe('REC');
      expect(detail.cure_nom).toBe('Père Patrice BOHUI');
      expect(detail.logo_paroisse_url).toBe('http://localhost/logo.jpg');
    });

    const reqSuper = httpMock.expectOne(`${mockApiUrl}/super-admin/paroisses/uuid-1`);
    expect(reqSuper.request.method).toBe('GET');
    reqSuper.flush({
      status: 'success',
      data: mockParoisses[0],
    });

    const reqConfig = httpMock.expectOne(
      `${mockApiUrl}/paroisse-configuration?paroisse_id=uuid-1`
    );
    expect(reqConfig.request.method).toBe('GET');
    reqConfig.flush({
      status: 'success',
      data: {
        prefixe_matricule: 'CIM',
        prefixe_recu: 'REC',
        cure_nom: 'Père Patrice BOHUI',
        coordination_nom: 'Coordination Pastorale',
        logo_paroisse_url: 'http://localhost/logo.jpg',
      },
    });
  });

  it('should update parish via POST /api/v1/paroisse-configuration', () => {
    service
      .updateParoisse('uuid-1', { nom_paroisse: 'Nouveau Nom', statut: 'actif' })
      .subscribe((res) => {
        expect(res).toBeTruthy();
      });

    const req = httpMock.expectOne(`${mockApiUrl}/paroisse-configuration`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nom_paroisse: 'Nouveau Nom',
      statut: 'actif',
      paroisse_id: 'uuid-1',
    });

    req.flush({
      status: 'success',
      message: 'Configuration mise à jour avec succès.',
      data: { id: 'uuid-1', nom_paroisse: 'Nouveau Nom' },
    });
  });

  it('should change parish status', () => {
    service.changeStatus('uuid-1', 'suspendu').subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/paroisse-configuration`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.statut).toBe('suspendu');
    expect(req.request.body.paroisse_id).toBe('uuid-1');

    req.flush({
      status: 'success',
      data: { id: 'uuid-1', statut: 'suspendu' },
    });
  });
});
