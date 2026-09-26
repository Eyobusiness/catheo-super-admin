# AUDIT BACKEND LARAVEL — MODULE MEMBRES (ÉTAPE F15)

## 1. Contexte & Périmètre de l'Audit

- **Application Backend** : CATHEO (Laravel 12 / Sanctum)
- **Fichier de routage** : `c:\xampp\htdocs\catheo\routes\api.php`
- **Contrôleur** : `App\Http\Controllers\Api\Organisation\MembreController`
- **Service** : `App\Services\Organisation\MembreService`
- **Requêtes FormRequest** : `StoreMembreRequest`, `UpdateMembreRequest`
- **Ressource API** : `App\Http\Resources\Organisation\MembreResource`
- **Modèle Eloquent** : `App\Models\Organisation\Membre` (table `membres`)

> **Règle fondamentale** : Les membres sont les animateurs, catéchistes, trésoriers et encadreurs de l'équipe pastorale organisationnelle. Ils ne doivent en aucun cas être confondus avec les catéchumènes (population CATHEO, F17).

---

## 2. Endpoints Réels & Méthodes HTTP

Toutes les routes sont préfixées par `/api/v1/organisation/membres` et protégées par les middlewares :
- `auth:sanctum` (Authentification requise)
- `permission:membres.view` (Pour la consultation)
- `permission:membres.manage` (Pour les mutations)

| Méthode | Route | Permission requise | Action Contrôleur | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/organisation/membres` | `membres.view` | `MembreController@index` | Liste paginée avec recherche et filtres |
| `POST` | `/api/v1/organisation/membres` | `membres.manage` | `MembreController@store` | Création d'un membre pour l'organisation active |
| `GET` | `/api/v1/organisation/membres/{membre}` | `membres.view` | `MembreController@show` | Fiche détaillée d'un membre |
| `PUT` | `/api/v1/organisation/membres/{membre}` | `membres.manage` | `MembreController@update` | Modification complète d'un membre |
| `DELETE` | `/api/v1/organisation/membres/{membre}` | `membres.manage` | `MembreController@destroy` | Suppression douce (*Soft Delete*) |

---

## 3. Paramètres de Requête (GET `/api/v1/organisation/membres`)

| Paramètre | Type | Validation / Valeurs | Description |
|---|---|---|---|
| `search` | `string` | Chaîne libre (insensible à la casse) | Recherche plein texte sur `nom`, `prenoms`, `telephone`, `email`, `quartier` |
| `statut` | `string` | `actif`, `inactif`, `suspendu` | Filtrage par statut pastoral du membre |
| `sexe` | `string` | `M`, `F` | Filtrage par genre |
| `fonction` | `string` | Chaîne libre | Filtrage par rôle ou fonction (ex: "Animateur", "Trésorier") |
| `page` | `integer` | $\ge 1$ (défaut : 1) | Numéro de la page demandée |
| `per_page` | `integer` | 1 à 100 (défaut : 15) | Nombre d'éléments par page |

---

## 4. Structure de la Réponse (`MembreResource`)

Le backend retourne un objet JSON standardisé :
```json
{
  "status": "success",
  "data": [
    {
      "id": "9d4948a3-23a7-4c45-9854-3e9c403378d1",
      "id_interne": 42,
      "nom": "KOUAME",
      "prenoms": "Jean-Marc",
      "nom_complet": "KOUAME Jean-Marc",
      "sexe": "M",
      "date_naissance": "1990-05-14",
      "telephone": "+2250701020304",
      "email": "jm.kouame@catheo.ci",
      "quartier": "Cocody Riviera",
      "adresse": "Rue des Jardins, Villa 12",
      "fonction": "Animateur principal",
      "date_entree": "2024-01-15",
      "statut": "actif",
      "photo_path": null,
      "observation": "Membre de l'équipe liturgique",
      "created_at": "2024-01-15T10:00:00.000000Z",
      "updated_at": "2024-01-15T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 4,
    "per_page": 15,
    "total": 52
  }
}
```

---

## 5. Règles de Création & Modification (FormRequests)

### Validation `StoreMembreRequest` & `UpdateMembreRequest`
- `nom` : requis (création), max 100 caractères, string.
- `prenoms` : requis (création), max 150 caractères, string.
- `sexe` : requis (création), enum strict `['M', 'F']`.
- `date_naissance` : nullable, format `date` valide, date passée.
- `telephone` : nullable, max 30 caractères, string.
- `email` : nullable, email valide, max 150 caractères.
- `quartier` : nullable, max 150 caractères.
- `adresse` : nullable, max 255 caractères.
- `fonction` : nullable, max 100 caractères.
- `date_entree` : nullable, format `date` valide.
- `statut` : optionnel/requis, enum strict `['actif', 'inactif', 'suspendu']` (défaut : `actif`).
- `observation` : nullable, max 1000 caractères.

---

## 6. Multi-Tenant & Isolation Organisationnelle

- **Source de vérité tenant** : Déterminée par le contexte utilisateur authentifié (`$request->user()->organisation_id` et relations de rattachement).
- **Sécurité d'accès** :
  - La requête `GET /api/v1/organisation/membres` applique automatiquement `where('organisation_id', $organisationId)`.
  - La création force automatiquement `$membre->organisation_id = $organisationId`.
  - Lors de `show`, `update` ou `destroy`, si le membre demandé n'appartient pas à l'organisation authentifiée, le contrôleur retourne immédiatement une erreur `404 Not Found` (protection d'isolation de données).
- **Zéro fuite** : Le client frontend n'a jamais besoin (et n'a pas le droit) de transmettre un paramètre `organisation_id` dans les requêtes.

---

## 7. Rôles et Permissions (RBAC)

- `membres.view` : Consultation de la liste des membres, filtres, recherche et fiche détaillée.
- `membres.manage` : Autorisation d'ajouter, modifier et supprimer des membres.
- Les rôles organisationnels (Responsable OPPE, Responsable OPPJ, Responsable OPPA) disposent de `membres.view` et `membres.manage`.
- Les utilisateurs en lecture seule ne disposent que de `membres.view` (les boutons d'action d'ajout, édition et suppression sont masqués côté Angular).
