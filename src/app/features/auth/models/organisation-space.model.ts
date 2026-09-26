/**
 * Typage et configuration des espaces organisationnels de la plateforme Cathéo.
 * Conforme aux spécifications Étape F4.
 */

export type OrganisationSpace = 'OPPE' | 'OPPJ' | 'OPPA';

export interface OrganisationSpaceConfig {
  code: OrganisationSpace;
  label: string;
  fullLabel: string;
  description: string;
  populationCodes: string[];
  isAvailable: boolean;
  badgeText?: string;
  icon: string;
}

export const ORGANISATION_SPACES: Record<OrganisationSpace, OrganisationSpaceConfig> = {
  OPPE: {
    code: 'OPPE',
    label: 'OPPE',
    fullLabel: 'Office Paroissial de la Pastorale des Enfants',
    description: 'Catéchèse des enfants, écoles primaires et collèges.',
    populationCodes: ['SEC-ENFANTS-PRI', 'SEC-ENFANTS-COL'],
    isAvailable: true,
    icon: 'bi-people',
  },
  OPPJ: {
    code: 'OPPJ',
    label: 'OPPJ',
    fullLabel: 'Office Paroissial de la Pastorale des Jeunes',
    description: 'Pastorale des jeunes, mouvements de jeunesse et aumôneries.',
    populationCodes: ['SEC-JEUNES'],
    isAvailable: true,
    icon: 'bi-person-walking',
  },
  OPPA: {
    code: 'OPPA',
    label: 'OPPA',
    fullLabel: 'Office Paroissial de la Pastorale des Adultes',
    description: 'Catéchuménat des adultes, formations continues et CEB.',
    populationCodes: ['SEC-ADULTES'],
    isAvailable: true,
    icon: 'bi-mortarboard',
  },
};

export const DEFAULT_ORGANISATION_SPACE: OrganisationSpace = 'OPPE';
