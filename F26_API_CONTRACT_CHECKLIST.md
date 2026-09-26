# F26 — CHECKLIST DE CONFORMITÉ DES CONTRATS API F25
=============================================================================

> **Projet :** `catheo-super-admin`  
> **Backend :** Laravel API v1 (`/api/v1/super-admin/`)  
> **Type d'authentification :** Bearer Token (JWT / Sanctum)  
> **Format d'identifiant :** UUID v4 exclusivement (aucun identifiant entier)

---

## 1. Tableau de Vérification des Endpoints Consommés

| Module | Méthode | Route Backend Réelle | Service Angular | Modèle de Données | Statut Test |
|:---|:---:|:---|:---|:---|:---:|
| **Dashboard** | `GET` | `/api/v1/super-admin/dashboard` | `DashboardService.getDashboardData()` | `SuperAdminDashboardData` | **200 OK** |
| **Abonnements** | `GET` | `/api/v1/super-admin/abonnements/paroisses` | `AbonnementService.getAbonnementsParoisses()` | `AbonnementParoisse[]` | **200 OK** |
| **Abonnements** | `GET` | `/api/v1/super-admin/abonnements/organisations` | `AbonnementService.getAbonnementsOrganisations()` | `AbonnementOrganisation[]` | **200 OK** |
| **Abonnements** | `POST` | `/api/v1/super-admin/abonnements/organisations` | `AbonnementService.createAbonnementOrganisation()` | `{ organisation_uuid, formule_uuid }` | **201 OK** |
| **Paroisses** | `GET` | `/api/v1/super-admin/paroisses` | `SuperAdminParoisseService.getParoisses()` | `Paroisse[]` | **200 OK** |
| **Paroisses** | `GET` | `/api/v1/super-admin/paroisses/{uuid}` | `SuperAdminParoisseService.getParoisse(uuid)` | `ParoisseDetail` | **200 OK** |
| **Paroisses** | `POST` | `/api/v1/super-admin/paroisses` | `SuperAdminParoisseService.createParoisse()` | `{ nom, diocese, ... }` | **201 OK** |
| **Paroisses** | `PUT` | `/api/v1/super-admin/paroisses/{uuid}` | `SuperAdminParoisseService.updateParoisse(uuid)` | `{ ... }` | **200 OK** |
| **Organisations** | `GET` | `/api/v1/super-admin/organisations` | `SuperAdminOrganisationService.getOrganisations()` | `Organisation[]` | **200 OK** |
| **Organisations** | `GET` | `/api/v1/super-admin/organisations/{uuid}` | `SuperAdminOrganisationService.getOrganisation(uuid)` | `OrganisationDetail` | **200 OK** |
| **Organisations** | `POST` | `/api/v1/super-admin/organisations` | `SuperAdminOrganisationService.createOrganisation()` | `{ nom, type, mode, paroisse_uuid }` | **201 OK** |
| **Organisations** | `PUT` | `/api/v1/super-admin/organisations/{uuid}` | `SuperAdminOrganisationService.updateOrganisation(uuid)` | `{ ... }` | **200 OK** |
| **Organisations** | `GET` | `/api/v1/super-admin/organisations/{uuid}/formules` | `FormuleService.getFormulesForOrganisation(uuid)` | `Formule[]` | **200 OK** |
| **Produits** | `GET` | `/api/v1/super-admin/produits` | `ProduitService.getProduits()` | `Produit[]` | **200 OK** |
| **Formules** | `GET` | `/api/v1/super-admin/formules` | `FormuleService.getFormules(params)` | `Formule[]` | **200 OK** |
| **Formules** | `GET` | `/api/v1/super-admin/formules/{uuid}` | `FormuleService.getFormule(uuid)` | `Formule` | **200 OK** |
| **Utilisateurs** | `GET` | `/api/v1/super-admin/users` | `UtilisateurService.getUtilisateurs()` | `Utilisateur[]` | **200 OK** |
| **Utilisateurs** | `GET` | `/api/v1/super-admin/users/{uuid}` | `UtilisateurService.getUtilisateur(uuid)` | `Utilisateur` | **200 OK** |
| **Utilisateurs** | `POST` | `/api/v1/super-admin/users` | `UtilisateurService.createUtilisateur()` | `{ nom, email, role, ... }` | **201 OK** |
| **Utilisateurs** | `PUT` | `/api/v1/super-admin/users/{uuid}` | `UtilisateurService.updateUtilisateur(uuid)` | `{ ... }` | **200 OK** |
| **Utilisateurs** | `PATCH`| `/api/v1/super-admin/users/{uuid}/statut` | `UtilisateurService.changeStatut(uuid, statut)` | `{ statut }` | **200 OK** |
| **Utilisateurs** | `POST` | `/api/v1/super-admin/users/{uuid}/reset-password` | `UtilisateurService.resetPassword(uuid)` | `{ ... }` | **200 OK** |
| **Utilisateurs** | `DELETE`| `/api/v1/super-admin/users/{uuid}` | `UtilisateurService.deleteUtilisateur(uuid)` | — | **200 OK** |
| **Audit Logs** | `GET` | `/api/v1/super-admin/audit-logs` | `AuditService.getAuditLogs(params)` | `AuditLog[]` | **200 OK** |
| **Corbeille (Trash)** | `GET` | `/api/v1/super-admin/trash` | `TrashService.getTrashItems()` | `TrashItem[]` | **200 OK** |
| **Corbeille (Trash)** | `GET` | `/api/v1/super-admin/trash/{uuid}` | `TrashService.getTrashItem(uuid)` | `TrashItemDetail` | **200 OK** |
| **Corbeille (Trash)** | `POST` | `/api/v1/super-admin/trash/{uuid}/restore` | `TrashService.restoreItem(uuid)` | — | **200 OK** |
| **Corbeille (Trash)** | `DELETE`| `/api/v1/super-admin/trash/{uuid}/force` | `TrashService.forceDeleteItem(uuid)` | — | **200 OK** |
| **Profils & Rôles** | `GET` | `/api/v1/profils` | `OrganisationUserService.getProfils()` | `OrganisationProfil[]` | **200 OK** |

---

## 2. Validation des Spécifications Clés

### A. Séparation Stricte des Abonnements
- **Exigence :** Les abonnements diocésains CATHEO et les abonnements des organisations paroissiales (OPPE, OPPJ, OPPA) ne doivent jamais être mélangés dans le même appel API ou le même tableau non ventilé.
- **Vérification Frontend :**
  - Deux sous-services / méthodes distinctes : `getAbonnementsParoisses()` et `getAbonnementsOrganisations()`.
  - La page `abonnements-list-page.component.ts` dispose de sélecteurs explicites et d'indicateurs de compteurs indépendants.
  - La modale de souscription organisation charge exclusivement `GET /organisations/{uuid}/formules` et exclut formellement les formules de paroisse.

### B. Gestion des Modes d'Organisation (`liee` vs `independant`)
- **Exigence :** Présence d'un badge distinctif Vert pour le mode `liee` et Violet pour le mode `independant`.
- **Vérification Frontend :**
  - Implémenté dans `OrganisationStatusBadgeComponent` et réutilisé dans la liste des organisations et dans le tableau des organisations rattachées de la paroisse.

### C. Gestion des Suppressions Sécurisées (Soft Delete)
- **Exigence :** L'audit des suppressions et la restauration d'entités doivent être découplés du journal d'activité standard.
- **Vérification Frontend :**
  - Route dédiée `/super-admin/trash`.
  - Service autonome `TrashService`.
  - Visualisation des dépendances avant toute confirmation de purge définitive (`DELETE /trash/{uuid}/force`).

### D. Transmission Systématique des Tokens & UUIDs
- **Exigence :** Tous les identifiants transmis dans les URL sont des chaînes UUID conformes RFC 4122.
- **Vérification Frontend :**
  - Aucun paramètre numérique (`/users/1`, etc.) n'est émis.
  - L'intercepteur `AuthInterceptor` injecte systématiquement l'en-tête `Authorization: Bearer <token>` sur l'ensemble des requêtes sortantes vers `/api/v1/`.
