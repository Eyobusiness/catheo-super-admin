# F11 — Audit Backend : Piste d’Audit & Santé API

**Date d'audit :** 2026-09-19  
**Cible :** Backend central Laravel (`catheo`) et frontend Angular (`catheo-super-admin`)  
**Statut :** AUDITÉ ET CONFORME  

---

## 1. Contexte Architectural

Le backend Laravel central possède deux composants d'infrastructure pour l'observabilité et le suivi de sécurité :
1. **Piste d'audit centralisée (`audit_logs`) :**
   - Table `audit_logs` avec modèle Eloquent `App\Models\AuditLog`.
   - Contrôleur officiel : `App\Http\Controllers\Api\V1\AuditLogController`.
   - Ressource JSON : `App\Http\Resources\Api\V1\AuditLogResource`.
   - Trait d'auditabilité : `App\Traits\Auditable`.
   - Unicité et référence via UUID (`HasUuid`).
2. **Santé de l'API (`/health`) :**
   - Endpoint de santé exposé à la racine de l'API : `GET /api/v1/health`.
   - Retourne le statut opérationnel du serveur API, un message de confirmation et l'horodatage ISO 8601.

---

## 2. Endpoints Réellement Disponibles

### 2.1 Piste d'Audit (`/api/v1/audit-logs`)

| Méthode | Endpoint | Contrôleur / Action | Description | Paramètres / Filtres réels |
|---|---|---|---|---|
| **GET** | `/api/v1/audit-logs` | `AuditLogController@index` | Liste paginée des événements d'audit | - `action` (string : `create`, `update`, `delete`, `login`, `logout`, `export`)<br>- `entite_type` (string : nom de modèle/ressource)<br>- `per_page` (integer, défaut 25)<br>- `page` (integer) |
| **GET** | `/api/v1/audit-logs/{id}` | `AuditLogController@show` | Détail complet d'un événement d'audit | ID / UUID de l'événement |
| **POST** | `/api/v1/audit-logs` | `AuditLogController@store` | Consignation manuelle d'un événement | Réservé à l'usage interne |

#### Structure réelle de `AuditLogResource` :
```json
{
  "id": "uuid-string",
  "action": "update",
  "entite_type": "Paroisse",
  "entite_id": 12,
  "anciennes_valeurs": { "nom": "Ancien Nom" },
  "nouvelles_valeurs": { "nom": "Nouveau Nom" },
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/5.0 ...",
  "user": {
    "id": 1,
    "uuid": "user-uuid",
    "name": "Super Administrateur",
    "email": "superadmin@catheo.org"
  },
  "created_at": "2026-09-19T20:00:00Z"
}
```

#### Schéma de la table `audit_logs` :
- `id` : BigInteger (auto-increment)
- `uuid` : UUID unique
- `paroisse_configuration_id` : ForeignKey vers `paroisse_configurations`
- `user_id` : ForeignKey nullable vers `users`
- `action` : ENUM (`'create'`, `'update'`, `'delete'`, `'login'`, `'logout'`, `'export'`)
- `entite_type` : String
- `entite_id` : UnsignedBigInteger nullable
- `anciennes_valeurs` : JSON nullable
- `nouvelles_valeurs` : JSON nullable
- `ip_address` : String nullable
- `user_agent` : String nullable
- `created_at`, `updated_at` : Timestamps

---

### 2.2 Santé API (`/api/v1/health`)

| Méthode | Endpoint | Contrôleur / Action | Description | Réponse réelle |
|---|---|---|---|---|
| **GET** | `/api/v1/health` | Route anonyme `routes/api.php:12` | Vérification de connectivité et disponibilité de l'API | `{ "status": "success", "message": "Catheo API v1 is running", "timestamp": "2026-09-19T21:49:00+00:00" }` |

#### Métriques Système Consolidées (`/api/v1/super-admin/dashboard`) :
Le Super Admin dispose également des métriques d'état global du système via `GET /api/v1/super-admin/dashboard` :
- `paroisses` : total et actives
- `produits_actifs` : nombre de produits SaaS opérationnels
- `abonnements` : répartition (actifs, en attente, suspendus, expirés, résiliés)
- `finances` : chiffre d'affaires, échéances et retards

---

## 3. Endpoints Inexistants (À NE PAS INVENTER)

- ❌ `GET /api/v1/super-admin/audit-logs` : **N'EXISTE PAS**. L'endpoint officiel est `GET /api/v1/audit-logs`.
- ❌ `DELETE /api/v1/audit-logs/{id}` : **N'EXISTE PAS**. Le journal d'audit est en lecture seule (`only(['index', 'store', 'show'])`). Aucune suppression ni modification d'audit n'est permise.
- ❌ `GET /api/v1/health/db` : **N'EXISTE PAS**.
- ❌ `GET /api/v1/health/redis` : **N'EXISTE PAS**.
- ❌ `GET /api/v1/health/queue` : **N'EXISTE PAS**.
- ❌ Aucun système d'audit parallèle ou table temporaire côté frontend.

---

## 4. Règles de Sécurité et Masquage des Données Sensibles

1. **Lecture Seule :** Les logs d'audit ne peuvent en aucun cas être modifiés ou purgés par l'interface utilisateur.
2. **Masquage Obligatoire :**
   - Même si les attributs `anciennes_valeurs` ou `nouvelles_valeurs` contenaient des clés sensibles (`password`, `mot_de_passe`, `token`, `secret`, `remember_token`), le frontend doit automatiquement les caviarder (`********`) avant affichage.
3. **Temps de Requête :**
   - La latence mesurée côté navigateur doit être explicitement libellée **« Temps de requête client (aller-retour HTTP) »** et non faussement présentée comme temps de traitement interne du serveur.

---

## 5. Décisions pour l'Architecture Angular

1. **Piste d'Audit :**
   - Corriger `endpoint` de `AuditService` de `'super-admin/audit-logs'` vers `'audit-logs'`.
   - Modèle `AuditLog` aligné sur `AuditLogResource` (`id` [uuid], `action`, `entite_type`, `entite_id`, `anciennes_valeurs`, `nouvelles_valeurs`, `ip_address`, `user_agent`, `user`, `created_at`).
   - Page liste `/super-admin/audit` : filtres réels (`action`, `entite_type`), tableau avec pagination serveur.
   - Modale / Page détail d'audit : affichage détaillé de l'auteur, de la ressource, de l'IP, du User-Agent et comparaison formatée des anciennes/nouvelles valeurs avec masquage des secrets.
   - Badge d'action stylisé (`create` -> success, `update` -> warning/info, `delete` -> danger, `login`/`logout` -> neutral/info, `export` -> secondary).
2. **Santé API :**
   - Utiliser `GET /api/v1/health` réel.
   - Supprimer l'appel fictif `health/db` et afficher l'état vérifié réel de l'API avec statut, message serveur et horodatage officiel.
   - Bouton « Vérifier maintenant » avec mesure honnête du temps de requête client (ms), état de chargement et feedback toast.
   - Synthèse de la plateforme consolidée (via `SuperAdminDashboardService` pour contextualiser la charge : nombre de paroisses actives, abonnements actifs, produits opérationnels).
