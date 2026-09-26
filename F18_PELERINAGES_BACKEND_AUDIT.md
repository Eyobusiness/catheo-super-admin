# F18 - AUDIT BACKEND DU MODULE PÈLERINAGES

Ce document consigne l'audit exhaustif du backend Laravel (`catheo`) pour le module **PÈLERINAGES** dans l'espace Organisation.

---

## 1. Vue d'Ensemble & Architecture Métier

Le module Pèlerinages permet aux organisations habilitées de gérer l'intégralité du cycle de vie des campagnes de pèlerinage :
1. **Campagnes de pèlerinage** (`campagne_pelerinages`) : entité maîtresse portant la date de départ, la date de fin, la destination, la capacité d'accueil et le statut.
2. **Tarifs de pèlerinage** (`tarif_pelerinages`) : forfaits et grilles tarifaires rattachés à une campagne.
3. **Inscriptions / Participants** (`inscription_pelerinages`) : participants inscrits soit comme catéchumènes de la paroisse (`CATECHUMENE`), soit comme personnes extérieures (`EXTERNE`).
4. **Paiements de pèlerinage** (`paiement_pelerinages`) : versements enregistrés au titre d'une inscription spécifique, alimentant automatiquement la trésorerie locale (`operation_organisations`).

---

## 2. Modèles Eloquent & Tables SQL

### 2.1 `CampagnePelerinage` (`campagne_pelerinages`)
- **Champs principaux** :
  - `id` (int unsigned auto_increment)
  - `uuid` (uuid unique)
  - `organisation_id` (foreign key -> `organisations`)
  - `activite_id` (foreign key nullable -> `activites`, doit appartenir à la même organisation)
  - `code` (string unique, ex: `PEL-2026-001` auto-généré par le modèle via la séquence annuelle)
  - `nom` (string)
  - `destination` (string)
  - `description` (text nullable)
  - `date_depart` (date)
  - `heure_depart` (time nullable)
  - `date_fin` (date)
  - `heure_fin` (time nullable)
  - `date_debut_inscription` (date nullable)
  - `date_fin_inscription` (date nullable)
  - `capacite` (int unsigned nullable, `null` = places illimitées)
  - `statut` (enum: `brouillon`, `ouverte`, `cloturee`, `annulee`, `terminee`)
  - `date_cloture` (datetime nullable)
  - `date_annulation` (datetime nullable)
  - `motif_annulation` (text nullable)
  - `annule_par` (foreign key -> `users` nullable)
  - Timestamps & SoftDeletes

### 2.2 `TarifPelerinage` (`tarif_pelerinages`)
- **Champs principaux** :
  - `id`, `uuid`
  - `campagne_pelerinage_id`
  - `code` (string unique par campagne)
  - `libelle` (string)
  - `description` (text nullable)
  - `montant` (decimal unsigned)
  - `devise` (string, default: `XOF`)
  - `statut` (enum: `actif`, `inactif`)
  - Note formelle : pas de champ `age_min`, `age_max`, ni `conditions`.

### 2.3 `InscriptionPelerinage` (`inscription_pelerinages`)
- **Champs principaux** :
  - `id`, `uuid`, `reference` (string unique, ex: `INS-2026-001` auto-généré)
  - `campagne_pelerinage_id`
  - `tarif_pelerinage_id`
  - `type_participant` (`CATECHUMENE` | `EXTERNE`)
  - `catechumene_id` (foreign key nullable -> `catechumenes`)
  - `nom`, `prenoms`, `telephone`, `email`, `adresse` (renseignés directement pour EXTERNE ou dénormalisés)
  - `taille_tshirt` (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL` nullable)
  - `nom_contact_urgence`, `telephone_contact_urgence`, `lien_contact_urgence`
  - `montant` (montant total dû basé sur le tarif)
  - `montant_paye` (somme des paiements validés)
  - `reste_a_payer` (`montant - montant_paye`)
  - `statut_inscription` (`en_attente`, `partiellement_payee`, `payee`, `annulee`)
  - `statut_participation` (`prevue`, `presente`, `absente`)

### 2.4 `PaiementPelerinage` (`paiement_pelerinages`)
- **Champs principaux** :
  - `id`, `uuid`, `reference` (ex: `PAI-2026-001`)
  - `inscription_pelerinage_id`
  - `operation_organisation_id` (foreign key nullable -> `operation_organisations`)
  - `montant` (decimal)
  - `mode_paiement` (`ESPECES`, `ORANGE_MONEY`, `MTN_MOMO`, `MOOV_MONEY`, `WAVE`, `CHEQUE`, `VIREMENT`, `AUTRE`)
  - `date_paiement` (datetime)
  - `statut` (`valide`, `annule`)
  - `motif_annulation`

---

## 3. Règles Métier Clés Implémentées par Laravel

1. **Génération des codes & références** :
   - `PEL-{ANNEE}-{SEQUENCE}` est généré exclusivement par le backend (via trigger/observer Eloquent avec lock pessimiste).
   - Angular n'intervient à aucun moment dans la génération des numéros ou préfixes.

2. **Temporalité & Horaires** :
   - `date_depart`, `heure_depart`, `date_fin`, `heure_fin`.
   - Il n'y a PAS de `date_retour` ni de `heure_retour`.

3. **Capacité & Concurrence** :
   - Règle backend : les places occupées sont calculées par `count(statut_inscription != 'annulee')`.
   - Protection contre les dépassements : transactions SQL avec `lockForUpdate` sur `campagne_pelerinages`.
   - En cas de capacité atteinte : HTTP 409 Conflict ou 422 Unprocessable Entity (`Capacité maximale de la campagne atteinte`).

4. **Multi-tenant & Activités associées** :
   - Multi-tenant strict : toutes les requêtes sont scopées à l'organisation de l'utilisateur connecté via `auth()->user()->organisation_id`.
   - Une campagne ne peut être liée qu'à une activité appartenant à la même organisation.

5. **Paiements & Caisse** :
   - Lors de la création d'un paiement, le backend met à jour automatiquement `montant_paye`, `reste_a_payer` et `statut_inscription`.
   - Le backend crée automatiquement une entrée dans `operation_organisations` avec la référence du paiement.
   - Si une campagne est clôturée, toutes les inscriptions encore `en_attente` sans paiement sont automatiquement annulées par le backend.

---

## 4. Endpoints API Utilisés

### 4.1 Campagnes de pèlerinage

| Méthode | URL | Permissions | Description | Erreurs Métier |
|---------|-----|-------------|-------------|----------------|
| `GET` | `/api/organisation/pelerinages` | `pelerinages.read` | Liste paginée avec filtres `search`, `statut`, `date_depart_min` | 401, 403 |
| `POST` | `/api/organisation/pelerinages` | `pelerinages.create` | Création d'une campagne | 422 (champs requis, dates incohérentes, activité externe) |
| `GET` | `/api/organisation/pelerinages/{id}` | `pelerinages.read` | Détail d'une campagne avec tarifs et statistiques | 404 |
| `PUT` | `/api/organisation/pelerinages/{id}` | `pelerinages.update` | Modification d'une campagne (`brouillon` ou `ouverte`) | 422, 409 (statut non modifiable) |
| `DELETE` | `/api/organisation/pelerinages/{id}` | `pelerinages.delete` | Suppression d'une campagne (`brouillon` uniquement) | 409 (campagne avec inscriptions) |
| `PATCH` | `/api/organisation/pelerinages/{id}/ouvrir` | `pelerinages.update` | Passage de `brouillon` à `ouverte` | 409 (aucun tarif configuré) |
| `PATCH` | `/api/organisation/pelerinages/{id}/cloturer` | `pelerinages.update` | Clôture de la campagne et annulation des inscriptions en attente | 409 (déjà clôturée ou terminée) |
| `PATCH` | `/api/organisation/pelerinages/{id}/annuler` | `pelerinages.update` | Annulation de la campagne avec motif | 409 (déjà achevée) |
| `GET` | `/api/organisation/pelerinages/{id}/statistiques` | `pelerinages.read` | Statistiques complètes de capacité et finances | 404 |

### 4.2 Tarifs de pèlerinage

| Méthode | URL | Permissions | Description | Erreurs Métier |
|---------|-----|-------------|-------------|----------------|
| `GET` | `/api/organisation/pelerinages/{id}/tarifs` | `pelerinages.read` | Liste des forfaits disponibles pour une campagne | 404 |
| `POST` | `/api/organisation/pelerinages/{id}/tarifs` | `pelerinages.create` | Ajout d'un tarif (`code`, `libelle`, `montant`, `description`) | 422 (doublon de code, montant négatif) |
| `PUT` | `/api/organisation/pelerinages/{id}/tarifs/{tarifId}` | `pelerinages.update` | Mise à jour d'un tarif | 422 |
| `DELETE` | `/api/organisation/pelerinages/{id}/tarifs/{tarifId}` | `pelerinages.delete` | Suppression d'un tarif (si non utilisé) | 409 (tarif déjà rattaché à des inscriptions) |

### 4.3 Inscriptions & Participants

| Méthode | URL | Permissions | Description | Erreurs Métier |
|---------|-----|-------------|-------------|----------------|
| `GET` | `/api/organisation/pelerinages/{id}/inscriptions` | `pelerinages.read` | Liste paginée des pèlerins avec filtres | 404 |
| `POST` | `/api/organisation/pelerinages/{id}/inscriptions` | `pelerinages.create` | Inscription d'un pèlerin (`CATECHUMENE` ou `EXTERNE`) | 409 (capacité atteinte, doublon participant), 422 |
| `GET` | `/api/organisation/pelerinages/{id}/inscriptions/{insId}` | `pelerinages.read` | Détail d'une inscription et de ses versements | 404 |
| `PATCH` | `/api/organisation/pelerinages/{id}/inscriptions/{insId}/participation` | `pelerinages.update` | Pointage présence (`prevue`, `presente`, `absente`) | 422 |
| `POST` | `/api/organisation/pelerinages/{id}/inscriptions/{insId}/annuler` | `pelerinages.update` | Annulation d'une inscription | 409 (déjà annulée) |

### 4.4 Paiements de pèlerinage

| Méthode | URL | Permissions | Description | Erreurs Métier |
|---------|-----|-------------|-------------|----------------|
| `GET` | `/api/organisation/pelerinages/{id}/paiements` | `pelerinages.read` | Journal de tous les paiements de la campagne | 404 |
| `GET` | `/api/organisation/pelerinages/{id}/inscriptions/{insId}/paiements` | `pelerinages.read` | Versements d'une inscription spécifique | 404 |
| `POST` | `/api/organisation/pelerinages/{id}/inscriptions/{insId}/paiements` | `pelerinages.paiements` | Enregistrement d'un versement (partiel ou complet) | 422 (montant supérieur au reste à payer) |
| `POST` | `/api/organisation/pelerinages/{id}/paiements/{paiementId}/annuler` | `pelerinages.paiements` | Annulation d'un paiement avec recalcul automatique du solde | 409 |
