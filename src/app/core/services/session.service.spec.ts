import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { User } from '../models/auth.models';
import { OrganisationContext } from '../models/organisation.models';

describe('SessionService', () => {
  let service: SessionService;

  const mockUser: User = {
    id: '1',
    uuid: 'uuid-123',
    email: 'admin@catheo.ci',
    nom: 'Admin',
    prenoms: 'Super',
    user_type: 'super_admin',
    statut: 'actif',
    profil: {
      id: 1,
      code: 'SUPER_ADMIN',
      nom: 'Super Administrateur',
      permissions: ['*'],
    },
  };

  const mockOrg: OrganisationContext = {
    id: '10',
    id_interne: 10,
    code: 'OPPE-STE-FAMILLE',
    nom: 'Petite Enfance Sainte Famille',
    type_organisation: 'OPPE',
    statut: 'actif',
    produit_code: 'OPPE',
    produit_nom: 'Petite Enfance',
    paroisse: {
      id: 2,
      nom_paroisse: 'Paroisse Sainte Famille',
      code_paroisse: 'PAR-SF',
    },
    responsable: {},
    contact: {},
    stats: {
      total_membres: 0,
      membres_actifs: 0,
      total_activites: 0,
      total_users: 0,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
    service.clearSession();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and initially unauthenticated', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should correctly set session and update signals', () => {
    service.setSession('test-token-xyz', mockUser, ['menu1'], mockOrg);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('test-token-xyz');
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.currentOrganisation()).toEqual(mockOrg);
    expect(service.isSuperAdmin()).toBe(true);
    expect(service.organisationType()).toBe('OPPE');
  });

  it('should update user independently', () => {
    service.setSession('test-token-xyz', mockUser);
    const updatedUser = { ...mockUser, nom: 'Nouveau Nom' };
    service.updateUser(updatedUser);

    expect(service.currentUser()?.nom).toBe('Nouveau Nom');
  });

  it('should clear session completely', () => {
    service.setSession('test-token-xyz', mockUser, [], mockOrg);
    expect(service.isAuthenticated()).toBe(true);

    service.clearSession();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.currentOrganisation()).toBeNull();
    expect(service.accessibleMenus()).toEqual([]);
  });
});
