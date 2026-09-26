# F9 — Super Admin : Paiements & Factures — Audit Backend Obligatoire

**Projet analysé** : `catheo` (Laravel Central) — STRICTEMENT EN LECTURE SEULE  
**Projet cible** : `catheo-super-admin` (Angular 21)  
**Date d'audit** : Septembre 2026  

---

## 1. Synthèse de l'Audit

Le backend central `catheo` expose un module complet de facturation et de gestion des paiements d'abonnement dédié au Super Admin via le préfixe `/api/v1/super-admin`.
Toutes les routes sont protégées par le middleware `auth:sanctum` et `role:super_admin`.

Les trois entités financières clés sont :
1. **Échéances d'abonnement (`EcheanceAbonnement`)**
2. **Paiements d'abonnement (`PaiementAbonnement`)**
3. **Factures d'abonnement (`Facture`)**

---

## 2. Inventaire Détaillé des Endpoints Disponibles

### 2.1 Paiements d'Abonnement (`/api/v1/super-admin/paiements-abonnement`)

| Méthode | URL | Contrôleur & Action | Description & Comportement |
|---|---|---|---|
| **GET** | `/api/v1/super-admin/paiements-abonnement` | `SuperAdminPaiementController@index` | Liste paginée des paiements avec eager loading `echeance.abonnement.paroisse`, `echeance.abonnement.formule.produit`, `caissier`. |
| **POST** | `/api/v1/super-admin/paiements-abonnement` | `SuperAdminPaiementController@store` | Enregistrement d'un paiement partiel ou total pour une échéance (`StorePaiementAbonnementRequest`). Exécute `SuperAdminBillingService::enregistrerPaiement`. |
| **GET** | `/api/v1/super-admin/paiements-abonnement/{paiement}` | `SuperAdminPaiementController@show` | Détail d'un paiement avec relations complètes (échéance, paroisse, produit, caissier). |
| **POST** | `/api/v1/super-admin/paiements-abonnement/{paiement}/annuler` | `SuperAdminPaiementController@annuler` | Annule un paiement (`statut = 'annule'`). Rouvre automatiquement l'échéance et la facture si elles étaient soldées. |
| **POST** | `/api/v1/super-admin/paiements-abonnement/{paiement}/rembourser` | `SuperAdminPaiementController@rembourser` | Rembourse un paiement (`statut = 'rembourse'`). Rouvre automatiquement l'échéance et la facture si nécessaire. |

#### Paramètres GET Liste Paiements
- `statut` (string, optionnel) : filtre par statut (`en_attente`, `valide`, `annule`, `rembourse`)
- `mode_paiement` (string, optionnel) : filtre par mode (`especes`, `virement`, `mobile_money`, `cheque`, `autre`)
- `echeance_id` (string/int, optionnel) : filtre par ID ou UUID de l'échéance
- `date_debut` (date Y-m-d, optionnel) : date de paiement minimale
- `date_fin` (date Y-m-d, optionnel) : date de paiement maximale
- `per_page` (int, optionnel, défaut 15)
- `page` (int, optionnel, défaut 1)

#### Payload POST Création Paiement (`StorePaiementAbonnementRequest`)
```json
{
  "echeance_abonnement_id": "uuid-ou-id",      // Requis, converti en id interne
  "montant": 25000,                           // Requis, numérique, min: 0.01
  "devise": "XOF",                            // Optionnel, max: 10 (défaut XOF)
  "mode_paiement": "mobile_money",            // Requis, enum: especes, virement, mobile_money, cheque, autre
  "date_paiement": "2026-09-19",              // Requis, format date Y-m-d
  "reference_transaction": "TX-12345678",     // Optionnel, string max: 100
  "observation": "Premier acompte"            // Optionnel, string
}
```

#### Payload POST Annulation / Remboursement
```json
{
  "observation": "Motif de l'annulation ou du remboursement" // Optionnel, string max: 500
}
```

---

### 2.2 Échéances d'Abonnement (`/api/v1/super-admin/echeances`)

| Méthode | URL | Contrôleur & Action | Description & Comportement |
|---|---|---|---|
| **GET** | `/api/v1/super-admin/echeances` | `SuperAdminEcheanceController@index` | Liste paginée des échéances avec filtres. Charge `abonnement.paroisse`, `abonnement.formule.produit`, `facture`, `paiements`. |
| **GET** | `/api/v1/super-admin/echeances/{echeance}` | `SuperAdminEcheanceController@show` | Détail d'une échéance avec `abonnement.paroisse`, `abonnement.formule.produit`, `facture`, `paiements.caissier`. |
| **POST** | `/api/v1/super-admin/echeances/{echeance}/generer-facture` | `SuperAdminEcheanceController@genererFacture` | Génère une facture officielle associée à l'échéance si non existante. |

#### Paramètres GET Liste Échéances
- `abonnement_id` (string/int, optionnel) : filtre par ID ou UUID de l'abonnement
- `statut` (string, optionnel) : filtre par statut (`en_attente`, `payee`, `en_retard`, `annulee`)
- `en_retard` (bool, optionnel) : `true` pour filtrer les échéances non soldées dont la `date_echeance < today`
- `per_page` (int, optionnel, défaut 15)
- `page` (int, optionnel, défaut 1)

#### Payload POST Génération Facture
```json
{
  "taux_tva": 18,                             // Optionnel, numérique entre 0 et 100
  "date_facture": "2026-09-19",               // Optionnel, date (défaut now)
  "description": "Facture abonnement annuel", // Optionnel, string
  "observation": "Observation complémentaire" // Optionnel, string
}
```

---

### 2.3 Factures d'Abonnement (`/api/v1/super-admin/factures`)

| Méthode | URL | Contrôleur & Action | Description & Comportement |
|---|---|---|---|
| **GET** | `/api/v1/super-admin/factures` | `SuperAdminFactureController@index` | Liste paginée des factures avec recherche et filtres. |
| **GET** | `/api/v1/super-admin/factures/{facture}` | `SuperAdminFactureController@show` | Détail d'une facture avec `echeance.abonnement.paroisse`, `echeance.abonnement.formule.produit`, `echeance.paiements`. |

#### Paramètres GET Liste Factures
- `statut` (string, optionnel) : filtre par statut (`en_attente`, `payee`, `annulee`)
- `date_debut` (date Y-m-d, optionnel) : date de facture minimale
- `date_fin` (date Y-m-d, optionnel) : date de facture maximale
- `search` (string, optionnel) : recherche sur `reference`, `description`, ou le `nom` de la paroisse
- `per_page` (int, optionnel, défaut 15)
- `page` (int, optionnel, défaut 1)

*Note importante sur les Factures* :
Le backend Laravel ne propose **aucun** endpoint de téléchargement de fichier binaire ou de génération PDF backend. Conformément aux directives architecturales du projet, le rendu et l'impression des factures sont pris en charge côté Angular via un composant imprimable HTML/CSS avec `window.print()`.

---

## 3. Statuts et Énumérations Réelles

### 3.1 Statuts Paiement (`PaiementAbonnement`)
- `en_attente` : En attente de validation / traitement
- `valide` : Paiement validé et effectif
- `annule` : Paiement annulé
- `rembourse` : Paiement remboursé

### 3.2 Modes de Paiement (`mode_paiement`)
- `especes` : Espèces
- `virement` : Virement bancaire
- `mobile_money` : Mobile Money (Orange, Wave, MTN, Moov)
- `cheque` : Chèque
- `autre` : Autre moyen de paiement

### 3.3 Statuts Échéance (`EcheanceAbonnement`)
- `en_attente` : En attente de règlement (total ou partiel)
- `payee` : Soldée intégralement (`montant_paye >= montant`)
- `en_retard` : Date d'échéance échue sans solde complet
- `annulee` : Échéance annulée

*Règle métier du paiement partiel dans Laravel* :
Dans le modèle Laravel `EcheanceAbonnement` :
- `montant_paye` : calculé dynamiquement via les paiements au statut `valide`.
- `solde_restant` : `max(0, montant - montant_paye)`.
- Si `montant_paye > 0` et `montant_paye < montant`, le statut en base reste `en_attente` (ou `en_retard` si échue), mais le backend expose explicitement `montant_paye` et `solde_restant`.
- Dès que `solde_restant == 0`, le service met à jour automatiquement `statut = 'payee'`.

### 3.4 Statuts Facture (`Facture`)
- `en_attente` : Facture émise en attente de solde complet
- `payee` : Facture intégralement réglée
- `annulee` : Facture annulée

---

## 4. Structures des Resources Laravel Exposées

### 4.1 `PaiementAbonnementResource`
```json
{
  "id": "uuid",
  "id_interne": 1,
  "uuid": "uuid",
  "reference": "PAY-26-0001",
  "echeance_abonnement_id": 1,
  "montant": 50000,
  "devise": "XOF",
  "mode_paiement": "mobile_money",
  "date_paiement": "2026-09-19",
  "statut": "valide",
  "reference_transaction": "WAVE_TX_987654",
  "observation": "Premier versement",
  "created_at": "2026-09-19T10:00:00.000000Z",
  "updated_at": "2026-09-19T10:00:00.000000Z",
  "echeance": { ... },
  "caissier": {
    "id": 1,
    "nom": "Super",
    "prenom": "Admin",
    "email": "superadmin@catheo.ci"
  }
}
```

### 4.2 `EcheanceAbonnementResource`
```json
{
  "id": "uuid",
  "id_interne": 1,
  "uuid": "uuid",
  "abonnement_id": 1,
  "reference": "ECH-26-0001",
  "periode_debut": "2026-01-01",
  "periode_fin": "2026-12-31",
  "date_echeance": "2026-01-31",
  "montant": 100000,
  "montant_paye": 50000,
  "solde_restant": 50000,
  "devise": "XOF",
  "statut": "en_attente",
  "observation": null,
  "created_at": "...",
  "updated_at": "...",
  "abonnement": { ... },
  "facture": { ... },
  "paiements": [ ... ]
}
```

### 4.3 `FactureResource`
```json
{
  "id": "uuid",
  "id_interne": 1,
  "uuid": "uuid",
  "echeance_abonnement_id": 1,
  "reference": "FAC-26-0001",
  "date_facture": "2026-09-19",
  "date_echeance": "2026-10-19",
  "montant_ht": 84745.76,
  "taux_tva": 18,
  "montant_tva": 15254.24,
  "montant_ttc": 100000,
  "statut": "en_attente",
  "fichier_pdf_path": null,
  "description": "Facture annuelle abonnement CATHEO",
  "observation": null,
  "created_at": "...",
  "updated_at": "...",
  "echeance": { ... }
}
```

---

## 5. Règle Critique sur les Décisions Métier

1. **Montant et Solde Restant** :
   Angular affiche `solde_restant` fourni par le backend. Dans le formulaire de création de paiement, le frontend valide que `montant <= solde_restant`, mais c'est le backend (`SuperAdminBillingService`) qui contrôle et applique la validation en base de données.
2. **Double Soumission** :
   Les boutons de soumission (création de paiement, génération de facture, annulation, remboursement) doivent être désactivés avec indicateur `loading` pendant l'appel HTTP.
3. **Immuabilité des projets externes** :
   Les projets `catheo` et `catheo-cim` restent strictement inchangés.
