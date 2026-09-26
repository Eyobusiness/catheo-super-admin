import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProduitService } from './produit.service';
import { Produit, ProduitFormData } from '../models/produit.model';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('ProduitService', () => {
  let service: ProduitService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'http://localhost/api/v1';

  const mockProduits: Produit[] = [
    {
      id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      id_interne: 1,
      code: 'CATHEO',
      nom: 'CATHEO',
      description: 'Gestion de la catéchèse paroissiale.',
      icone: 'book-open',
      statut: 'actif',
      formules_count: 2,
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
    {
      id: 'c6cc2b89-3f3e-48e1-b7a9-b29264b300a3',
      id_interne: 2,
      code: 'OPPE',
      nom: 'OPPE',
      description: 'Office Paroissial de la Pastorale des Enfants.',
      icone: 'smile',
      statut: 'inactif',
      formules_count: 0,
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockApiUrl },
        ProduitService,
      ],
    });

    service = TestBed.inject(ProduitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get produits list with pagination and query filters', () => {
    service
      .getProduits({ search: 'CATHEO', statut: 'actif', page: 1, per_page: 15 })
      .subscribe((res) => {
        expect(res.data.length).toBe(2);
        expect(res.data[0].code).toBe('CATHEO');
        expect(res.meta.total).toBe(2);
      });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/produits?search=CATHEO&statut=actif&page=1&per_page=15`
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      data: mockProduits,
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
    });
  });

  it('should get single produit by id or uuid', () => {
    service.getProduit('5d4abf19-4248-4aaf-b18b-63ac2df57d9c').subscribe((data) => {
      expect(data.nom).toBe('CATHEO');
      expect(data.code).toBe('CATHEO');
    });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/produits/5d4abf19-4248-4aaf-b18b-63ac2df57d9c`
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      data: mockProduits[0],
    });
  });

  it('should create new produit', () => {
    const payload: ProduitFormData = {
      code: 'NOUVEAU',
      nom: 'Nouveau Module',
      description: 'Test description',
      icone: 'box',
      statut: 'actif',
    };

    service.createProduit(payload).subscribe((created) => {
      expect(created.code).toBe('NOUVEAU');
      expect(created.nom).toBe('Nouveau Module');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/produits`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      status: 'success',
      data: { ...payload, id: 'uuid-new', id_interne: 99, created_at: '', updated_at: '' },
    });
  });

  it('should update existing produit', () => {
    const updatePayload: Partial<ProduitFormData> = {
      nom: 'CATHEO Plus',
      statut: 'inactif',
    };

    service
      .updateProduit('5d4abf19-4248-4aaf-b18b-63ac2df57d9c', updatePayload)
      .subscribe((updated) => {
        expect(updated.nom).toBe('CATHEO Plus');
        expect(updated.statut).toBe('inactif');
      });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/produits/5d4abf19-4248-4aaf-b18b-63ac2df57d9c`
    );
    expect(req.request.method).toBe('PUT');

    req.flush({
      status: 'success',
      data: { ...mockProduits[0], ...updatePayload },
    });
  });

  it('should toggle produit status', () => {
    service.toggleStatus('5d4abf19-4248-4aaf-b18b-63ac2df57d9c').subscribe((res) => {
      expect(res.statut).toBe('inactif');
    });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/produits/5d4abf19-4248-4aaf-b18b-63ac2df57d9c/toggle-status`
    );
    expect(req.request.method).toBe('PATCH');

    req.flush({
      status: 'success',
      data: { ...mockProduits[0], statut: 'inactif' },
    });
  });
});
