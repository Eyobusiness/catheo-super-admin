# F20 — Audit Backend : Statistiques & Rapports

## 1. Contexte & Architecture Backend
- **Projet Backend** : Laravel (catheo)
- **Authentification & Contexte** : Laravel Sanctum + Middleware de contexte organisation (`/api/v1/organisation/...`).
- **Multi-Tenant Strict** : L'organisation est résolue par le backend à partir du token Sanctum et stockée dans `$request->attributes->get('organisation')`. Aucune organisation arbitraire n'est passée par le frontend.
- **Règles Pastorales CATHEO** :
  - `OPPE` : `SEC-ENFANTS-PRI` et `SEC-ENFANTS-COL`
  - `OPPJ` : `SEC-JEUNES`
  - `OPPA` : `SEC-ADULTES`
  - Année catéchétique active/courante résolue par le backend (`AnneeCatechese::getAnneeCourante($paroisseId)`).

---

## 2. Endpoints Réels Découverts

### 2.1 Dashboard Général Consolidé
- **Route** : `GET /api/v1/organisation/dashboard`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationDashboardController@index`
- **Service** : `App\Services\Organisation\OrganisationDashboardService`
- **Permission requise** : `dashboard.read`
- **Paramètres** : `fresh` (boolean, bypass cache)
- **Données retournées** :
  - `organisation` : { id, uuid, code, nom, type_organisation, statut }
  - `membres` : { total, actifs, inactifs }
  - `activites` : { total, brouillon, planifiees, en_cours, terminees, annulees, taux_moyen_execution }
  - `pelerinages` : { campagnes_total, campagnes_ouvertes, campagnes_cloturees, campagnes_annulees, capacite_totale, places_occupees, places_restantes, total_inscrits, inscrits_payes, inscrits_partiellement_payes, inscrits_en_attente, inscrits_annules, inscrits_presents, inscrits_absents, montant_attendu, montant_encaisse, reste_a_encaisser }
  - `finances` : { total_entrees, total_sorties, solde, recettes_pelerinages, autres_recettes }
  - `catheo` : { catheo_connecte, annee_catechese, total_population, sections, repartition_classes, repartition_niveaux }

### 2.2 Statistiques Spécialisées : Membres
- **Route** : `GET /api/v1/organisation/statistiques/membres`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationStatistiqueController@membres`
- **Service** : `App\Services\Organisation\OrganisationStatistiqueService::getStatistiquesMembres`
- **Permission requise** : `statistiques.read`
- **Filtres supportés** :
  - `statut` (string : 'actif', 'inactif', etc.)
  - `sexe` (string : 'M', 'F')
  - `fonction` (string)
  - `date_debut` (date : YYYY-MM-DD)
  - `date_fin` (date : YYYY-MM-DD)
- **Format de réponse** :
  ```json
  {
    "status": "success",
    "message": "Statistiques des membres récupérées avec succès.",
    "data": {
      "total": 120,
      "actifs": 110,
      "inactifs": 10,
      "repartition_sexe": { "M": 60, "F": 50 },
      "repartition_fonction": { "Responsable": 2, "Membre": 108 },
      "evolution_adhesions": { "2026-01": 5, "2026-02": 8 }
    }
  }
  ```

### 2.3 Statistiques Spécialisées : Activités
- **Route** : `GET /api/v1/organisation/statistiques/activites`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationStatistiqueController@activites`
- **Service** : `App\Services\Organisation\OrganisationStatistiqueService::getStatistiquesActivites`
- **Permission requise** : `statistiques.read`
- **Filtres supportés** :
  - `statut` (string : 'brouillon', 'planifiee', 'en_cours', 'terminee', 'annulee')
  - `type_activite` (string)
  - `date_debut` (date : YYYY-MM-DD)
  - `date_fin` (date : YYYY-MM-DD)
- **Format de réponse** :
  ```json
  {
    "status": "success",
    "message": "Statistiques des activités récupérées avec succès.",
    "data": {
      "total": 15,
      "taux_moyen_execution": 85.5,
      "repartition_statut": { "terminee": 10, "planifiee": 4, "annulee": 1 },
      "repartition_type": { "Formation": 5, "Retraite": 3 },
      "activites_par_periode": { "2026-01": 2, "2026-02": 4 }
    }
  }
  ```

### 2.4 Statistiques Spécialisées : Pèlerinages
- **Route** : `GET /api/v1/organisation/statistiques/pelerinages`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationStatistiqueController@pelerinages`
- **Service** : `App\Services\Organisation\OrganisationStatistiqueService::getStatistiquesPelerinages`
- **Permission requise** : `statistiques.read`
- **Filtres supportés** :
  - `campagne_id` (integer)
  - `date_debut` (date : YYYY-MM-DD)
  - `date_fin` (date : YYYY-MM-DD)
  - `statut_inscription` ('en_attente', 'partiellement_payee', 'payee', 'annulee')
  - `type_participant` ('CATECHUMENE', 'EXTERNE')
- **Format de réponse** :
  ```json
  {
    "status": "success",
    "message": "Statistiques des pèlerinages récupérées avec succès.",
    "data": {
      "campagnes": {
        "total": 3,
        "repartition_statut": { "ouverte": 1, "cloturee": 2 },
        "capacite_totale": 150,
        "places_occupees": 120,
        "places_restantes": 30,
        "taux_occupation": 80.0
      },
      "inscriptions": {
        "total": 125,
        "catheo": 90,
        "externes": 35,
        "payes": 80,
        "partiellement_payes": 30,
        "en_attente": 10,
        "annules": 5,
        "presents": 75,
        "absents": 5,
        "prevus": 40,
        "taux_presence": 93.75
      },
      "finances": {
        "montant_attendu": 3750000.0,
        "montant_encaisse": 3000000.0,
        "solde_restant": 750000.0,
        "taux_recouvrement": 80.0
      }
    }
  }
  ```

### 2.5 Statistiques Spécialisées : Finances
- **Route** : `GET /api/v1/organisation/statistiques/finances`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationStatistiqueController@finances`
- **Service** : `App\Services\Organisation\OrganisationStatistiqueService::getStatistiquesFinances`
- **Permission requise** : `statistiques.read`
- **Filtres supportés** :
  - `date_debut` (date : YYYY-MM-DD)
  - `date_fin` (date : YYYY-MM-DD)
  - `campagne_id` (integer)
- **Format de réponse** :
  ```json
  {
    "status": "success",
    "message": "Statistiques financières récupérées avec succès.",
    "data": {
      "total_entrees": 5400000.0,
      "total_sorties": 1200000.0,
      "solde": 4200000.0,
      "recettes_pelerinages": 4500000.0,
      "autres_recettes": 900000.0,
      "evolution_mensuelle": [
        { "periode": "2026-01", "entrees": 2000000.0, "sorties": 500000.0, "solde": 1500000.0 }
      ],
      "repartition_modes": [
        { "mode": "ESPECES", "total": 3000000.0, "count": 25 },
        { "mode": "MOBILE_MONEY", "total": 2400000.0, "count": 18 }
      ]
    }
  }
  ```

### 2.6 Population CATHEO
- **Route** : `GET /api/v1/organisation/catheo/population`
- **Route Dashboard** : `GET /api/v1/organisation/dashboard` (section `catheo`)
- **Permission requise** : `catheo.population.view` ou `dashboard.read`
- **Sections pastorales garanties** :
  - OPPE -> `SEC-ENFANTS-PRI` et `SEC-ENFANTS-COL`
  - OPPJ -> `SEC-JEUNES`
  - OPPA -> `SEC-ADULTES`

### 2.7 Rapport Annuel Consolidé
- **Route** : `GET /api/v1/organisation/rapports/annuel`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\OrganisationRapportController@annuel`
- **Service** : `App\Services\Organisation\OrganisationRapportService::getRapportAnnuel`
- **Permission requise** : `rapports.read`
- **Paramètre** : `annee` (integer, défaut: année courante `date('Y')`)
- **Format de réponse** :
  ```json
  {
    "status": "success",
    "message": "Rapport annuel de l'exercice 2026 récupéré avec succès.",
    "data": {
      "annee_exercice": 2026,
      "organisation": {
        "id": 1,
        "nom": "OPPE Sainte Famille",
        "code": "OPPE-001",
        "type_organisation": "OPPE"
      },
      "membres": {
        "total": 120,
        "actifs": 110,
        "inactifs": 10,
        "nouvelles_adhesions": 15
      },
      "activites": {
        "total": 12,
        "repartition_statut": { "terminee": 8, "planifiee": 4 },
        "taux_moyen_execution": 88.0
      },
      "pelerinages": {
        "campagnes": 2,
        "total_participants": 95,
        "presents": 90,
        "absents": 5,
        "taux_presence": 94.74
      },
      "finances": {
        "total_entrees": 4500000.0,
        "total_sorties": 1100000.0,
        "solde_net": 3400000.0
      },
      "catheo": {
        "catheo_connecte": true,
        "annee_catechese": "2025-2026",
        "total_population": 340,
        "sections": ["SEC-ENFANTS-PRI", "SEC-ENFANTS-COL"]
      }
    }
  }
  ```

---

## 3. Synthèse & Règles d'Intégration Frontend F20
1. **Pas de mock ni de chiffres fictifs** : Tous les indicateurs proviennent directement de ces endpoints.
2. **Page Statistiques** (`/organisation/statistiques`) :
   - Onglets thématiques ou sections claires : Vue globale (Dashboard), Membres, Activités, Pèlerinages, Finances, Population CATHEO.
   - Filtres dynamiques transmis directement à l'API (`date_debut`, `date_fin`, `statut`, `campagne_id`, etc.).
   - Utilisation des composants existants du Design System F3 : `app-stat-card`, `app-card`, `app-table`, `app-loading-state`, `app-empty-state`, `app-error-state`.
   - Graphiques CSS / barres d'évolution réelles ou tableaux récapitulatifs (taux de recouvrement, répartition par sexe, modes de paiement, etc.) sans dépendance externe lourde.
3. **Page Rapport Annuel** (`/organisation/rapports`) :
   - Sélection d'année d'exercice (ex: 2024, 2025, 2026, 2027).
   - Affichage complet du rapport annuel consolidé (Membres, Activités, Pèlerinages, Finances, CATHEO si connecté).
   - Format monétaire standard `formatCfa` (`30 000 FCFA`).
4. **Permissions & Guards** :
   - Protégé par `AuthGuard` et `OrganisationGuard`.
   - Sidebar : items existants `org_statistiques` (`statistiques.read`) et `org_rapports` (`rapports.read`).
