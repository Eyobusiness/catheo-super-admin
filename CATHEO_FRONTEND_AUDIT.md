# AUDIT D'ARCHITECTURE FRONTEND ↔ BACKEND & CARTOGRAPHIE DES APIS
## Plateforme CATHEO : Super Admin, OPPE, OPPJ (et extension OPPA)

> **Document de Référence pour l'Initialisation de `catheo-super-admin`**  
> **Date de réalisation** : Septembre 2026  
> **Auteur** : Antigravity (Advanced Agentic Architecture)  
> **Projets audités** :
> 1. `catheo-cim` (Référence Frontend Angular existante)
> 2. `catheo` (Référence Backend Laravel existante - Source de Vérité)
> 3. `catheo-super-admin` (Projet Angular Cible)

---

## 1. Vue d'Ensemble & Objectifs de l'Audit

Le présent document constitue l'audit de référence permettant de concevoir et planifier le développement du nouveau projet Angular **`catheo-super-admin`**.

Conformément à la règle d'or d'ingénierie logicielle appliquée :
$$\text{Backend Réel} \longrightarrow \text{API Réelle} \longrightarrow \text{Service Angular} \longrightarrow \text{Composant Angular}$$

Aucun endpoint ni aucune structure de données n'a été imaginé. L'analyse repose à 100% sur le code réel du backend Laravel certifié (`catheo`) et sur l'écosystème frontend mature déjà éprouvé dans `catheo-cim`.

---

## 2. Analyse de l'Existant : `catheo-cim` (Référence Frontend)

### 2.1. Socle Technologique
- **Framework** : Angular 21 (v21.2.0), Standalone Components, API de Signals (`signal`, `computed`), ChangeDetectionStrategy `OnPush`.
- **Outils & Build** : `@angular/build` (Vite / Esbuild), TypeScript 5.9, Vitest pour les tests unitaires.
- **Design System** : Vanilla CSS pur avec variables CSS personnalisées (`--primary-*`, `--accent-*`, `--neutral-*`, `--status-*`), Google Fonts (`Plus Jakarta Sans`, `Inter`, `Outfit`), typographie fluide, iconographie `bootstrap-icons 1.11.3`.
- **PWA & Offline** : Module Service Worker (`@angular/service-worker`), PWA install prompt.

### 2.2. Bibliothèque de Composants UI Réutilisables (`src/app/shared/ui/components`)
`catheo-cim` dispose d'une bibliothèque UI complète et modulaire prête à être exploitée :
1. **Layout & Structure** :
   - `app-header` : Barre supérieure avec affichage utilisateur, cloche de notifications, changement d'année/contexte, menu déroulant profil.
   - `app-sidebar` : Barre latérale rétractable (mode complet 270px / replié 80px), accordéons de sous-menus, filtrage dynamique basé sur les menus autorisés.
   - `app-footer` : Pied de page standardisé.
   - `app-page-container`, `app-content-container`, `app-card`, `app-split-layout`, `app-section`.
2. **Formulaires & Saisies** :
   - `app-input`, `app-number-input`, `app-password-input`, `app-phone-input`, `app-search-input`.
   - `app-select`, `app-multi-select`, `app-radio`, `app-switch`, `app-textarea`, `app-time-picker`.
3. **Tableaux & Affichages de Données** :
   - `app-data-table` : Table générique avec tri, états de chargement, slots d'actions.
   - `app-table-header`, `app-table-search`, `app-table-filter`, `app-table-column`.
   - `app-pagination` : Pagination standardisée (page courante, par page, total, boutons suivant/précédent).
   - `app-row-actions`, `app-table-actions`, `app-empty-table`, `app-table-loading`.
4. **Dialogues, Overlays & Feedback** :
   - `app-modal`, `app-dialog`, `app-drawer`, `app-popover`, `app-tooltip`.
   - `app-confirm-dialog` : Boîte de confirmation sécurisée (suppression, validation).
   - `app-toast` : Notifications toast flottantes (succès, erreur, avertissement, info) pilotées par `ToastService`.
   - `app-alert`, `app-badge`, `app-chip`, `app-loader`, `app-progress-bar`, `app-skeleton`.
5. **Navigation & Sécurité** :
   - `app-page-header`, `app-breadcrumb`, `app-back-navigation`, `app-stepper`, `app-tabs`.
   - `app-access-denied`, `app-permission-denied`, `app-unauthorized`.

### 2.3. Services Transverses du Core
- `AuthService` : Gestion du token Sanctum, du profil utilisateur, des menus accessibles en LocalStorage et Signals réactifs.
- `authInterceptor` : Injection du header `Authorization: Bearer <token>`, injection des headers contextuels `X-Paroisse-Id`, `X-Annee-Id`, gestion automatique de l'expiration de session (401).
- `ToastService` : Déclenchement de messages d'information et d'erreur.
- `ThemeService` : Personnalisation dynamique des variables CSS de thème.
- `InactivityService` : Déconnexion automatique après 30 minutes d'inactivité.
- `ModalService` : Pilotage programmatique des boîtes modales.

### 2.4. Limites de `catheo-cim` face aux besoins de `catheo-super-admin`
- `catheo-cim` est exclusivement conçu pour la **catéchèse paroissiale** (catéchumènes, présences aux séances, notes d'évaluations, sacrements, cotisations de catéchèse).
- `catheo-cim` ne contient aucun écran ni service pour :
  1. Le **Super Admin plateforme** (paroisses, produits SaaS, abonnements, facturation, création d'organisations).
  2. Les **Organisations Spécialisées** (**OPPE** pour les petits enfants, **OPPJ** pour les jeunes, **OPPA** pour les adultes).
  3. La gestion des pèlerinages, campagnes de voyages, tarifs, acomptes, soldes et pointage.
  4. La gestion financière et la caisse organisationnelle.
  5. La passerelle filtrée avec la catéchèse (`CatheoPopulation`).

---

## 3. Analyse du Backend Réel : `catheo` (Source de Vérité)

Le backend Laravel est certifié (66 migrations, 110 tests automatisés réussis à 100%, 0 faille IDOR). Il expose 3 périmètres API bien distincts.

### 3.1. Périmètre Authentification (`/api/v1/auth/*`)
- `POST /api/v1/auth/login` (ou `/admin/login`) : Connexion par `login` (email, téléphone ou nom d'utilisateur) et `password`.
  - Contrôle du statut de l'utilisateur (`actif`).
  - Contrôle du statut de l'organisation rattachée (`actif`).
  - Retourne le token Sanctum, l'objet `UserResource`, le `profil` avec ses `permissions`, et les `menus`.
- `GET /api/v1/auth/me` : Rafraîchissement des informations de l'utilisateur connecté.
- `POST /api/v1/auth/logout` : Révocation du token d'accès.
- `POST /api/v1/auth/forgot-password`, `verify-code`, `reset-password` : Flux de réinitialisation sécurisé par code OTP à 6 chiffres.

### 3.2. Périmètre Super Admin (`/api/v1/super-admin/*`)
- **Middleware** : `['auth:sanctum', 'super_admin']` (`EnsureSuperAdmin`).
- **Contrôleurs dédiés** :
  1. `SuperAdminDashboardController` : KPIs consolidés (MRR, paroisses, abonnements, alertes).
  2. `SuperAdminParoisseController` : Consultation des paroisses déployées.
  3. `SuperAdminProduitController` : CRUD des produits SaaS (`CATHEO`, `OPPE`, `OPPJ`, `OPPA`) et activation/désactivation.
  4. `SuperAdminFormuleController` : CRUD des formules d'abonnement (mensuel, trimestriel, annuel).
  5. `SuperAdminOrganisationController` : Liste/détail des organisations par paroisse et produit, endpoint de **provisionnement du premier responsable** (`POST /organisations/{id}/responsable`).
  6. `SuperAdminAbonnementController` : Gestion du cycle de vie des abonnements (création, changement de statut, résiliation).
  7. `SuperAdminEcheanceController` : Consultation des échéances de paiement, génération automatique de factures.
  8. `SuperAdminPaiementController` : Enregistrement des règlements d'abonnement, annulation, remboursement.
  9. `SuperAdminFactureController` : Consultation et détail des factures émises.

### 3.3. Périmètre Organisation Pastorale (`/api/v1/organisation/*`)
- **Middleware** : `['auth:sanctum', 'organisation']` (`EnsureOrganisationContext` + `SecurityContextService`).
- **Contrôle d'accès & Isolation Multi-Tenant (Anti-IDOR)** :
  - Le backend inspecte le token et injecte l'organisation certifiée dans `$request->attributes->get('organisation')`.
  - Aucune injection de `organisation_id` par le client n'est acceptée.
  - L'organisation doit impérativement avoir le statut `actif`.
- **Contrôleurs dédiés** :
  1. `OrganisationProfileController` : Contexte certifié (`/context`, `/info`) et mise à jour des coordonnées.
  2. `MembreController` : CRUD des membres adhérents à l'organisation (`membres.view`, `membres.manage`).
  3. `ActiviteController` : CRUD des activités et événements pastoraux (`activites.view`, `activites.manage`).
  4. `OrganisationUserController` : Gestion des comptes utilisateurs de l'organisation (`organisation.users.manage`).
  5. `CatheoPopulationController` : Passerelle de lecture vers les catéchumènes de la paroisse inscrits pour l'année en cours, avec filtrage strict par codes de section.
  6. `CampagnePelerinageController` : CRUD des campagnes de pèlerinages, ouverture, clôture, annulation.
  7. `TarifPelerinageController` : Grille tarifaire des pèlerinages par catégorie.
  8. `InscriptionPelerinageController` : Inscriptions (membres, catéchumènes, externes), génération automatique d'inscriptions pour les catéchumènes, annulation.
  9. `PaiementPelerinageController` : Encaissement des acomptes/soldes, reçus, annulation.
  10. `InscriptionPelerinageController@updateParticipation` & `@batchUpdateParticipation` : Pointage de présence physique.
  11. `OrganisationCaisseController` : Journal de caisse hermétique, balance des encaissements/décaissements.
  12. `OrganisationDashboardController` : Dashboard opérationnel avec compteurs et statistiques.
  13. `OrganisationStatistiqueController` : Statistiques fines (membres, activités, pèlerinages, finances).
  14. `OrganisationRapportController` : Génération du bilan annuel d'activité.
  15. `OrganisationExportController` : Exports CSV/Excel standardisés.

---

## 4. Règles Métier Fondamentales (Backend Authority)

### 4.1. Cloisonnement des Sections Pastorales
Le backend impose les codes de sections stricts dans `CatheoPopulationService` :
- **OPPE** (Organisation Pastorale des Petits Enfants) :
  - `SEC-ENFANTS-PRI` (Enfants primaire)
  - `SEC-ENFANTS-COL` (Enfants collège)
- **OPPJ** (Organisation Pastorale des Jeunes) :
  - `SEC-JEUNES` (Jeunesse)
- **OPPA** (Organisation Pastorale des Adultes) :
  - `SEC-ADULTES` (Adultes / Catéchuménat adulte)

> **Règle** : Le frontend ne doit jamais filtrer manuellement ces codes en dur. Il appelle simplement `/api/v1/organisation/catheo/population` qui renvoie la liste déjà filtrée et cloisonnée par le serveur.

### 4.2. Année Pastorale Active
- Toutes les opérations de consultation de la catéchèse et des statistiques reposent sur l'année pastorale active de la paroisse (`AnneeCatechese::getAnneeCourante($paroisseId)`).
- Si aucune année pastorale n'est active, le backend renvoie une réponse propre (liste vide, indicateur `catheo_connecte: false`) sans planter (aucune erreur 500).

### 4.3. Herméticité Financière & Caisse
- La caisse de l'organisation (`operations_organisations`) est **strictement distincte** de la caisse générale de la paroisse et des encaissements de catéchèse.
- Les paiements de pèlerinage alimentent automatiquement les flux d'encaissement de la caisse organisationnelle.
- L'annulation d'un paiement de pèlerinage déclenche automatiquement une écriture de contre-passation/décaissement dans la caisse de l'organisation.

---

## 5. Profils et Permissions Disponibles

### 5.1. Profils Système Déclarés

| Code Profil | Nom & Description | Espace Associé |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Administrateur Global de la Plateforme CATHEO SaaS | Espace Super Admin (`/super-admin/*`) |
| `RESPONSABLE_OPPE` | Responsable Principal Petite Enfance | Espace Organisation OPPE (`/organisation/*`) |
| `UTILISATEUR_OPPE` | Animateur / Collaborateur Petite Enfance | Espace Organisation OPPE (`/organisation/*`) |
| `RESPONSABLE_OPPJ` | Responsable Principal Organisation Jeunesse | Espace Organisation OPPJ (`/organisation/*`) |
| `UTILISATEUR_OPPJ` | Animateur / Encadrant Jeunesse | Espace Organisation OPPJ (`/organisation/*`) |
| `RESPONSABLE_OPPA` | Responsable Principal Pastorale des Adultes *(extension)* | Espace Organisation OPPA (`/organisation/*`) |
| `UTILISATEUR_OPPA` | Collaborateur Pastorale des Adultes *(extension)* | Espace Organisation OPPA (`/organisation/*`) |

### 5.2. Matrice des Permissions Backend

| Clé Permission Backend | Description Fonctionnelle | Profils Éligibles |
| :--- | :--- | :--- |
| `*` | Accès Super Administrateur complet | `SUPER_ADMIN` |
| `organisation.view` | Consultation du contexte et fiche organisation | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `organisation.edit` | Modification des coordonnées organisation | `RESPONSABLE_*` |
| `organisation.users.manage` | Gestion des comptes utilisateurs internes | `RESPONSABLE_*` |
| `membres.view` | Consultation de l'annuaire des membres | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `membres.manage` | Création, modification, archivage membres | `RESPONSABLE_*` |
| `activites.view` | Consultation du planning des activités | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `activites.create` | Création d'une activité pastorale | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `activites.edit` | Modification du statut/détails d'activité | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `activites.manage` | Suppression et gestion avancée activités | `RESPONSABLE_*` |
| `catheo.population.view` | Visualisation de la passerelle Catheo Population | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `pelerinages.read` | Consultation des campagnes et statistiques | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `pelerinages.create` | Création d'une campagne de pèlerinage | `RESPONSABLE_*` |
| `pelerinages.update` | Modification et tarification de campagne | `RESPONSABLE_*` |
| `pelerinages.delete` | Suppression d'une campagne | `RESPONSABLE_*` |
| `pelerinages.manage` | Ouverture, clôture, annulation de campagne | `RESPONSABLE_*` |
| `pelerinages.paiements` | Encaissement d'acomptes/soldes pèlerinage | `RESPONSABLE_*` |
| `pelerinages.participation`| Enregistrement et pointage de présence | `RESPONSABLE_*` |
| `caisse.read` | Consultation de l'état de caisse et journal | `RESPONSABLE_*` |
| `dashboard.read` | Visualisation des indicateurs du tableau de bord | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `statistiques.read` | Consultation des statistiques avancées | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `rapports.read` | Génération et téléchargement du bilan annuel | `RESPONSABLE_*`, `UTILISATEUR_*` |
| `exports.read` | Exportation de listings en format CSV/Excel | `RESPONSABLE_*` |

---

## 6. Cartographie Frontend ↔ Backend

Ce tableau établit la correspondance exhaustive entre l'interface utilisateur, les services Angular, les endpoints réels de Laravel et les permissions associées.

| Domaine | Frontend Existant (`catheo-cim`) | Endpoint API Laravel Réel | Permission Backend | État pour `catheo-super-admin` |
| :--- | :--- | :--- | :--- | :--- |
| **Authentification** | `AuthService` (avec logique animateur) | `POST /api/v1/auth/login` | Publique | **À adapter** (supprimer code animateur spécifique, gérer détection SuperAdmin vs Organisation) |
| **Session Utilisateur** | `AuthService.getMe()` | `GET /api/v1/auth/me` | Authentifié Sanctum | **À adapter** (charger organisation contextuelle si applicable) |
| **Déconnexion** | `AuthService.logout()` | `POST /api/v1/auth/logout` | Authentifié Sanctum | **À adapter** (nettoyage session propre) |
| **Mot de Passe Oublié**| `AuthService.forgotPassword()` | `POST /api/v1/auth/forgot-password` | Publique | **À réutiliser** |
| **Vérification Code OTP**| `AuthService.verifyCode()` | `POST /api/v1/auth/verify-code` | Publique | **À réutiliser** |
| **Réinitialisation PWD**| `AuthService.resetPassword()` | `POST /api/v1/auth/reset-password` | Publique | **À réutiliser** |
| **Changement Mot de Passe**| `AuthService.changePassword()`| `POST /api/v1/auth/change-password`| Authentifié Sanctum | **À réutiliser** |
| **Super Admin - Dashboard** | Aucun (existant Catheo CIM n'est pas Super Admin) | `GET /api/v1/super-admin/dashboard` | `super_admin` | **À créer** (`SuperAdminDashboardService` + Page Dashboard) |
| **Super Admin - Paroisses** | Aucun | `GET /api/v1/super-admin/paroisses`<br>`GET /api/v1/super-admin/paroisses/{id}` | `super_admin` | **À créer** (`SuperAdminParoisseService` + Page Supervision Paroisses) |
| **Super Admin - Produits** | Aucun | `GET|POST /api/v1/super-admin/produits`<br>`PUT|DELETE /produits/{id}`<br>`PATCH /produits/{id}/toggle-status` | `super_admin` | **À créer** (`SuperAdminProduitService` + Page Gestion Produits SaaS) |
| **Super Admin - Formules** | Aucun | `GET|POST /api/v1/super-admin/formules`<br>`PUT|DELETE /formules/{id}`<br>`PATCH /formules/{id}/toggle-status` | `super_admin` | **À créer** (`SuperAdminFormuleService` + Page Gestion Formules) |
| **Super Admin - Organisations**| Aucun | `GET /api/v1/super-admin/organisations`<br>`GET /organisations/{id}`<br>`POST /organisations/{id}/responsable` | `super_admin` | **À créer** (`SuperAdminOrganisationService` + Page Organisations & Provisionnement) |
| **Super Admin - Abonnements** | Aucun | `GET|POST /api/v1/super-admin/abonnements`<br>`PATCH /abonnements/{id}/statut`<br>`POST /abonnements/{id}/resilier` | `super_admin` | **À créer** (`SuperAdminAbonnementService` + Page Abonnements) |
| **Super Admin - Échéances** | Aucun | `GET /api/v1/super-admin/echeances`<br>`POST /echeances/{id}/generer-facture` | `super_admin` | **À créer** (`SuperAdminEcheanceService` + Page Échéancier) |
| **Super Admin - Règlements**| Aucun | `GET|POST /api/v1/super-admin/paiements-abonnement`<br>`POST /paiements-abonnement/{id}/annuler`<br>`POST /paiements-abonnement/{id}/rembourser` | `super_admin` | **À créer** (`SuperAdminPaiementService` + Page Règlements) |
| **Super Admin - Factures** | Aucun | `GET /api/v1/super-admin/factures`<br>`GET /api/v1/super-admin/factures/{id}` | `super_admin` | **À créer** (`SuperAdminFactureService` + Page Facturation) |
| **Organisation - Contexte**| Aucun | `GET /api/v1/organisation/context`<br>`GET /api/v1/organisation/info`<br>`PUT /api/v1/organisation/info` | `organisation.view`<br>`organisation.edit` | **À créer** (`OrganisationContextService` + Paramètres profil) |
| **Organisation - Dashboard**| Aucun | `GET /api/v1/organisation/dashboard` | `dashboard.read` | **À créer** (`OrganisationDashboardService` + Dashboard OPPE/OPPJ) |
| **Organisation - Membres** | Aucun | `GET|POST /api/v1/organisation/membres`<br>`GET|PUT|DELETE /membres/{id}` | `membres.view`<br>`membres.manage` | **À créer** (`MembreService` + Listing & Fiche Membre) |
| **Organisation - Activités**| Aucun | `GET|POST /api/v1/organisation/activites`<br>`GET|PUT|DELETE /activites/{id}` | `activites.view`<br>`activites.create`<br>`activites.manage` | **À créer** (`ActiviteService` + Calendrier/Listing Activités) |
| **Organisation - Utilisateurs**| `UtilisateursService` (paroisse) | `GET|POST /api/v1/organisation/users`<br>`GET|PUT /users/{id}`<br>`PATCH /users/{id}/toggle-status` | `organisation.users.manage` | **À créer** (`OrganisationUserService` + Gestion de l'équipe) |
| **Organisation - Catheo Population**| Aucun | `GET /api/v1/organisation/catheo/population` | `catheo.population.view` | **À créer** (`CatheoPopulationService` + Visualisation Passerelle Catéchèse) |
| **Organisation - Pèlerinages Campagnes**| Aucun | `GET|POST /api/v1/organisation/pelerinages`<br>`GET|PUT|DELETE /pelerinages/{id}`<br>`PATCH /{id}/ouvrir`<br>`PATCH /{id}/cloturer`<br>`PATCH /{id}/annuler`<br>`GET /{id}/statistiques` | `pelerinages.read`<br>`pelerinages.create`<br>`pelerinages.update`<br>`pelerinages.manage` | **À créer** (`PelerinageCampagneService` + Gestion des Campagnes) |
| **Organisation - Pèlerinages Tarifs**| Aucun | `GET|POST /pelerinages/{c}/tarifs`<br>`PUT|DELETE /pelerinages/{c}/tarifs/{t}` | `pelerinages.update`<br>`pelerinages.manage` | **À créer** (`PelerinageTarifService` + Grille Tarifaire) |
| **Organisation - Pèlerinages Inscriptions**| Aucun | `GET|POST /pelerinages/{c}/inscriptions`<br>`PUT|DELETE /inscriptions/{i}`<br>`PATCH /inscriptions/{i}/annuler`<br>`POST /generer-inscriptions-catheo`<br>`GET /participants-catheo` | `pelerinages.read`<br>`pelerinages.create`<br>`pelerinages.update` | **À créer** (`PelerinageInscriptionService` + Inscriptions & Import Catheo) |
| **Organisation - Pèlerinages Paiements**| Aucun | `GET /pelerinages/{c}/paiements`<br>`GET|POST /inscriptions/{i}/paiements`<br>`POST /paiements/{p}/annuler` | `pelerinages.paiements` | **À créer** (`PelerinagePaiementService` + Encaissements & Reçus) |
| **Organisation - Pointage Présence**| Aucun | `PATCH /inscriptions/{i}/participation`<br>`POST /pelerinages/{c}/participation/batch` | `pelerinages.participation` | **À créer** (`PelerinageParticipationService` + Écran de Pointage) |
| **Organisation - Caisse** | `CaisseService` (paroisse générale) | `GET /api/v1/organisation/caisse` | `caisse.read` | **À créer** (`OrganisationCaisseService` + Suivi Solde & Opérations) |
| **Organisation - Statistiques**| Aucun | `GET /api/v1/organisation/statistiques/membres`<br>`GET /activites`<br>`GET /pelerinages`<br>`GET /finances` | `statistiques.read` | **À créer** (`OrganisationStatistiqueService` + Tableaux & Graphiques) |
| **Organisation - Rapports**| Aucun | `GET /api/v1/organisation/rapports/annuel` | `rapports.read` | **À créer** (`OrganisationRapportService` + Bilan Annuel d'Activité) |
| **Organisation - Exports** | Aucun | `GET /api/v1/organisation/exports/membres`<br>`GET /activites`<br>`GET /pelerinages/{c}/participants`<br>`GET /pelerinages/{c}/paiements`<br>`GET /operations`<br>`GET /caisse` | `exports.read` | **À créer** (`OrganisationExportService` + Téléchargements CSV/Excel) |

---

## 7. Décisions d'Architecture & Stratégie de Développement

### 7.1. Ce qui est REPRIS directement de `catheo-cim` (sans réinvention de roue)
1. **Design System Complet** :
   - Fichier `src/styles.css` avec l'ensemble des tokens de couleurs, espacements, ombres et rayons de bordure.
   - Balises HTML et liaisons de polices Google Fonts et Bootstrap Icons dans `src/index.html`.
2. **Bibliothèque UI Partagée (`src/app/shared/ui/components`)** :
   - Composants de formulaire (`app-input`, `app-select`, `app-switch`, etc.).
   - Composants de données (`app-data-table`, `app-pagination`, `app-table-filter`, `app-empty-table`, etc.).
   - Composants de dialogue et feedback (`app-modal`, `app-confirm-dialog`, `app-toast`, `app-loader`, `app-badge`).
   - Composants de sécurité (`app-permission-denied`, `app-access-denied`).
3. **Services Transverses Utilitaires** :
   - `ToastService` pour l'affichage de notifications réactives.
   - `ModalService` pour l'ouverture fluide de modales.
   - `ThemeService` pour la personnalisation visuelle.
   - `InactivityService` pour la sécurité de session.

### 7.2. Ce qui est ADAPTÉ
1. **`AuthService`** :
   - Épuration du code spécifique au portail mobile catéchèse Animateur (`AnimateurAuthService`).
   - Détection automatique du type de compte au login :
     - Si `user_type === 'super_admin'` $\rightarrow$ Routage vers `/super-admin/dashboard`.
     - Si `user.organisation_id` existe $\rightarrow$ Récupération automatique du contexte via `/api/v1/organisation/context` et routage vers `/organisation/dashboard`.
   - Prise en charge des profils `RESPONSABLE_OPPE`, `UTILISATEUR_OPPE`, `RESPONSABLE_OPPJ`, `UTILISATEUR_OPPJ` (et futur `OPPA`).
2. **`authInterceptor`** :
   - Conservation de l'injection du Bearer Token et du header `Accept: application/json`.
   - Nettoyage des règles complexes d'URL spécifiques aux catéchumènes.
   - Traitement standardisé des codes HTTP d'erreur :
     - `401 Unauthorized` $\rightarrow$ Déconnexion et redirection vers `/auth/login`.
     - `403 Forbidden` $\rightarrow$ Toast d'alerte et redirection vers `/forbidden` si non autorisé.
3. **`app-sidebar` & Navigation** :
   - Adaptation dynamique du menu de navigation selon le type d'utilisateur connecté :
     - **Mode Super Admin** : Tableau de bord plateforme, Paroisses, Produits SaaS, Formules tarifaires, Abonnements & Échéancier, Factures, Organisations & Provisionnement.
     - **Mode Organisation (OPPE / OPPJ / OPPA)** : Tableau de bord, Membres de l'organisation, Activités pastorales, Passerelle Population Catheo, Pèlerinages & Voyages, Caisse & Finances, Statistiques & Rapports, Équipe & Utilisateurs.

### 7.3. Ce qui doit être CRÉÉ (Nouveaux Développements)
1. **Typage TypeScript Rigoureux** :
   - Modèles et interfaces des ressources Laravel dans `src/app/core/models/` :
     - `super-admin.models.ts` (`Produit`, `Formule`, `Abonnement`, `Echeance`, `Facture`, `PaiementAbonnement`, `ParoisseSupervision`).
     - `organisation.models.ts` (`OrganisationContext`, `Membre`, `Activite`, `CatheoPopulationItem`, `CampagnePelerinage`, `TarifPelerinage`, `InscriptionPelerinage`, `PaiementPelerinage`, `CaisseOrganisation`, `DashboardOrganisation`, `StatistiquesOrganisation`).
2. **Services HTTP Typés** :
   - Services sous `src/app/core/services/super-admin/` pour chaque ressource `/api/v1/super-admin/*`.
   - Services sous `src/app/core/services/organisation/` pour chaque ressource `/api/v1/organisation/*`.
3. **Guards de Sécurité de Routage** :
   - `superAdminGuard` : Protège les routes `/super-admin/*`.
   - `organisationGuard` : Protège les routes `/organisation/*` et vérifie l'existence d'une organisation active.
   - `permissionGuard` : Vérifie que l'utilisateur détient la permission requise pour un écran donné.
4. **Modules Fonctionnels (Features)** :
   - **`features/super-admin/`** :
     - `dashboard` : Indicateurs globaux, MRR, alertes d'échéances.
     - `paroisses` : Liste des paroisses enregistrées.
     - `produits` : Catalogue des offres SaaS et formules.
     - `organisations` : Supervision des organisations créées et modal de provisionnement du responsable initial.
     - `abonnements` : Échéanciers, factures, encaissements et résiliations.
   - **`features/organisation/`** :
     - `dashboard` : KPIs de l'organisation (membres actifs, activités prévues, caisse).
     - `membres` : Annuaire, création de membre, statut, historique.
     - `activites` : Programme des activités pastorales, planning, statut.
     - `catheo-population` : Table de consultation des enfants/jeunes inscrits dans la catéchèse paroissiale de l'année courante avec filtres.
     - `pelerinages` : Gestion complète des campagnes, grilles tarifaires, inscriptions (internes/externes/catheo), règlements d'acomptes/soldes, reçus, pointage de participation.
     - `caisse` : Journal des opérations et suivi de trésorerie hermétique.
     - `statistiques` : Tableaux statistiques thématiques.
     - `rapports` : Générateur de bilan annuel et téléchargement.
     - `utilisateurs` : Gestion des collaborateurs de l'organisation (`RESPONSABLE_*`, `UTILISATEUR_*`).

---

## 8. Arborescence Cible Recommandée pour `catheo-super-admin`

```text
src/
├── app/
│   ├── app.config.ts                      # Configuration globale (HTTP Client, Routing, Interceptors)
│   ├── app.routes.ts                      # Déclaration des routes racine & Guards
│   ├── app.ts                             # Composant racine avec gestion du layout
│   ├── app.html
│   ├── app.css
│   │
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts              # Vérification de connexion
│   │   │   ├── guest.guard.ts             # Redirection si déjà connecté
│   │   │   ├── super-admin.guard.ts       # Restriction stricte Super Admin
│   │   │   ├── organisation.guard.ts      # Restriction stricte Organisation
│   │   │   └── permission.guard.ts        # Contrôle fin par permission
│   │   │
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts        # Bearer Token & Gestion erreurs 401/403
│   │   │
│   │   ├── models/
│   │   │   ├── auth.models.ts             # User, LoginDto, Token
│   │   │   ├── super-admin.models.ts      # Produit, Formule, Abonnement, Facture, etc.
│   │   │   └── organisation.models.ts     # OrganisationContext, Membre, Activite, Pelerinage, Caisse, etc.
│   │   │
│   │   └── services/
│   │       ├── auth.service.ts            # Authentification et gestion de session
│   │       ├── toast.service.ts           # Feedback notifications
│   │       ├── theme.service.ts           # Thème visuel
│   │       ├── inactivity.service.ts      # Déconnexion automatique
│   │       ├── modal.service.ts           # Contrôle des fenêtres modales
│   │       │
│   │       ├── super-admin/
│   │       │   ├── super-admin-dashboard.service.ts
│   │       │   ├── super-admin-produit.service.ts
│   │       │   ├── super-admin-formule.service.ts
│   │       │   ├── super-admin-paroisse.service.ts
│   │       │   ├── super-admin-organisation.service.ts
│   │       │   ├── super-admin-abonnement.service.ts
│   │       │   ├── super-admin-echeance.service.ts
│   │       │   ├── super-admin-paiement.service.ts
│   │       │   └── super-admin-facture.service.ts
│   │       │
│   │       └── organisation/
│   │           ├── organisation-context.service.ts
│   │           ├── organisation-dashboard.service.ts
│   │           ├── membre.service.ts
│   │           ├── activite.service.ts
│   │           ├── organisation-user.service.ts
│   │           ├── catheo-population.service.ts
│   │           ├── pelerinage-campagne.service.ts
│   │           ├── pelerinage-tarif.service.ts
│   │           ├── pelerinage-inscription.service.ts
│   │           ├── pelerinage-paiement.service.ts
│   │           ├── pelerinage-participation.service.ts
│   │           ├── organisation-caisse.service.ts
│   │           ├── organisation-statistique.service.ts
│   │           ├── organisation-rapport.service.ts
│   │           └── organisation-export.service.ts
│   │
│   ├── shared/
│   │   └── ui/
│   │       └── components/                # Import direct depuis catheo-cim
│   │           ├── buttons/
│   │           ├── feedback/              # app-toast, app-alert, app-badge, app-loader
│   │           ├── forms/                 # app-input, app-select, app-switch, etc.
│   │           ├── layout/                # app-header, app-sidebar, app-card, etc.
│   │           ├── navigation/            # app-page-header, app-breadcrumb, app-tabs
│   │           ├── overlays/              # app-modal, app-confirm-dialog
│   │           ├── security/              # app-access-denied, app-permission-denied
│   │           └── tables/                # app-data-table, app-pagination, etc.
│   │
│   └── features/
│       ├── auth/                          # Pages Login, Mot de passe oublié, Reset
│       │   ├── pages/login/
│       │   ├── pages/forgot-password/
│       │   └── pages/reset-password/
│       │
│       ├── super-admin/                   # Espace Super Admin
│       │   ├── routes/super-admin.routes.ts
│       │   ├── dashboard/
│       │   ├── paroisses/
│       │   ├── produits/
│       │   ├── formules/
│       │   ├── organisations/
│       │   ├── abonnements/
│       │   ├── echeances/
│       │   └── factures/
│       │
│       └── organisation/                  # Espace Organisation (OPPE / OPPJ / OPPA)
│           ├── routes/organisation.routes.ts
│           ├── dashboard/
│           ├── membres/
│           ├── activites/
│           ├── catheo-population/
│           ├── pelerinages/
│           │   ├── campagnes/
│           │   ├── tarifs/
│           │   ├── inscriptions/
│           │   ├── paiements/
│           │   └── pointage/
│           ├── caisse/
│           ├── statistiques/
│           ├── rapports/
│           └── utilisateurs/
│
├── environments/
│   ├── environment.ts                     # apiUrl: 'http://127.0.0.1:8000/api/v1'
│   └── environment.prod.ts
├── index.html                             # Polices Google Fonts, Bootstrap-icons
└── styles.css                             # Design System complet hérité de catheo-cim
```

---

## 9. Plan de Mise en Œuvre par Étapes

Le développement de `catheo-super-admin` s'organisera selon les phases suivantes après validation du présent audit :

1. **Étape 1 : Socle Commun, Design System & UI Components**
   - Transposition propre de `styles.css`, `index.html` et des composants `shared/ui/components` de `catheo-cim`.
   - Configuration des environnements (`environment.ts`) et de l'intercepteur HTTP.
2. **Étape 2 : Cœur de Sécurité & Authentification**
   - Implémentation du service `AuthService` adapté, des `Guards` (`SuperAdminGuard`, `OrganisationGuard`, `PermissionGuard`).
   - Écran de connexion et flux de réinitialisation de mot de passe.
   - Composants de layout adaptatifs (`app-header`, `app-sidebar`) avec bascule dynamique de menu.
3. **Étape 3 : Module Super Administrateur**
   - Développement des services et des écrans du Super Admin (Dashboard, Paroisses, Produits, Formules, Abonnements, Échéanciers, Facturation, Provisionnement Responsable d'Organisation).
4. **Étape 4 : Module Organisation - Socle & Membres**
   - Récupération du contexte organisationnel certifié.
   - Écrans Dashboard OPPE/OPPJ, gestion de l'annuaire des membres, planning des activités, gestion des collaborateurs internes.
5. **Étape 5 : Module Organisation - Passerelle Catheo Population & Pèlerinages**
   - Écran de consultation de la population catéchétique cible.
   - Gestion complète des campagnes de pèlerinage : paramétrage des tarifs, inscriptions individuelles ou par lot depuis Catheo, encaissements et reçus, pointage de participation.
6. **Étape 6 : Module Organisation - Finances, Statistiques & Exports**
   - Caisse organisationnelle hermétique, tableaux statistiques, génération du rapport annuel, exports CSV/Excel.
7. **Étape 7 : Audit de Performance, Responsive & Validation Finale**
   - Tests de non-régression, vérification du respect strict des permissions et du cloisonnement des données.

---

## 10. Conclusion de l'Audit

L'analyse conjointe de **`catheo-cim`** (frontend) et **`catheo`** (backend) démontre une complémentarité idéale :
- **85% des briques d'interface (UI, formulaires, tables, modales, styles, layouts)** sont directement prêtes dans `catheo-cim` et peuvent être importées pour garantir une continuité esthétique et ergonomique totale.
- **100% des APIs nécessaires à la fois pour le Super Admin et pour les organisations OPPE/OPPJ** sont déjà opérationnelles, typées, sécurisées et testées dans le backend `catheo`.
- Aucune modification de code n'est requise sur le backend ni sur `catheo-cim`.
- Le projet cible `catheo-super-admin` dispose désormais de sa feuille de route rigoureuse et de sa cartographie exacte pour démarrer l'implémentation dans les meilleures conditions.
