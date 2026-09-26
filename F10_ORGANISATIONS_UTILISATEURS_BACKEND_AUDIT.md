# F10 — Audit Backend : Organisations & Utilisateurs

**Date d'audit :** 2026-09-19  
**Cible :** Backend Laravel central (`catheo`) et application `catheo-super-admin`  
**Statut :** AUDITÉ ET CONFORME  

---

## 1. Contexte Architectural

Le backend Laravel central applique une architecture SaaS multi-produits et multi-organisations :
- **Produits SaaS :** `CATHEO` (cœur paroissial), `OPPE` (Enfance), `OPPJ` (Jeunesse), `OPPA` (Adultes).
- **Entité Organisation :** Représente l'espace métier d'une paroisse pour un produit donné (`OPPE`, `OPPJ`, `OPPA`). Une paroisse ne peut posséder qu'une seule organisation active par type (règle d'unicité garantie par la base et le backend).
- **Rattachement Utilisateur :** Un utilisateur organisationnel est rattaché à une organisation via `users.organisation_id` avec un profil métier strictement compatible avec le type d'organisation.
- **Rôle Super Admin :** Le Super Administrateur opère au niveau plateforme et supervise l'ensemble des organisations et de leurs utilisateurs sans être restreint au contexte d'une paroisse unique.

---

## 2. Inventaire Détaillé des Endpoints Disponibles

### 2.1 Espace Super Admin (`/api/v1/super-admin/*`)

| Méthode | Endpoint | Contrôleur / Action | Description | Paramètres / Payload |
|---|---|---|---|---|
| **GET** | `/api/v1/super-admin/organisations` | `SuperAdminOrganisationController@index` | Liste paginée de toutes les organisations avec filtres | `type_organisation` (`OPPE`, `OPPJ`, `OPPA`, `tous`), `statut` (`actif`, `inactif`, `suspendu`, `tous`), `paroisse_id` (ID), `per_page`, `page` |
| **GET** | `/api/v1/super-admin/organisations/{id}` | `SuperAdminOrganisationController@show` | Détail d'une organisation (accepte ID ou UUID) avec relations `produit`, `paroisse`, `users.profil`, compteurs `membres`, `activites`, `users` | Aucun |
| **POST** | `/api/v1/super-admin/organisations/{id}/responsable` | `SuperAdminOrganisationController@createResponsable` | Provisionnement du premier responsable de l'organisation | `StoreResponsableOrganisationRequest` :<br>- `name` (requis, string, max:255)<br>- `email` (requis, email, unique:users)<br>- `telephone` (optionnel, string)<br>- `password` (optionnel, min:8)<br>- `profil_id` (optionnel, integer) |

### 2.2 Endpoints Inexistants au Niveau Super Admin (À NE PAS INVENTER)

- ❌ `POST /api/v1/super-admin/organisations` : **N'EXISTE PAS**. Les organisations ne sont pas créées par un formulaire isolé ; elles sont créées/activées automatiquement lors de la souscription/activation d'un produit pour une paroisse.
- ❌ `DELETE /api/v1/super-admin/organisations/{id}` : **N'EXISTE PAS**. Les organisations ne peuvent être supprimées de manière arbitraire.
- ❌ `PATCH /api/v1/super-admin/organisations/{id}/statut` : **N'EXISTE PAS**. La transition de statut direct n'est pas exposée sous cette route.
- ❌ `GET /api/v1/super-admin/utilisateurs` : **N'EXISTE PAS**. L'endpoint global `/api/v1/users` est strictement scopé à une paroisse (`paroisse_configuration_id`). Il n'existe pas d'endpoint super-admin retournant tous les utilisateurs de toutes les organisations en vrac. Conformément à la section 26 du prompt, les utilisateurs sont gérés par organisation.

### 2.3 Endpoints Organisationnels Disponibles via En-tête de Contexte (`X-Organisation-Id`)

Pour le Super Admin, le middleware `EnsureOrganisationContext` et `SecurityContextService` permettent d'interagir avec les routes organisationnelles en passant l'en-tête `X-Organisation-Id: {id}` :

| Méthode | Endpoint | Contrôleur / Action | Description | Payload / Paramètres |
|---|---|---|---|---|
| **GET** | `/api/v1/organisation/users` | `OrganisationUserController@index` | Liste paginée des utilisateurs de l'organisation | `search`, `statut`, `profil_id`, `per_page`, `page` |
| **POST** | `/api/v1/organisation/users` | `OrganisationUserController@store` | Création d'un utilisateur dans l'organisation | `name`, `email`, `telephone`, `password`, `profil_id`, `user_type`, `statut` |
| **GET** | `/api/v1/organisation/users/{id}` | `OrganisationUserController@show` | Détail d'un utilisateur de l'organisation | Aucun |
| **PUT** | `/api/v1/organisation/users/{id}` | `OrganisationUserController@update` | Modification d'un utilisateur | `name`, `email`, `telephone`, `password`, `profil_id`, `statut` |
| **PATCH** | `/api/v1/organisation/users/{id}/toggle-status` | `OrganisationUserController@toggleStatus` | Activation / désactivation d'un utilisateur | Aucun |
| **GET** | `/api/v1/organisation/profils` | `OrganisationProfileController@index` | Liste des profils autorisés pour le type d'organisation | Aucun |
| **PUT** | `/api/v1/organisation/info` | `OrganisationController@updateInfo` | Modification des informations et coordonnées de l'organisation | `nom`, `description`, `telephone`, `email`, `adresse`, `responsable_nom`, `responsable_telephone`, `responsable_email` |

---

## 3. Matrice de Cohérence des Profils et Types d'Organisation

| Type Organisation | Code Métier | Profils Autorisés | Profils Interdits |
|---|---|---|---|
| **OPPE** | Enfance | `RESPONSABLE_OPPE`, `UTILISATEUR_OPPE` | Profils OPPJ, OPPA, Paroisse, Super Admin |
| **OPPJ** | Jeunesse | `RESPONSABLE_OPPJ`, `UTILISATEUR_OPPJ` | Profils OPPE, OPPA, Paroisse, Super Admin |
| **OPPA** | Adultes | `RESPONSABLE_OPPA`, `UTILISATEUR_OPPA` | Profils OPPE, OPPJ, Paroisse, Super Admin |

---

## 4. Statuts Disponibles

### Statuts d'Organisation
- `actif` : Organisation opérationnelle.
- `inactif` : Organisation non configurée ou en attente d'initialisation.
- `suspendu` : Organisation suspendue (p.ex. suite à impayé ou suspension abonnement).

### Statuts d'Utilisateur
- `actif` : Utilisateur autorisé à se connecter.
- `inactif` : Compte désactivé.

---

## 5. Gestion des Réponses et Erreurs

- `200 OK` / `201 Created` : Enveloppé dans `ApiResponse<T>` (`{ success: true, data: ... }`).
- `401 Unauthorized` : Token expiré ou invalide.
- `403 Forbidden` : Rôle insuffisant ou tentative d'accès non autorisé.
- `404 Not Found` : Organisation ou utilisateur introuvable.
- `409 Conflict` : Conflit d'unicité (p.ex. paroisse a déjà une organisation active de ce type).
- `422 Unprocessable Entity` : Erreurs de validation `FormRequest` (`email` invalide ou déjà pris, mot de passe trop court, etc.).
- `500 Server Error` : Erreur interne sans divulgation de détails techniques.

---

## 6. Décisions pour l'Implémentation Angular

1. **Navigation :**
   - Ajouter l'entrée **Organisations** (`/super-admin/organisations`) dans le menu Super Admin du `SidebarService`.
   - Ajuster l'entrée `sa_utilisateurs` ou documenter que la gestion des utilisateurs s'effectue au sein de chaque organisation via `/super-admin/organisations/:id/utilisateurs`.
2. **Page Liste des Organisations :**
   - Tableau avec Nom, Type (`OPPE`, `OPPJ`, `OPPA`), Paroisse rattachée, Statut, Responsable principal, Compteurs utilisateurs/membres, Actions.
   - Filtres serveur : Type d'organisation, Statut, Recherche.
   - Pagination serveur.
3. **Page Détail de l'Organisation :**
   - Fiche d'identité complète (nom, type, statut, paroisse, produit).
   - Coordonnées et informations de contact.
   - Section "Premier Responsable" : bouton pour provisionner le premier responsable si aucun n'est encore assigné ou pour en créer un.
   - Section "Utilisateurs de l'organisation" : tableau des utilisateurs avec statut, profil, et actions (création, modification, activation/désactivation).
   - Modification des informations de l'organisation via `PUT /api/v1/organisation/info` (avec en-tête `X-Organisation-Id`).
4. **Formulaire Premier Responsable (`FirstResponsableFormComponent`) :**
   - Champs strictement alignés sur `StoreResponsableOrganisationRequest` : `name`, `email`, `telephone`, `password`.
   - Attribution automatique du profil correspondant au type de l'organisation (`RESPONSABLE_{type_organisation}`).
5. **Gestion des Utilisateurs de l'Organisation :**
   - Création / édition d'utilisateur avec sélection du profil strictement limité aux profils du type d'organisation.
   - Toggle statut (actif / inactif).
