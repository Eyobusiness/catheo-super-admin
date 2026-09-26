# F12 — Audit Backend : Architecture Organisation & Sélection OPPE/OPPJ

**Date :** 2026-09-19  
**Cible :** Backend central Laravel (`catheo`) & Frontend Angular (`catheo-super-admin`)  
**Statut :** AUDITÉ ET CONFORME  

---

## 1. Endpoints Organisationnels Réels

Le backend Laravel central expose un module dédié aux organisations sous le préfixe `/api/v1/organisation` protégé par Sanctum et le middleware `EnsureOrganisationContext` :

```php
Route::middleware(['auth:sanctum', 'organisation'])->prefix('organisation')->group(function () {
    Route::get('/context', [OrganisationProfileController::class, 'context']);
    Route::get('/info', [OrganisationProfileController::class, 'context']);
    Route::put('/info', [OrganisationProfileController::class, 'update']);
    Route::get('/users', [OrganisationUserController::class, 'index']);
    Route::post('/users', [OrganisationUserController::class, 'store']);
    Route::get('/users/{user}', [OrganisationUserController::class, 'show']);
    Route::put('/users/{user}', [OrganisationUserController::class, 'update']);
    Route::patch('/users/{user}/toggle-status', [OrganisationUserController::class, 'toggleStatus']);
    Route::get('/dashboard', [OrganisationDashboardController::class, 'index']);
    Route::get('/catheo-population', [CatheoPopulationController::class, 'index']);
    ...
});
```

---

## 2. Règle du Header `X-Organisation-Id` & Contexte Backend

1. **Utilisateur Organisation Standard :**
   - Son compte est lié directement à `user.organisation_id`.
   - Le middleware `EnsureOrganisationContext` résout son contexte directement sans nécessiter de header.
   - S'il tente d'envoyer un autre `X-Organisation-Id`, l'accès est rejeté (`AccessDeniedHttpException : "Accès refusé à cette organisation."`).

2. **Super Administrateur en supervision :**
   - N'a pas d'`organisation_id` par défaut.
   - Peut superviser une organisation spécifique via le header HTTP `X-Organisation-Id: {id}`.
   - Le middleware valide rigoureusement l'existence et l'état de l'organisation.

3. **Organisation Inactive ou Suspendue :**
   - Si `organisation.statut !== 'actif'`, le backend renvoie une erreur HTTP 403 :
     `"Accès refusé. L'organisation [{nom}] est actuellement {statut}."`
   - Le frontend ne permet pas l'accès et redirige vers la déconnexion / login avec un message explicite.

---

## 3. Règle CATHEO des Sections Cibles

Dans `App\Services\Organisation\CatheoPopulationService` :
- **OPPE** : `SEC-ENFANTS-PRI` (Enfants Primaire) ET `SEC-ENFANTS-COL` (Enfants Collège).
- **OPPJ** : `SEC-JEUNES` (Pastorale des Jeunes).
- **OPPA** : `SEC-ADULTES` (Pastorale des Adultes — réservé pour le futur).

Ces codes sont des constantes immuables du socle CATHEO.

---

## 4. Rôles & RBAC Organisationnel

Dans `database/seeders/OrganisationProfilSeeder.php` :
- **OPPE** : `RESPONSABLE_OPPE`, `UTILISATEUR_OPPE`.
- **OPPJ** : `RESPONSABLE_OPPJ`, `UTILISATEUR_OPPJ`.
- **OPPA** : `RESPONSABLE_OPPA`, `UTILISATEUR_OPPA`.

Chaque profil dispose de permissions spécifiques. Aucun croisement de rôles entre types d'espaces différents n'est autorisé.

---

## 5. Préférence LocalStorage vs Autorisation Backend

- **`catheo_organisation_space_pref`** est une simple clé en `localStorage`.
- Elle sert **uniquement** à pré-sélectionner l'onglet visuel (OPPE / OPPJ) sur la mire de connexion.
- **Règle absolue :** Elle ne confère aucun droit. C'est l'authentification et l'appel `GET /api/v1/organisation/context` qui déterminent l'espace effectif et les droits de l'utilisateur connecté.
