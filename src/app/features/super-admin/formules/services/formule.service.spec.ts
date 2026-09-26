import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormuleService } from './formule.service';
import { Formule, FormuleFormData } from '../models/formule.model';
import { API_BASE_URL } from '../../../../core/config/api.config';

describe('FormuleService', () => {
  let service: FormuleService;
  let httpMock: HttpTestingController;
  const mockApiUrl = 'http://localhost/api/v1';

  const mockFormules: Formule[] = [
    {
      id: 1,
      uuid: 'uuid-formule-1',
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'CATHEO-STANDARD',
      nom: 'Formule Standard Annuelle',
      description: 'Accès complet au module de catéchèse.',
      periodicite: 'annuelle',
      montant: 50000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      ordre: 1,
      produit: {
        id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
        code: 'CATHEO',
        nom: 'CATHEO',
      },
      created_at: '2026-09-18T14:06:44+00:00',
      updated_at: '2026-09-18T14:06:44+00:00',
    },
    {
      id: 2,
      uuid: 'uuid-formule-2',
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'CATHEO-DECOUVERTE',
      nom: 'Formule Découverte Gratuite',
      description: 'Accès d’essai sans frais.',
      periodicite: 'mensuelle',
      montant: 0,
      devise: 'XOF',
      est_gratuite: true,
      statut: 'actif',
      ordre: 2,
      produit: {
        id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
        code: 'CATHEO',
        nom: 'CATHEO',
      },
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
        FormuleService,
      ],
    });

    service = TestBed.inject(FormuleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get formules list with query filters', () => {
    service
      .getFormules({
        produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
        statut: 'actif',
        est_gratuite: true,
        page: 1,
        per_page: 15,
      })
      .subscribe((res) => {
        expect(res.data.length).toBe(2);
        expect(res.data[0].code).toBe('CATHEO-STANDARD');
        expect(res.meta.total).toBe(2);
      });

    const req = httpMock.expectOne(
      `${mockApiUrl}/super-admin/formules?produit_id=5d4abf19-4248-4aaf-b18b-63ac2df57d9c&statut=actif&est_gratuite=true&page=1&per_page=15`
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      data: mockFormules,
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
    });
  });

  it('should get single formule by id', () => {
    service.getFormule(1).subscribe((data) => {
      expect(data.nom).toBe('Formule Standard Annuelle');
      expect(data.code).toBe('CATHEO-STANDARD');
      expect(data.est_gratuite).toBe(false);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/formules/1`);
    expect(req.request.method).toBe('GET');

    req.flush({
      status: 'success',
      data: mockFormules[0],
    });
  });

  it('should create new formule', () => {
    const payload: FormuleFormData = {
      produit_id: '5d4abf19-4248-4aaf-b18b-63ac2df57d9c',
      code: 'CATHEO-NOUVELLE',
      nom: 'Nouvelle Formule',
      description: 'Description formule',
      periodicite: 'mensuelle',
      montant: 10000,
      devise: 'XOF',
      est_gratuite: false,
      statut: 'actif',
      ordre: 3,
    };

    service.createFormule(payload).subscribe((created) => {
      expect(created.code).toBe('CATHEO-NOUVELLE');
      expect(created.montant).toBe(10000);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/formules`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      status: 'success',
      data: { ...payload, id: 3, created_at: '', updated_at: '' },
    });
  });

  it('should update existing formule', () => {
    const updatePayload: Partial<FormuleFormData> = {
      montant: 60000,
      statut: 'inactif',
    };

    service.updateFormule(1, updatePayload).subscribe((updated) => {
      expect(updated.montant).toBe(60000);
      expect(updated.statut).toBe('inactif');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/formules/1`);
    expect(req.request.method).toBe('PUT');

    req.flush({
      status: 'success',
      data: { ...mockFormules[0], ...updatePayload },
    });
  });

  it('should toggle formule status', () => {
    service.toggleStatus(1).subscribe((res) => {
      expect(res.statut).toBe('inactif');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/formules/1/toggle-status`);
    expect(req.request.method).toBe('PATCH');

    req.flush({
      status: 'success',
      data: { ...mockFormules[0], statut: 'inactif' },
    });
  });

  it('should delete formule', () => {
    service.deleteFormule(1).subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne(`${mockApiUrl}/super-admin/formules/1`);
    expect(req.request.method).toBe('DELETE');

    req.flush({
      status: 'success',
      message: 'Formule supprimée avec succès.',
    });
  });
});
