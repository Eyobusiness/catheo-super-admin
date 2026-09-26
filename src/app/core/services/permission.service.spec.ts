import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import { SessionService } from './session.service';
import { User } from '../models/auth.models';
import { OrganisationContext } from '../models/organisation.models';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let sessionService: SessionService;

  const superAdminUser: User = {
    id: '1',
    uuid: 'uuid-1',
    email: 'admin@catheo.ci',
    user_type: 'super_admin',
    statut: 'actif',
    profil: {
      id: 1,
      code: 'SUPER_ADMIN',
      nom: 'Super Admin',
      permissions: ['*'],
    },
  };

  const oppeResponsableUser: User = {
    id: '2',
    uuid: 'uuid-2',
    email: 'oppe@catheo.ci',
    organisation_id: 10,
    user_type: 'organisation_user',
    statut: 'actif',
    profil: {
      id: 2,
      code: 'RESPONSABLE_OPPE',
      nom: 'Responsable OPPE',
      permissions: [
        'organisation.view',
        'organisation.edit',
        'membres.view',
        'membres.manage',
        'activites.view',
        'activites.create',
        'catheo.population.view',
        'caisse.read',
      ],
    },
  };

  const oppeOrg: OrganisationContext = {
    id: '10',
    id_interne: 10,
    code: 'OPPE-01',
    nom: 'OPPE Paroisse',
    type_organisation: 'OPPE',
    statut: 'actif',
    produit_code: 'OPPE',
    produit_nom: 'Petite Enfance',
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
    permissionService = TestBed.inject(PermissionService);
    sessionService = TestBed.inject(SessionService);
    sessionService.clearSession();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should grant all permissions to Super Admin', () => {
    sessionService.setSession('token', superAdminUser);

    expect(permissionService.isSuperAdmin()).toBe(true);
    expect(permissionService.hasPermission('any.random.permission')).toBe(true);
    expect(permissionService.hasPermission('caisse.read')).toBe(true);
    expect(permissionService.hasAnyPermission(['a', 'b'])).toBe(true);
    expect(permissionService.canAccessSection('SEC-ENFANTS-PRI')).toBe(true);
  });

  it('should respect fine-grained permissions for organisation user', () => {
    sessionService.setSession('token', oppeResponsableUser, [], oppeOrg);

    expect(permissionService.isSuperAdmin()).toBe(false);
    expect(permissionService.isResponsable()).toBe(true);
    expect(permissionService.hasPermission('membres.view')).toBe(true);
    expect(permissionService.hasPermission('membres.manage')).toBe(true);
    expect(permissionService.hasPermission('unknown.permission')).toBe(false);
  });

  it('should correctly enforce section access according to organisation type', () => {
    sessionService.setSession('token', oppeResponsableUser, [], oppeOrg);

    // OPPE is allowed SEC-ENFANTS-PRI and SEC-ENFANTS-COL
    expect(permissionService.canAccessSection('SEC-ENFANTS-PRI')).toBe(true);
    expect(permissionService.canAccessSection('SEC-ENFANTS-COL')).toBe(true);
    // OPPE is NOT allowed SEC-JEUNES or SEC-ADULTES
    expect(permissionService.canAccessSection('SEC-JEUNES')).toBe(false);
    expect(permissionService.canAccessSection('SEC-ADULTES')).toBe(false);
  });
});
