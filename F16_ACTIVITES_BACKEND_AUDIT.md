# AUDIT BACKEND LARAVEL — MODULE ACTIVITÉS (ÉTAPE F16)

## 1. Contexte & Périmètre de l'Audit

- **Application Backend** : CATHEO (Laravel 12 / Sanctum)
- **Fichier de routage** : `c:\xampp\htdocs\catheo\routes\api.php`
- **Contrôleur** : `App\Http\Controllers\Api\V1\Organisation\ActiviteController`
- **Service** : `App\Services\Organisation\ActiviteService`
- **Requêtes FormRequest** : `StoreActiviteRequest`, `UpdateActiviteRequest`
- **Ressource API** : `App\Http\Resources\Api\V1\Organisation\ActiviteResource`
- **Modèle Eloquent** : `App\Models\Activite` (table `activites`)

> **Distinction Métier** : Les activités sont les rassemblements, récollections, camps, célébrations et formations organisés par l'équipe pastorale organisationnelle (OPPE, OPPJ, OPPA). Elles ne doivent pas être confondues avec la gestion spécifique de la population catéchumène (F17) ni avec les campagnes complètes de pèlerinages (F18).

---

## 2. Endpoints Réels & Méthodes HTTP

Toutes les routes sont préfixées par `/api/v1/organisation/activites` et protégées par les middlewares :
- `auth:sanctum` (Authentification requise)
- `organisation` (Vérification et injection de l'organisation active dans `$request->attributes->get('organisation')`)

| Méthode | Route | Permission requise | Action Contrôleur | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/organisation/activites` | `activites.view` | `ActiviteController@index` | Liste paginée avec recherche (`search`) et filtres |
| `POST` | `/api/v1/organisation/activites` | `activites.create` / `activites.manage` | `ActiviteController@store` | Création et planification d'une activité |
| `GET` | `/api/v1/organisation/activites/{activite}` | `activites.view` | `ActiviteController@show` | Fiche détaillée avec vérification tenant (404 si hors tenant) |
| `PUT` | `/api/v1/organisation/activites/{activite}` | `activites.edit` / `activites.manage` | `ActiviteController@update` | Modification avec vérification tenant |
| `DELETE` | `/api/v1/organisation/activites/{activite}` | `activites.manage` | `ActiviteController@destroy` | Suppression douce (*Soft Delete* avec `SoftDeletes`) |

---

## 3. Paramètres de Requête (GET `/api/v1/organisation/activites`)

Le service `ActiviteService@list` supporte les paramètres suivants :

| Paramètre | Type | Validation / Valeurs | Description |
|---|---|---|---|
| `search` | `string` | Chaîne libre | Recherche plein texte sur `titre`, `code`, `description`, `lieu` |
| `statut` | `string` | `brouillon`, `planifiee`, `en_cours`, `terminee`, `annulee` | Filtrage par statut de l'activité (ignore `tous`) |
| `type_activite` | `string` | Chaîne libre (ex: Récollection, Camp, Formation...) | Filtrage par type d'activité |
| `date_debut` | `string` (date) | Format YYYY-MM-DD | Filtrage par date de début ($\ge \text{date\_debut}$) |
| `date_fin` | `string` (date) | Format YYYY-MM-DD | Filtrage par date de fin ($\le \text{date\_fin}$) |
| `page` | `integer` | $\ge 1$ (défaut : 1) | Numéro de la page demandée |
| `per_page` | `integer` | 1 à 100 (défaut : 15) | Nombre d'éléments par page |

---

## 4. Structure de la Réponse (`ActiviteResource`)

Le backend retourne un objet JSON standardisé :
```json
{
  "status": "success",
  "message": "Liste des activités récupérée avec succès.",
  "data": [
    {
      "id": "8f381cbb-1422-44b4-8231-15589c3bc8ef",
      "id_interne": 42,
      "organisation_id": "9d4948a3-23a7-4c45-9854-3e9c403378d1",
      "code": "ACT-2024-001",
      "titre": "Récollection de rentrée des jeunes",
      "description": "Temps fort spirituel et préparation de l'année pastorale.",
      "type_activite": "Récollection",
      "date_debut": "2024-10-15T08:30:00.000000Z",
      "date_fin": "2024-10-15T17:00:00.000000Z",
      "lieu": "Centre spirituel Sainte Thérèse",
      "responsable_id": "9d4948a3-23a7-4c45-9854-3e9c403378d1",
      "responsable": {
        "id": "9d4948a3-23a7-4c45-9854-3e9c403378d1",
        "id_interne": 10,
        "nom": "KOUAME",
        "prenoms": "Jean-Marc",
        "nom_complet": "KOUAME Jean-Marc",
        "sexe": "M",
        "fonction": "Coordinateur des jeunes",
        "statut": "actif"
      },
      "statut": "planifiee",
      "taux_execution": 35.0,
      "observation": "Prévoir sonorisation et livrets de messe.",
      "created_at": "2024-09-01T10:00:00.000000Z",
      "updated_at": "2024-09-10T12:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 35
  }
}
```

---

## 5. Règles de Création & Modification (FormRequests)

### `StoreActiviteRequest` & `UpdateActiviteRequest`
- `code` : optionnel, max 50 caractères, string.
- `titre` : requis, max 255 caractères, string.
- `description` : optionnel, string.
- `type_activite` : optionnel, max 100 caractères, string.
- `date_debut` : requis, format datetime valide.
- `date_fin` : optionnel, format datetime valide, doit être `after_or_equal:date_debut`.
- `lieu` : optionnel, max 255 caractères, string.
- `responsable_id` : optionnel, résolu depuis UUID ou ID numérique via `prepareForValidation()`, doit exister dans `membres`.
- `statut` : optionnel (défaut `brouillon` en création), enum strict : `['brouillon', 'planifiee', 'en_cours', 'terminee', 'annulee']`.
- `taux_execution` : optionnel (défaut `0.00`), float entre 0 et 100.
- `observation` : optionnel, string.

### Règles Métier Particulières
- `verifyResponsableBelongsToOrganisation` : Le backend vérifie obligatoirement que le responsable désigné est un membre de la même organisation (`organisation_id`), levant une `InvalidArgumentException` (code HTTP 422) en cas de non-respect.
- `unset($data['organisation_id'])` : En modification, l'organisation_id ne peut jamais être modifié ou détourné.

---

## 6. Multi-Tenant & Isolation Organisationnelle

- **Source de vérité tenant** : Déterminée par le middleware `organisation` via le contexte de session Sanctum `$request->attributes->get('organisation')`.
- **Requête de liste** : Toujours contrainte par `where('organisation_id', $organisation->id)`.
- **Création** : Affecte impérativement `$data['organisation_id'] = $organisation->id`.
- **Consultation / Modification / Suppression** : Si `(int) $activite->organisation_id !== (int) $organisation->id`, le backend renvoie une réponse HTTP `404 Not Found` immédiate.

---

## 7. Rôles et Permissions (RBAC)

- `activites.view` : Autorise la consultation de la liste et du détail.
- `activites.create` : Autorise l'accès au formulaire d'ajout et la création via POST.
- `activites.edit` : Autorise la mise à jour via PUT.
- `activites.manage` : Autorise l'administration complète incluant la suppression (DELETE).
