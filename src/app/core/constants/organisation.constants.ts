/**
 * Constantes et règles métier centrales pour les organisations pastorales dans Cathéo.
 * Conforme aux spécifications Étape F12 et au backend Laravel (CatheoPopulationService).
 */

export type OrganisationType = 'OPPE' | 'OPPJ' | 'OPPA';

/**
 * Codes officiels des sections de catéchèse CATHEO
 */
export const CATHEO_SECTIONS = {
  ENFANTS_PRIMAIRE: 'SEC-ENFANTS-PRI',
  ENFANTS_PRIMAIRE_ALT: 'SEC-ENF-PRI',
  ENFANTS_COLLEGE: 'SEC-ENFANTS-COL',
  ENFANTS_COLLEGE_ALT: 'SEC-ENF-COL',
  JEUNES: 'SEC-JEUNES',
  JEUNES_ALT: 'SEC-JEUNE',
  ADULTES: 'SEC-ADULTES',
  ADULTES_ALT: 'SEC-ADULTE',
} as const;

/**
 * Mapping officiel et strict des sections autorisées par type d'organisation.
 * RÈGLE ABSOLUE CATHEO :
 * - OPPE utilise les sections Enfants primaire et collège.
 * - OPPJ utilise les sections Jeunes.
 * - OPPA utilise les sections Adultes.
 */
export const ORGANISATION_SECTION_MAPPING: Record<OrganisationType, readonly string[]> = {
  OPPE: [
    CATHEO_SECTIONS.ENFANTS_PRIMAIRE,
    CATHEO_SECTIONS.ENFANTS_PRIMAIRE_ALT,
    CATHEO_SECTIONS.ENFANTS_COLLEGE,
    CATHEO_SECTIONS.ENFANTS_COLLEGE_ALT,
  ],
  OPPJ: [CATHEO_SECTIONS.JEUNES, CATHEO_SECTIONS.JEUNES_ALT],
  OPPA: [CATHEO_SECTIONS.ADULTES, CATHEO_SECTIONS.ADULTES_ALT],
};

/**
 * Profils RBAC autorisés par type d'organisation
 */
export const ORGANISATION_RBAC_PROFILS: Record<OrganisationType, readonly string[]> = {
  OPPE: ['RESPONSABLE_OPPE', 'UTILISATEUR_OPPE'],
  OPPJ: ['RESPONSABLE_OPPJ', 'UTILISATEUR_OPPJ'],
  OPPA: ['RESPONSABLE_OPPA', 'UTILISATEUR_OPPA'],
};

/**
 * Configuration des espaces pastoraux pour la sélection UX et l'affichage
 */
export interface OrganisationTypeDefinition {
  type: OrganisationType;
  libelleCourt: string;
  nomComplet: string;
  description: string;
  ciblePastorale: string;
  disponible: boolean;
  sectionsCibles: readonly string[];
  badgeStatut?: string;
  icone: string;
}

export const ORGANISATION_TYPE_DEFINITIONS: Record<OrganisationType, OrganisationTypeDefinition> = {
  OPPE: {
    type: 'OPPE',
    libelleCourt: 'OPPE',
    nomComplet: 'Office Paroissial de la Pastorale des Enfants',
    description: 'Catéchèse des enfants, écoles primaires et collèges.',
    ciblePastorale: 'Enfants primaire & collège (SEC-ENFANTS-PRI, SEC-ENFANTS-COL)',
    disponible: true,
    sectionsCibles: ORGANISATION_SECTION_MAPPING.OPPE,
    icone: 'bi-people',
  },
  OPPJ: {
    type: 'OPPJ',
    libelleCourt: 'OPPJ',
    nomComplet: 'Office Paroissial de la Pastorale des Jeunes',
    description: 'Pastorale des jeunes, mouvements de jeunesse et aumôneries.',
    ciblePastorale: 'Jeunes et lycéens (SEC-JEUNES)',
    disponible: true,
    sectionsCibles: ORGANISATION_SECTION_MAPPING.OPPJ,
    icone: 'bi-person-walking',
  },
  OPPA: {
    type: 'OPPA',
    libelleCourt: 'OPPA',
    nomComplet: 'Office Paroissial de la Pastorale des Adultes',
    description: 'Catéchuménat des adultes, formations continues et CEB.',
    ciblePastorale: 'Adultes et catéchumènes (SEC-ADULTES)',
    disponible: false,
    badgeStatut: 'Bientôt disponible',
    sectionsCibles: ORGANISATION_SECTION_MAPPING.OPPA,
    icone: 'bi-mortarboard',
  },
};

/**
 * Espace par défaut à l'initialisation
 */
export const DEFAULT_ORGANISATION_TYPE: OrganisationType = 'OPPE';

/**
 * Clé de stockage pour la préférence utilisateur dans le navigateur
 */
export const ORGANISATION_PREFERENCE_STORAGE_KEY = 'catheo_organisation_space_pref';

/**
 * Helper de vérification de validité d'un code de type d'organisation
 */
export function isValidOrganisationType(val: unknown): val is OrganisationType {
  return typeof val === 'string' && (val === 'OPPE' || val === 'OPPJ' || val === 'OPPA');
}

/**
 * Helper pour obtenir les codes de section d'un type d'organisation
 */
export function getSectionsForOrganisationType(type: OrganisationType): readonly string[] {
  return ORGANISATION_SECTION_MAPPING[type] || [];
}
