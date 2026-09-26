# RAPPORT DE MISSION — ÉTAPE F18 : MODULE PÈLERINAGES

**Projet** : `catheo-super-admin` (Frontend Angular 21) & `catheo` (Backend central Laravel)  
**Étape** : F18 — Module Pèlerinages dans l'Espace Organisation  
**Statut** : **COMPLETE**

---

## 1. Objectif

L'objectif de l'étape F18 était d'implémenter le module complet **Pèlerinages** au sein de l'espace Organisation de `catheo-super-admin`.  
Ce module permet aux organisations autorisées de :
- Consulter les campagnes de pèlerinage de leur organisation ;
- Consulter le détail de chaque campagne avec ses forfaits, pèlerins inscrits et journal financier ;
- Créer, modifier, ouvrir, clôturer et annuler des campagnes selon leur cycle de vie ;
- Gérer les grilles tarifaires (`tarif_pelerinages`) associées à chaque campagne ;
- Inscrire des participants internes (`CATECHUMENE` via la population paroissiale) ou externes (`EXTERNE`) dans le respect strict des règles de doublons et des capacités d'accueil ;
- Suivre les présences / participations (`prevue`, `presente`, `absente`) ;
- Enregistrer les versements partiels ou complets (`paiement_pelerinages`) et suivre le solde restant ;
- Consulter les informations financières et l'impact automatique sur la trésorerie locale (`operation_organisations`).

Le backend Laravel constitue la **source unique de vérité**. Aucune règle métier, aucun code de séquence, aucun calcul financier ni contrôle de capacité n'a été recréé de façon autonome dans Angular.

---

## 2. Audit Backend

L'audit détaillé complet a été réalisé et documenté dans [F18_PELERINAGES_BACKEND_AUDIT.md](file:///c:/Users/Kouadio%20Ferdinand/Desktop/ANGULAR/catheo-super-admin/F18_PELERINAGES_BACKEND_AUDIT.md).

Principaux constats issus des contrôleurs, requêtes et modèles Laravel :
1. **Campagnes** (`CampagnePelerinage`) :
   - Code auto-généré sous le format `PEL-{ANNEE}-{SEQUENCE}` (ex: `PEL-2026-001`).
   - Horaires : `date_depart`, `heure_depart`, `date_fin`, `heure_fin`, `date_debut_inscription`, `date_fin_inscription`.
   - **Aucune** notion de `date_retour` ni de `heure_retour`.
   - Statuts réels : `brouillon`, `ouverte`, `cloturee`, `annulee`, `terminee`.
2. **Capacité & Concurrence** :
   - Capacité calculée sur les participants **non annulés** (`statut_inscription != 'annulee'`).
   - Protection contre les dépassements via transactions Eloquent avec `lockForUpdate`.
   - Réponse 409 Conflict / 422 avec message métier explicite lorsque la capacité est atteinte.
3. **Activité liée** :
   - Une campagne peut être rattachée à une activité existante de l'organisation (`activite_id`), strictement validée par le backend (appartenance à la même organisation).
4. **Tarifs** (`TarifPelerinage`) :
   - `code`, `libelle`, `description`, `montant`, `devise`, `statut` (`actif`, `inactif`).
   - **Aucun** champ `age_min`, `age_max`, ni `conditions`.
5. **Inscriptions** (`InscriptionPelerinage`) :
   - Types de participants : `CATECHUMENE` (rattaché à un catéchumène de la paroisse) ou `EXTERNE` (personne extérieure).
   - Statuts de paiement : `en_attente`, `partiellement_payee`, `payee`, `annulee`.
   - Statuts de présence : `prevue`, `presente`, `absente`.
   - Règle de doublons : validation backend bloquant la double inscription pour une même campagne.
6. **Paiements** (`PaiementPelerinage`) :
   - Entité dédiée distincte des abonnements.
   - Modes : `ESPECES`, `ORANGE_MONEY`, `MTN_MOMO`, `MOOV_MONEY`, `WAVE`, `CHEQUE`, `VIREMENT`, `AUTRE`.
   - Création automatique par Laravel d'une écriture dans `operation_organisations` de type `ENTREE`.

---

## 3. Endpoints API Utilisés

Tous les endpoints consommés correspondent exactement aux routes déclarées dans `routes/api.php` sous le préfixe `/api/organisation/pelerinages` :

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `organisation/pelerinages` | Liste paginée avec recherche et filtres de statut |
| `POST` | `organisation/pelerinages` | Création d'une campagne |
| `GET` | `organisation/pelerinages/{id}` | Détail d'une campagne, forfaits et statistiques |
| `PUT` | `organisation/pelerinages/{id}` | Modification d'une campagne |
| `DELETE` | `organisation/pelerinages/{id}` | Suppression d'une campagne brouillon |
| `PATCH` | `organisation/pelerinages/{id}/ouvrir` | Ouverture aux inscriptions |
| `PATCH` | `organisation/pelerinages/{id}/cloturer` | Clôture de la campagne et annulation des impayés |
| `PATCH` | `organisation/pelerinages/{id}/annuler` | Annulation de la campagne |
| `GET` | `organisation/pelerinages/{id}/statistiques` | Statistiques de remplissage et financières |
| `GET` | `organisation/pelerinages/{id}/tarifs` | Liste des forfaits |
| `POST` | `organisation/pelerinages/{id}/tarifs` | Ajout d'un tarif |
| `PUT` | `organisation/pelerinages/{id}/tarifs/{tarifId}` | Modification d'un tarif |
| `DELETE` | `organisation/pelerinages/{id}/tarifs/{tarifId}` | Suppression d'un tarif non utilisé |
| `GET` | `organisation/pelerinages/{id}/inscriptions` | Liste paginée des participants |
| `POST` | `organisation/pelerinages/{id}/inscriptions` | Inscription d'un pèlerin |
| `GET` | `organisation/pelerinages/{id}/inscriptions/{insId}` | Détail d'un participant |
| `PATCH` | `organisation/pelerinages/{id}/inscriptions/{insId}/participation` | Pointage présence |
| `POST` | `organisation/pelerinages/{id}/inscriptions/{insId}/annuler` | Annulation d'une inscription |
| `GET` | `organisation/pelerinages/{id}/paiements` | Journal des versements de la campagne |
| `GET` | `organisation/pelerinages/{id}/inscriptions/{insId}/paiements` | Versements d'une inscription |
| `POST` | `organisation/pelerinages/{id}/inscriptions/{insId}/paiements` | Enregistrement d'un versement |
| `POST` | `organisation/pelerinages/{id}/paiements/{paiementId}/annuler` | Annulation d'un versement |

---

## 4. Campagnes

- **Liste des campagnes** (`PelerinagesListPageComponent`) :
  - `PageHeader` avec titre, sous-titre contextualisé (Organisation • Paroisse) et badge du type d'organisation.
  - KPIs en haut de page : Total Campagnes, Campagnes Ouvertes, Clôturées / Terminées.
  - `FilterBar` avec champ de recherche en direct et sélecteur de statut (`tous`, `brouillon`, `ouverte`, `cloturee`, `terminee`, `annulee`).
  - `TableComponent` réutilisable avec colonnes Code, Nom & Destination, Activité liée, Dates départ/fin, Inscrits/Capacité, Statut et Actions en ligne.
  - Actions contextuelles selon statut : Voir détails, Ouvrir, Clôturer, Modifier, Annuler, Supprimer (brouillon).
  - `PaginationComponent` réactif branché sur la pagination Laravel (`current_page`, `last_page`, `per_page`, `total`).
- **Formulaire de campagne** (`CampagneFormModalComponent`) :
  - Modal responsive gérant la création et l'édition.
  - Sélection optionnelle de l'activité liée filtrée sur la même organisation.
  - Champs `date_depart`, `heure_depart`, `date_fin`, `heure_fin`, `date_debut_inscription`, `date_fin_inscription`, `capacite`.

---

## 5. Tarifs

- Gestion des forfaits par campagne au sein d'un onglet dédié sur la page de détail.
- Affichage dans un tableau : Code, Libellé, Montant, Devise, Statut, Prestations incluses.
- Modal de création/édition (`TarifFormModalComponent`) avec validation de montant positif et statut actif/inactif.
- Suppression sécurisée avec boîte de dialogue `ConfirmDialog`.

---

## 6. Participants & Inscriptions

- Onglet principal de la page de détail (`PelerinageDetailPageComponent`).
- Filtres intégrés : recherche textuelle sur nom/prénoms/téléphone/référence, filtre de statut financier (`en_attente`, `partiellement_payee`, `payee`, `annulee`), filtre de présence (`prevue`, `presente`, `absente`) et filtre de type (`CATECHUMENE`, `EXTERNE`).
- Modal d'inscription (`InscriptionFormModalComponent`) :
  - Bascule ergonomique entre "Catéchumène de la paroisse" et "Participant extérieur".
  - Pour les catéchumènes : sélection directe dans la liste de la population paroissiale via `CatheoPopulationService`.
  - Pour les personnes extérieures : saisie complète des coordonnées (nom, prénoms, téléphone, email, adresse).
  - Sélection du forfait tarifaire actif, de la taille du kit pèlerin (`XS` à `XXXL`), et des coordonnées du contact d'urgence.
- Pointage des présences : boutons d'action rapide pour marquer "Présent(e)" ou "Absent(e)".
- Annulation d'inscription avec demande de confirmation explicite.

---

## 7. Paiements & Rapprochement

- Modal d'enregistrement de paiement (`PaiementFormModalComponent`) :
  - Affichage clair du solde restant dû (`reste_a_payer`).
  - Bouton d'action rapide "Solde complet" préremplissant le montant exact restant.
  - Validation empêchant de saisir un montant supérieur au reste à payer.
  - Choix du mode de versement (Espèces, Wave, Orange Money, Moov, MTN, Chèque, Virement).
- Journal global des paiements au sein de l'onglet "Paiements" avec référence du reçu, date, pèlerin associé, montant et mode.
- Annulation d'un paiement avec confirmation et ajustement automatique du solde côté serveur.

---

## 8. Opérations Financières

- Conformément aux consignes de l'étape, aucun double système comptable n'a été introduit.
- Les versements enregistrés génèrent automatiquement des écritures dans `operation_organisations` via le backend.
- Angular reflète simplement les montants et totaux officiels retournés par le backend.

---

## 9. Capacité & Concurrence

- L'affichage de la capacité utilise strictement les données calculées par Laravel (`places_occupees`, `places_restantes`, `capacite`, `est_complete`).
- Les jauges et alertes visuelles indiquent clairement lorsque la capacité maximale est atteinte.
- En cas de collision concurrente (deux inscriptions simultanées sur la dernière place disponible), l'erreur 409 renvoyée par le backend est capturée et affichée dans un bandeau d'alerte explicite.

---

## 10. RBAC (Contrôle d'Accès Basé sur les Rôles)

Permissions officielles appliquées :
- `pelerinages.read` : consultation de la liste, du détail, des statistiques, des forfaits et des participants.
- `pelerinages.create` : création de campagnes, ajout de forfaits et inscription de pèlerins.
- `pelerinages.update` : modification de campagnes, ouverture, clôture, annulation et pointage des présences.
- `pelerinages.delete` : suppression de campagnes (brouillon) et forfaits non utilisés.
- `pelerinages.paiements` : saisie et annulation des versements financiers.

Les boutons d'action sont masqués ou désactivés dans l'interface en l'absence de permission, et le backend assure le contrôle strict en rejetant tout accès non autorisé par un code HTTP 403.

---

## 11. Multi-tenant

- Toutes les requêtes vers l'API sont automatiquement isolées par le backend selon le token de session et l'organisation active de l'utilisateur connecté.
- Aucun `organisation_id` n'est transmis de façon arbitraire depuis le client Angular.
- Les activités sélectionnables pour une campagne sont strictement circonscrites à celles appartenant à l'organisation active.

---

## 12. Design & Ergonomie

- Utilisation exclusive du **Design System F3** :
  - `PageHeaderComponent`, `StatCardComponent`, `CardComponent`, `TableComponent`, `PaginationComponent`, `FilterBarComponent`, `ModalComponent`, `ButtonComponent`, `BadgeComponent`, `ConfirmDialogComponent`.
  - Badges spécialisés : `CampagneStatusBadgeComponent`, `InscriptionStatusBadgeComponent`, `ParticipationStatusBadgeComponent`.
- Respect strict des principes CSS : **Vanilla CSS uniquement** (aucun framework CSS externe, aucun SCSS, aucune dépendance tierce).
- Architecture responsive soignée (cartes adaptatives sur mobile, barres d'actions déroulantes, navigation par onglets).

---

## 13. Tests Unitaires

Tous les tests unitaires ont été exécutés avec succès sous Vitest :
- **Avant F18** : 95 suites, 480 tests
- **Après F18** : 101 suites, 540 tests (0 échec)
- **Nouveaux tests F18** : 6 suites, 60 tests :
  1. `PelerinageService` : 20 tests (CRUD campagnes, cycle de vie, tarifs, inscriptions, paiements, multi-tenant, erreurs).
  2. `CampagneStatusBadgeComponent` : 5 tests (variantes et libellés des 5 statuts).
  3. `InscriptionStatusBadgeComponent` : 4 tests (variantes et libellés des 4 statuts de paiement).
  4. `ParticipationStatusBadgeComponent` : 3 tests (variantes et libellés de présence).
  5. `PelerinagesListPageComponent` : 14 tests (initialisation, KPIs, filtres, pagination, ouverture, clôture, annulation, suppression, RBAC, erreurs).
  6. `PelerinageDetailPageComponent` : 14 tests (initialisation, capacité, onglets, pointage, annulation inscription, annulation paiement, suppression tarif, modales, erreurs).

---

## 14. TypeScript

- Compilation stricte avec `npx tsc --noEmit` : **0 erreur**.
- Typage strict exhaustif sans `any` injustifié.
- Utilisation des signaux Angular 21 (`signal`, `computed`, `input`, `output`) et `ChangeDetectionStrategy.OnPush`.

---

## 15. Build

- Commande : `npm run build`
- Résultat : **SUCCESS** (génération complète des bundles de production sans avertissement ni erreur).

---

## 16. Fichiers Créés

1. `src/app/features/organisation/pelerinages/models/pelerinage.model.ts`
2. `src/app/features/organisation/pelerinages/services/pelerinage.service.ts`
3. `src/app/features/organisation/pelerinages/services/pelerinage.service.spec.ts`
4. `src/app/features/organisation/pelerinages/components/campagne-status-badge/campagne-status-badge.component.ts`
5. `src/app/features/organisation/pelerinages/components/campagne-status-badge/campagne-status-badge.component.spec.ts`
6. `src/app/features/organisation/pelerinages/components/inscription-status-badge/inscription-status-badge.component.ts`
7. `src/app/features/organisation/pelerinages/components/inscription-status-badge/inscription-status-badge.component.spec.ts`
8. `src/app/features/organisation/pelerinages/components/participation-status-badge/participation-status-badge.component.ts`
9. `src/app/features/organisation/pelerinages/components/participation-status-badge/participation-status-badge.component.spec.ts`
10. `src/app/features/organisation/pelerinages/components/campagne-form-modal/campagne-form-modal.component.ts`
11. `src/app/features/organisation/pelerinages/components/tarif-form-modal/tarif-form-modal.component.ts`
12. `src/app/features/organisation/pelerinages/components/inscription-form-modal/inscription-form-modal.component.ts`
13. `src/app/features/organisation/pelerinages/components/paiement-form-modal/paiement-form-modal.component.ts`
14. `src/app/features/organisation/pelerinages/pages/pelerinages-list-page.component.ts`
15. `src/app/features/organisation/pelerinages/pages/pelerinages-list-page.component.spec.ts`
16. `src/app/features/organisation/pelerinages/pages/pelerinage-detail-page.component.ts`
17. `src/app/features/organisation/pelerinages/pages/pelerinage-detail-page.component.spec.ts`
18. `src/app/features/organisation/pelerinages/routes/pelerinages.routes.ts`
19. `F18_PELERINAGES_BACKEND_AUDIT.md`
20. `ETAPE_F18_RAPPORT_FINAL.md`

---

## 17. Fichiers Modifiés

1. `src/app/features/organisation/organisation.routes.ts` : Ajout de la route d'accès enfant `pelerinages` avec lazy-loading.
2. `src/app/features/organisation/components/organisation-sidebar/organisation-sidebar.component.ts` : Ajout du lien de navigation "Pèlerinages" avec icône dédiée (`bi-geo-alt-fill`) et badge de raccourci.

---

## 18. Non-régression

- Aucune régression sur les étapes antérieures F1 à F17.
- La totalité des tests existants (authentification, super admin, paroisses, abonnements, paiements, factures, membres, activités, population CATHEO) continuent de s'exécuter et de réussir.
- Le dossier `catheo-cim` n'a pas été touché.

---

## 19. Limites Éventuelles & Perspectives

- Le module Caisse globale de l'organisation fait l'objet de l'étape suivante **F19**. Dans F18, seules les informations financières directement relatives aux pèlerinages (recouvrement, encaissements, soldes) sont affichées.
- L'impression des reçus ou bordereaux de pèlerinage suit le principe établi dans CATHEO : rendu client HTML/CSS natif via impression du navigateur, sans sollicitation de moteurs PDF côté serveur.
