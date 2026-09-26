# F13 — Audit Backend : Dashboard OPPE & Population CATHEO

**Date :** 2026-09-19  
**Cible :** Backend central Laravel (`catheo`) & Frontend Angular (`catheo-super-admin`)  
**Statut :** AUDITÉ ET CONFORME  

---

## 1. Endpoints Backend Réels & Vérifiés

Le backend Laravel expose le dashboard consolidé de l'organisation sous le préfixe `/api/v1/organisation` :

| Donnée | Endpoint | Méthode HTTP | Paramètres | Source backend (Contrôleur / Service) | Utilisation Angular |
|---|---|---|---|---|---|
| **Dashboard consolidé** | `/api/v1/organisation/dashboard` | `GET` | `fresh` (boolean, optionnel) | `OrganisationDashboardController@index` $\rightarrow$ `OrganisationDashboardService@getDashboard` | Chargement principal des KPIs, synthèses et métriques |
| **Population CATHEO détaillée** | `/api/v1/organisation/catheo/population` | `GET` | `niveau_id`, `classe_id`, `sexe`, `search`, `page`, `per_page` | `CatheoPopulationController@index` $\rightarrow$ `CatheoPopulationService@getPopulation` | Consultation des effectifs paginés |
| **Statistiques membres** | `/api/v1/organisation/statistiques/membres` | `GET` | Aucun | `OrganisationStatistiqueController@membres` | Statistiques approfondies membres |
| **Statistiques activités** | `/api/v1/organisation/statistiques/activites` | `GET` | Aucun | `OrganisationStatistiqueController@activites` | Répartition des activités |
| **Statistiques pèlerinages** | `/api/v1/organisation/statistiques/pelerinages` | `GET` | Aucun | `OrganisationStatistiqueController@pelerinages` | Taux de remplissage et participants |
| **Statistiques finances** | `/api/v1/organisation/statistiques/finances` | `GET` | Aucun | `OrganisationStatistiqueController@finances` | Flux financiers entrées / sorties |

> **ATTENTION ROUTE PASSERELLE CATHEO** :
> La route exacte exposée dans `routes/api.php:688` est :  
> `GET /api/v1/organisation/catheo/population` (avec slash intermédiaire, géré par `CatheoPopulationController::class`).  
> Pour le Dashboard OPPE (F13), la source principale directe est `GET /api/v1/organisation/dashboard` qui fournit nativement le bloc consolidé `data.catheo` avec les effectifs primaire/collège.

---

## 2. Structure Réelle de la Réponse `GET /api/v1/organisation/dashboard`

```json
{
  "status": "success",
  "message": "Tableau de bord de l'organisation récupéré avec succès.",
  "data": {
    "organisation": {
      "id": 1,
      "uuid": "9e1c2d3e-...",
      "code": "OPPE-01",
      "nom": "Enfance Missionnaire Sainte Famille",
      "type_organisation": "OPPE",
      "statut": "actif"
    },
    "membres": {
      "total": 45,
      "actifs": 40,
      "inactifs": 5
    },
    "activites": {
      "total": 12,
      "brouillon": 2,
      "planifiees": 4,
      "en_cours": 3,
      "terminees": 3,
      "annulees": 0,
      "taux_moyen_execution": 65.5
    },
    "pelerinages": {
      "campagnes_total": 2,
      "campagnes_ouvertes": 1,
      "campagnes_cloturees": 1,
      "campagnes_annulees": 0,
      "capacite_totale": 100,
      "places_occupees": 75,
      "places_restantes": 25,
      "total_inscrits": 75,
      "inscrits_payes": 50,
      "inscrits_partiellement_payes": 15,
      "inscrits_en_attente": 10,
      "inscrits_annules": 0,
      "inscrits_presents": 0,
      "inscrits_absents": 0,
      "montant_attendu": 1500000.0,
      "montant_encaisse": 1100000.0,
      "reste_a_encaisser": 400000.0
    },
    "finances": {
      "total_entrees": 2500000.0,
      "total_sorties": 1200000.0,
      "solde_caisse": 1300000.0
    },
    "catheo": {
      "catheo_connecte": true,
      "annee_catechese": "2026-2027",
      "total_population": 380,
      "total_primaire": 240,
      "total_college": 140,
      "repartition_niveaux": [
        { "niveau_id": 1, "niveau": "Éveil à la foi", "total": 60 },
        { "niveau_id": 2, "niveau": "1ère Année", "total": 90 }
      ],
      "repartition_classes": [
        { "classe_id": 1, "classe": "Saint Joseph", "total": 35 }
      ]
    }
  }
}
```

---

## 3. Règle Métier CATHEO pour OPPE

Dans `App\Services\Organisation\CatheoPopulationService` :
- **Sections Cibles OPPE** :
  - `SEC-ENFANTS-PRI` : Primaire $\rightarrow$ alimente `data.catheo.total_primaire`
  - `SEC-ENFANTS-COL` : Collège $\rightarrow$ alimente `data.catheo.total_college`
  - `data.catheo.total_population` = `total_primaire` + `total_college`
- **Année Active** : Filtrage strict sur `annee_catechese_id === AnneeCatechese::getAnneeCourante($paroisseId)->id`.
- Si aucune année n'est active, `data.catheo.catheo_connecte` vaut `false` avec le message *"Aucune année catéchétique active sur la paroisse"*.

---

## 4. Sécurité & Multi-Tenant

- Route protégée par `['auth:sanctum', 'organisation']` et `permission:dashboard.read`.
- Le middleware `EnsureOrganisationContext` extrait l'organisation de l'utilisateur connecté via son jeton de session.
- L'isolation est stricte : un utilisateur de l'organisation OPPE de la paroisse A ne peut accéder qu'aux données de son organisation.

---

## 5. Données Absentes / Limitations Documentées

- Le backend ne renvoie pas de liste des "activités récentes" sous un endpoint dédié `dashboard/activites-recentes` (les activités sont gérées sous `/organisation/activites`).
- Le calcul de `taux_recouvrement` ou de métriques financières composites n'est pas réinventé côté client : le frontend exploite directement `total_entrees`, `total_sorties` et `solde_caisse` calculés par Laravel.
