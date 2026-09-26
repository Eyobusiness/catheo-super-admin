# Audit Backend — Étape F17 : Population CATHEO

> **Date** : 23 Septembre 2026  
> **Projet Frontend** : `catheo-super-admin` (Angular 21)  
> **Projet Backend** : `catheo` (Laravel 11, PHP 8.2+)  
> **Auteur** : Antigravity Assistant

---

## 1. Contexte & Périmètre Pastoral

L'étape F17 a pour objectif de connecter l'espace Organisation (OPPE, OPPJ, OPPA) aux cohortes réelles de catéchèse gérées dans le système central CATHEO, sans duplication de données, sans mocks ni données fictives, et avec un cloisonnement multi-tenant rigoureux.

---

## 2. Endpoints Backend Audités

### 2.1 Endpoint Principal : Population Catéchétique
- **Route** : `GET /api/v1/organisation/catheo/population`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\CatheoPopulationController@index`
- **Nom de Route** : `organisation.catheo.population`
- **Authentification** : Sanctum Bearer Token (`auth:sanctum`)
- **Middlewares** :
  - `auth:sanctum`
  - `role.or.permission:super-admin,admin,responsable,animateur,secretaire,tresorier,utilisateur`
  - `organisation.context` (résout et injecte l'organisation authentifiée et sa paroisse de rattachement)

### 2.2 Endpoint Synthèse : Dashboard Organisation
- **Route** : `GET /api/v1/organisation/dashboard`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\DashboardController@index`
- **Objet extrait** : `data.catheo` contenant l'état de connexion (`catheo_connecte`), l'année active (`annee_catechese`), les effectifs consolidés par cycle (`total_population`, `total_primaire`, `total_college`, `total_jeunes`, `total_adultes`), ainsi que les ventilations `repartition_niveaux` et `repartition_classes`.

---

## 3. Règles Métier de Section & Mapping Officiel

Le backend Laravel applique strictement les codes de section normalisés suivants pour isoler les cohortes :

| Type Organisation | Périmètre Pastoral | Sections Autorisées (Codes Officiels) | Niveaux CATHEO |
| :--- | :--- | :--- | :--- |
| **OPPE** | Enfants | `SEC-ENFANTS-PRI`<br>`SEC-ENFANTS-COL` | Primaire : 1ère à 3ème Année<br>Collège : 1ère à 5ème Année |
| **OPPJ** | Jeunes | `SEC-JEUNES` | 1ère à 5ème Année |
| **OPPA** | Adultes | `SEC-ADULTES` | 1ère à 4ème Année |

**Garantie de Sécurité Backend** :
Les sections cibles sont déterminées côté serveur en fonction du champ `type_organisation` (`OPPE`, `OPPJ`, `OPPA`) de l'organisation liée à la session. Une organisation OPPE ne peut en aucun cas interroger ou recevoir les catéchumènes de `SEC-JEUNES` ou `SEC-ADULTES`.

---

## 4. Année Catéchétique Active

- **Règle** : Seule la cohorte active de l'année pastorale en cours est retournée.
- **Détermination** : Laravel résout l'année active via `AnneeCatechese::where('statut', 'active')->first()` rattachée à la paroisse.
- **Frontend** : Aucune année n'est codée en dur (pas de `2025`, `2026`). La valeur textuelle retournée (ex: `2025-2026`) est directement affichée dynamiquement.

---

## 5. Capacités de Recherche & Filtres Serveur

L'endpoint `GET /api/v1/organisation/catheo/population` prend en charge les paramètres de requête suivants :

| Paramètre | Type | Rôle / Comportement |
| :--- | :--- | :--- |
| `search` | `string` | Recherche textuelle insensible à la casse sur `matricule`, `nom`, `prenoms`. |
| `sexe` | `string` | Filtre par genre : `'M'` (Masculin) ou `'F'` (Féminin). |
| `niveau_id` | `int/string` | Filtre optionnel sur l'identifiant du niveau catéchétique. |
| `classe_id` | `int/string` | Filtre optionnel sur l'identifiant de la classe pastorale. |
| `page` | `integer` | Numéro de la page demandée (défaut : 1). |
| `per_page` | `integer` | Nombre d'inscriptions par page (défaut : 15). |

---

## 6. Structure de la Réponse JSON & Resource

La réponse JSON est sérialisée par `CatheoPopulationResource` :

```json
{
  "success": true,
  "data": [
    {
      "inscription_id": 101,
      "code_inscription": "INS-2025-001",
      "date_inscription": "2025-09-10",
      "statut_inscription": "valide",
      "catechumene": {
        "id": 501,
        "matricule": "CAT-2025-0501",
        "nom": "KOUASSI",
        "prenoms": "Emmanuel",
        "nom_complet": "KOUASSI Emmanuel",
        "sexe": "M",
        "date_naissance": "2014-04-12",
        "telephone": null,
        "email": null,
        "nom_pere": "KOUASSI Jean",
        "nom_mere": "YAO Marie",
        "contact_parent": "+225 0707070707"
      },
      "section": {
        "id": 1,
        "code": "SEC-ENFANTS-PRI",
        "nom": "Enfants Primaire"
      },
      "niveau": {
        "id": 2,
        "nom": "2ème Année Primaire"
      },
      "classe": {
        "id": 3,
        "nom": "Classe Saint Jean"
      },
      "annee_catechese": {
        "id": 5,
        "libelle": "2025-2026",
        "statut": "active"
      }
    }
  ],
  "meta": {
    "type_organisation": "OPPE",
    "sections_cibles": ["SEC-ENFANTS-PRI", "SEC-ENFANTS-COL"],
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 1
  }
}
```

---

## 7. Protection des Données Sensibles & Permissions

1. **Consultation Seule (Lecture Stricte)** :
   - L'espace organisation ne dispose d'aucun droit de création, modification ou suppression sur les dossiers catéchumènes de CATHEO.
   - Les actions administratives de modification restent cantonnées au module central CATHEO Admin.
2. **Permissions RBAC** :
   - Requiert la permission `catheo.population.view` ou le rôle organisationnel associé (`Responsable`, `Utilisateur`).
3. **Protection des Données Personnelles** :
   - Les informations administratives sensibles (mots de passe, logs de sécurité) sont exclues de la Resource.

---

## 8. Mode Connecté vs Mode Autonome

- **Mode Connecté (`catheo_connecte === true`)** :
  - Accès complet aux effectifs, synthèse KPI, filtres, table paginée et consultation détaillée.
- **Mode Autonome (`catheo_connecte === false`)** :
  - Si la paroisse ou l'organisation n'a pas activé la synchronisation avec CATHEO, le frontend affiche un état clair et explicite : *« Population CATHEO indisponible — La connexion avec le système central CATHEO n'est pas activée pour cette organisation. »*
  - **Règle absolue respectée** : Aucune donnée fictive générée et le statut « Déconnecté » n'est jamais interprété comme « 0 catéchumène ».

---

## 9. Isolation Multi-Tenant

L'isolation est assurée à 3 niveaux :
1. **Au niveau de la paroisse** : L'organisation ne voit que les catéchumènes inscrits dans sa propre paroisse (`paroisse_configuration_id`).
2. **Au niveau du type d'organisation** : Filtrage strict par `sections_cibles` côté backend.
3. **Au niveau de l'année active** : Exclusion automatique des années archivées ou antérieures.
