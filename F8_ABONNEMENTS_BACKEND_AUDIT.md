# AUDIT BACKEND LARAVEL — MODULE F8 : ABONNEMENTS SUPER ADMIN

**Date de réalisation :** 19 Septembre 2026  
**Source de Vérité :** Backend Laravel `catheo` (exécuté sur `http://127.0.0.1:8000`)  
**Projets en lecture seule :** `catheo` et `catheo-cim` (strictement inchangés)  

---

## 1. Endpoints Abonnements réellement disponibles

Tous les endpoints sont protégés par authentification Sanctum et réservés aux utilisateurs avec le rôle `SUPER_ADMIN`.

| Méthode | URL | Contrôleur & Action | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/super-admin/abonnements` | `SuperAdminAbonnementController@index` | Liste paginée des abonnements avec filtres (`paroisse_id`, `produit_id`, `statut`, `per_page`, `page`). |
| `POST` | `/api/v1/super-admin/abonnements` | `SuperAdminAbonnementController@store` | Souscription d'une paroisse à une formule (`StoreAbonnementRequest`). |
| `GET` | `/api/v1/super-admin/abonnements/{id}` | `SuperAdminAbonnementController@show` | Détail d'un abonnement avec `paroisse`, `formule.produit`, et `echeances` (incluant `paiements` et `facture`). |
| `PATCH` | `/api/v1/super-admin/abonnements/{id}/statut` | `SuperAdminAbonnementController@changerStatut` | Changement de statut manuel (`statut`, `observation`). |
| `POST` | `/api/v1/super-admin/abonnements/{id}/resilier` | `SuperAdminAbonnementController@resilier` | Résiliation formelle (`motif_resiliation`, `date_resiliation`, `observation`). |

---

## 2. Endpoints Échéances réellement disponibles

| Méthode | URL | Contrôleur & Action | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/super-admin/echeances` | `SuperAdminEcheanceController@index` | Liste paginée des échéances avec filtres (`abonnement_id`, `statut`, `en_retard`, `per_page`, `page`). |
| `GET` | `/api/v1/super-admin/echeances/{id}` | `SuperAdminEcheanceController@show` | Détail complet d'une échéance. |
| `POST` | `/api/v1/super-admin/echeances/{id}/generer-facture` | `SuperAdminEcheanceController@genererFacture` | Génération de la facture associée à une échéance. |

---

## 3. FormRequest & Validation

### `StoreAbonnementRequest` (`POST /api/v1/super-admin/abonnements`)
- **`paroisse_configuration_id`** : `required|exists:paroisse_configurations,id` (le `prepareForValidation` accepte aussi l'UUID de la paroisse).
- **`formule_id`** : `required|exists:formules,id` (accepte ID numérique ou UUID).
- **`date_debut`** : `nullable|date`.
- **`date_fin`** : `nullable|date|after_or_equal:date_debut`.
- **`renouvellement_automatique`** : `nullable|boolean` (défaut : `true`).
- **`observation`** : `nullable|string`.

### `changerStatut` (`PATCH /api/v1/super-admin/abonnements/{id}/statut`)
- **`statut`** : `required|string|in:en_attente,actif,suspendu,expire,resilie`.
- **`observation`** : `nullable|string`.

### `resilier` (`POST /api/v1/super-admin/abonnements/{id}/resilier`)
- **`motif_resiliation`** : `required|string|max:500`.
- **`date_resiliation`** : `nullable|date`.
- **`observation`** : `nullable|string`.

---

## 4. Format des Réponses JSON (`AbonnementResource`)

```json
{
  "status": "success",
  "data": {
    "id": "uuid-abonnement",
    "id_interne": 1,
    "reference": "ABO-26-0001",
    "paroisse_id": "uuid-paroisse",
    "paroisse_nom": "Paroisse Saint Joseph",
    "paroisse_code": "PSJ-01",
    "produit_code": "CATHEO",
    "produit_nom": "CATHEO",
    "formule_id": "uuid-formule",
    "formule_nom": "Formule Annuelle",
    "formule_code": "CATHEO-ANNUEL",
    "date_debut": "2026-09-19",
    "date_fin": "2027-09-18",
    "statut": "actif",
    "montant": 50000.0,
    "devise": "XOF",
    "renouvellement_automatique": true,
    "date_resiliation": null,
    "motif_resiliation": null,
    "observation": null,
    "echeances": [
      {
        "id": "uuid-echeance",
        "id_interne": 1,
        "abonnement_id": "uuid-abonnement",
        "reference": "ECH-26-0001",
        "periode_debut": "2026-09-19",
        "periode_fin": "2027-09-18",
        "date_echeance": "2026-09-19",
        "montant": 50000.0,
        "montant_paye": 0.0,
        "solde_restant": 50000.0,
        "devise": "XOF",
        "statut": "en_attente",
        "observation": null,
        "created_at": "2026-09-19T10:00:00+00:00"
      }
    ],
    "created_at": "2026-09-19T10:00:00+00:00",
    "updated_at": "2026-09-19T10:00:00+00:00"
  }
}
```

---

## 5. Règles Métier Validées dans le Backend

1. **Snapshot du montant & devise** : Le montant et la devise sont copiés depuis la formule au moment de la souscription. Toute modification ultérieure du prix de la formule ne modifie pas les abonnements en cours.
2. **Formule Gratuite** :
   - `montant = 0`, `est_gratuite = true`.
   - `statut` initial : **`actif`** immédiatement.
   - Aucune échéance ni facture générée.
3. **Formule Payante** :
   - `statut` initial : **`en_attente`** jusqu'au premier encaissement.
   - Création automatique par le backend de la première échéance (`ECH-YY-XXXX`) et de la facture associée (`FAC-YY-XXXX`).
4. **Statuts d'Abonnement autorisés** :
   - `en_attente`, `actif`, `suspendu`, `expire`, `resilie`.
5. **Statuts d'Échéance** :
   - `en_attente`, `payee`, `en_retard`, `annulee`.
6. **Actions de cycle de vie** :
   - Activation / Suspension / Expiration manuelle via `PATCH /super-admin/abonnements/{id}/statut`.
   - Résiliation avec motif obligatoire via `POST /super-admin/abonnements/{id}/resilier`.

---

## 6. Éléments Non Disponibles / Limites Constatées

- Pas de modification générale libre d'un abonnement via `PUT` (le backend ne supporte que `changerStatut` et `resilier` ; les dates, montants et formules souscrites sont contractuels et immuables).
- Pas de suppression physique d'un abonnement (la résiliation est l'acte de clôture légitime).
