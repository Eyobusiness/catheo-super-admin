# F19 — AUDIT BACKEND DU MODULE CAISSE & ENCAISSEMENTS ORGANISATION

**Date de réalisation :** 23 Septembre 2026  
**Projet Frontend :** `catheo-super-admin` (Angular 21.2.0)  
**Projet Backend :** `catheo` (Laravel 11, Sanctum, Multi-Tenant)  

---

## 1. Objectif de l'Audit

Cet audit a pour but d'analyser exhaustivement les endpoints, modèles, contrôleurs, services, permissions RBAC et règles métier disponibles dans le backend Laravel pour la gestion de la caisse et des encaissements au niveau des organisations (`OPPE`, `OPPJ`, `OPPA`), afin de garantir :
- Zéro endpoint inventé ou fictif ;
- Zéro statistique inventée ou fictive ;
- Respect strict du multi-tenant et de l'authentification par session/token Sanctum ;
- Respect strict des contrats d'API existants ;
- Respect de la règle métier spécifique (Règle 25) sur les participants externes aux pèlerinages (`nom`, `prenoms`, `age`, `telephone`, `taille` [M, L, XL, XXL, XXXL], sans `date_naissance` ni `email`).

---

## 2. Synthèse de l'Architecture Backend Découverte

### A. Distinction fondamentale : Paroisse vs Organisation
Dans le backend Laravel central :
1. **Module Paroissial CATHEO** :
   - Endpoints : `/api/v1/caisse-paroissiale`, `/api/v1/operations-paiements`, `/api/v1/versements`, `/api/v1/versements-cure`.
   - Modèles : `CaisseParoissiale`, `OperationPaiement`, `TarifParoisse`.
   - **Exclusion stricte :** Ces endpoints sont réservés aux paroisses CATHEO et ne doivent **JAMAIS** être appelés par les organisations (`OPPE`, `OPPJ`, `OPPA`).

2. **Module Organisation (F19 - Cible)** :
   - Préfixe de routes : `/api/v1/organisation/...`
   - Modèles clés : `OperationOrganisation`, `CampagnePelerinage`, `InscriptionPelerinage`, `PaiementPelerinage`.
   - Contrôleurs :
     - `OrganisationCaisseController` (`/api/v1/organisation/caisse`)
     - `OrganisationStatistiqueController` (`/api/v1/organisation/statistiques/finances`, `/pelerinages`)
     - `PaiementPelerinageController` (`/api/v1/organisation/pelerinages/{campagne}/paiements`, `/inscriptions/{inscription}/paiements`)
     - `OrganisationExportController` (`/api/v1/organisation/exports/caisse`, `/exports/pelerinages/{campagne}/paiements`)

---

## 3. Inventaire Détaillé des Endpoints Disponibles

### 3.1. État de Caisse Général de l'Organisation

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `GET` | `/api/v1/organisation/caisse` | `OrganisationCaisseController@index` | `caisse.read` |

#### Paramètres acceptés en Query String :
- `date_debut` (string, `YYYY-MM-DD`, optionnel) : Filtre sur les opérations à partir de cette date. Calcule automatiquement le `solde_initial` avant cette date.
- `date_fin` (string, `YYYY-MM-DD`, optionnel) : Filtre sur les opérations jusqu'à cette date.
- `type_operation` (string, optionnel) : `'entree'` ou `'sortie'`.
- `campagne_id` (integer, optionnel) : Filtre les opérations rattachées à une campagne de pèlerinage donnée.
- `per_page` (integer, optionnel, défaut : 25) : Nombre d'opérations par page.

#### Structure de réponse JSON :
```json
{
  "status": "success",
  "message": "État de caisse récupéré avec succès.",
  "synthese": {
    "periode_debut": "2026-09-01",
    "periode_fin": "2026-09-30",
    "solde_initial": 150000.00,
    "total_entrees": 250000.00,
    "total_sorties": 0.00,
    "solde_periode": 250000.00,
    "solde_final": 400000.00,
    "nombre_operations": 12
  },
  "data": [
    {
      "id": 1,
      "uuid": "4c9e8361-b530-4e1f-8182-4df7a19bb810",
      "organisation_id": 2,
      "campagne_pelerinage_id": 1,
      "inscription_pelerinage_id": 4,
      "paiement_pelerinage_id": 3,
      "reference": "OP-ORG-2026-0001",
      "type_operation": "entree",
      "montant": 25000.00,
      "devise": "XOF",
      "libelle": "Paiement pèlerinage [Koffi Jean] - Ref: PAY-2026-0001",
      "mode_reglement": "especes",
      "date_operation": "2026-09-23T10:15:00+00:00",
      "statut": "valide",
      "operateur": {
        "id": 5,
        "name": "Trésorier OPPE"
      },
      "created_at": "2026-09-23T10:15:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 25,
    "total": 12
  }
}
```

---

### 3.2. Statistiques Financières de l'Organisation

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `GET` | `/api/v1/organisation/statistiques/finances` | `OrganisationStatistiqueController@finances` | `statistiques.read` |

#### Paramètres acceptés :
- `date_debut` (string, optionnel)
- `date_fin` (string, optionnel)
- `campagne_id` (integer, optionnel)

#### Structure de réponse JSON :
```json
{
  "status": "success",
  "message": "Statistiques financières récupérées avec succès.",
  "data": {
    "total_entrees": 500000.00,
    "total_sorties": 0.00,
    "solde": 500000.00,
    "recettes_pelerinages": 450000.00,
    "autres_recettes": 50000.00,
    "evolution_mensuelle": [
      { "periode": "2026-08", "total": 200000.00 },
      { "periode": "2026-09", "total": 300000.00 }
    ],
    "repartition_modes": [
      { "mode": "especes", "total": 350000.00, "pourcentage": 70.0 },
      { "mode": "mobile_money", "total": 150000.00, "pourcentage": 30.0 }
    ]
  }
}
```

---

### 3.3. Journal & Historique des Paiements de Pèlerinages

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `GET` | `/api/v1/organisation/pelerinages/{campagne}/paiements` | `PaiementPelerinageController@index` | `pelerinages.read` |
| `GET` | `/api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements` | `PaiementPelerinageController@indexForInscription` | `pelerinages.read` |

#### Réponse de `indexForInscription` :
Fournit l'historique complet des versements d'un participant ainsi que les soldes officiels calculés par le backend :
```json
{
  "status": "success",
  "message": "Historique des paiements du participant récupéré avec succès.",
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "reference": "PAY-2026-0001",
      "montant": 15000.00,
      "devise": "XOF",
      "mode_paiement": "especes",
      "date_paiement": "2026-09-10T09:00:00Z",
      "statut": "valide",
      "reference_transaction": null,
      "observation": "Premier acompte",
      "caissier": {
        "id": 5,
        "name": "Trésorier OPPE",
        "email": "tresorier@oppe.ci"
      },
      "created_at": "2026-09-10T09:00:00Z"
    }
  ],
  "meta": {
    "montant_total": 30000.00,
    "montant_paye": 15000.00,
    "reste_a_payer": 15000.00,
    "statut": "partiellement_paye"
  }
}
```

---

### 3.4. Enregistrement d'un Paiement

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `POST` | `/api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements` | `PaiementPelerinageController@store` | `pelerinages.paiements` |

#### Payload attendu (`StorePaiementPelerinageRequest`) :
```json
{
  "montant": 15000,
  "mode_paiement": "especes",
  "date_paiement": "2026-09-23",
  "reference_transaction": "TRX-789456",
  "observation": "Solde inscription"
}
```

#### Effet métier transactionnel dans le backend :
1. Crée un enregistrement dans `paiement_pelerinages`.
2. Déclenche `$inscription->recalculerMontants()` :
   - `montant_paye = sum(paiements valides)`
   - `reste_a_payer = max(0, montant - montant_paye)`
   - Statut passe à `paye` ou `partiellement_paye`.
3. Crée automatiquement une ligne d'encaissement dans `operation_organisations` avec :
   - `type_operation = 'entree'`
   - `statut = 'valide'`
   - Référence générée : `OP-ORG-YYYY-XXXX`
   - Libellé automatique : `"Paiement pèlerinage [Nom Prénoms] - Ref: PAY-..."`
   - `date_operation = date_paiement`
4. Met à jour la caisse de l'organisation en temps réel.

---

### 3.5. Annulation d'un Paiement

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `POST` | `/api/v1/organisation/pelerinages/{campagne}/paiements/{paiement}/annuler` | `PaiementPelerinageController@annuler` | `pelerinages.paiements` |

#### Payload attendu :
```json
{
  "motif": "Erreur de saisie de montant"
}
```

#### Effet métier transactionnel :
1. Passe le statut du `PaiementPelerinage` à `annule`.
2. Passe le statut de l'`OperationOrganisation` correspondante à `annule`.
3. Déclenche `$inscription->recalculerMontants()`.
4. La caisse exclut immédiatement cette opération de son solde valide.

---

### 3.6. Export Caisse

| Méthode | URI | Contrôleur & Action | Permission RBAC |
|---|---|---|---|
| `GET` | `/api/v1/organisation/exports/caisse` | `OrganisationExportController@caisse` | `caisse.export` ou `caisse.read` |

---

## 4. Ce qui N'EST PAS Supporté par le Backend (Limites Identifiées)

1. **Aucun endpoint de décaissement manuel direct** :
   - Il n'existe pas de route `POST /api/v1/organisation/caisse/depense` ou `POST /api/v1/organisation/caisse/sortie`.
   - Les mouvements de type `sortie` sont prévus dans le schéma (`type_operation = 'sortie'`), mais aucun formulaire de dépense générale n'est exposé.
   - **Conséquence Frontend :** Ne PAS afficher de bouton "Nouveau décaissement" ou "Enregistrer une dépense".
2. **Aucun endpoint d'impression PDF Laravel dédié côté organisation** :
   - Le backend n'a pas de route `/organisation/paiements/{uuid}/recu-pdf` (celle-ci n'existe que sur le module paroissial CATHEO).
   - **Conséquence Frontend :** Ne pas appeler de PDF backend inventé. Utiliser le reçu/détail modal ou l'impression navigateur si nécessaire.
3. **Paiements d'activités** :
   - La table `activite_organisations` n'a pas de table de paiements dédiée équivalente à `paiement_pelerinages`. Les encaissements actuellement liés aux campagnes de pèlerinages alimentent directement `operation_organisations`.
   - **Conséquence Frontend :** La vue Journal de Caisse liste toutes les opérations réelles de l'organisation (`operation_organisations`), et la vue Encaissements Pèlerinages permet le suivi fin par participant.

---

## 5. Endpoints Retenus pour F19

1. `GET /api/v1/organisation/caisse` : Journal des opérations et synthèse financière (soldes, totaux).
2. `GET /api/v1/organisation/statistiques/finances` : Données de répartition par mode de paiement et évolution.
3. `GET /api/v1/organisation/pelerinages` : Liste des campagnes pour le filtre par pèlerinage.
4. `GET /api/v1/organisation/pelerinages/{campagne}/paiements` : Journal des paiements d'une campagne.
5. `GET /api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements` : Historique des paiements d'un participant.
6. `POST /api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements` : Enregistrement réel d'un versement.
7. `POST /api/v1/organisation/pelerinages/{campagne}/paiements/{paiement}/annuler` : Annulation réelle d'un paiement.

---

## 6. Règle 25 — Participants Externes Pèlerinages

- Attributs obligatoires : `nom`, `prenoms`, `age`, `telephone`, `taille`.
- Tailles admises : `M`, `L`, `XL`, `XXL`, `XXXL` uniquement.
- Suppression formelle : `date_naissance` et `email` sont supprimés des formulaires et modèles des participants externes.

Cet audit servira de référence immuable pour toute l'implémentation de l'étape F19.
