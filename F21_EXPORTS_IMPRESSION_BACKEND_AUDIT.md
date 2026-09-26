# F21 — Audit Backend : Exports & Impression

## 1. Contexte & Architecture
- **Projet Angular** : `catheo-super-admin`
- **Backend Central** : Laravel (`catheo`)
- **Principe Fondamental** : Le backend fournit les données brutes ou les flux CSV préformatés. **Aucun PDF n'est généré côté Laravel**. L'impression et la conversion éventuelle en PDF sont intégralement assurées par le navigateur / Angular via `@media print` et `window.print()`.

---

## 2. Endpoints Laravel d'Export Découverts

### 2.1 Espace Organisation (`/api/v1/organisation/exports`)
Contrôleur : `App\Http\Controllers\Api\V1\Organisation\OrganisationExportController`
Service : `App\Services\Organisation\OrganisationExportService`
Permission requise : `exports.read` (ou `caisse.read` / `pelerinages.read` selon les modules)

| Endpoint | Méthode | Paramètres / Filtres | Format de retour | Remarques Métier |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/organisation/exports/membres` | `GET` | `statut`, `sexe`, `fonction` | Stream CSV (UTF-8 BOM, séparateur `;`) | Colonnes : ID, Nom, Prénoms, Sexe, Date Naissance, Téléphone, Email, Quartier, Adresse, Fonction, Date Entrée, Statut. Nom du fichier : `membres_{code}_{date}.csv`. |
| `/api/v1/organisation/exports/activites` | `GET` | `statut`, `type_activite` | Stream CSV (UTF-8 BOM, séparateur `;`) | Colonnes : Code, Titre, Type, Date Début, Date Fin, Lieu, Responsable, Statut, Taux Exécution (%). Nom du fichier : `activites_{code}_{date}.csv`. |
| `/api/v1/organisation/exports/pelerinages/{campagne}/participants` | `GET` | `statut_inscription`, `statut_participation`, `type_export` ('general', 'transport', 'embarquement', 'hebergement') | Stream CSV (UTF-8 BOM, séparateur `;`) | Respect strict de la structure pèlerins : nom, prenoms, sexe, taille (M/L/XL/XXL/XXXL), telephone, contact urgence, tarif, montants. |
| `/api/v1/organisation/exports/pelerinages/{campagne}/paiements` | `GET` | `statut`, `mode_paiement` | Stream CSV (UTF-8 BOM, séparateur `;`) | Colonnes : Réf Paiement, Date Paiement, Participant, Réf Inscription, Montant, Devise, Mode Paiement, Statut, Réf Transaction, Caissier. |
| `/api/v1/organisation/exports/operations` (alias `/exports/caisse`) | `GET` | `type_operation`, `date_debut`, `date_fin` | Stream CSV (UTF-8 BOM, séparateur `;`) | Colonnes : Référence, Date, Type Opération, Libellé, Montant, Devise, Mode Règlement, Statut, Opérateur. |

---

## 3. Endpoints de Données Exploités pour les Exports & Impression

Pour les domaines sans endpoint stream CSV dédié ou pour les impressions navigateur interactives :

| Domaine | Endpoint Backend | Méthode | Utilisation F21 |
| :--- | :--- | :--- | :--- |
| **Population CATHEO** | `GET /api/v1/organisation/catheo/population` | `GET` (avec filtres `niveau_id`, `classe_id`, `sexe`, `search`) | Export CSV frontend & Impression de liste officielle, filtrée selon sections `OPPE` (`SEC-ENFANTS-PRI`/`COL`), `OPPJ` (`SEC-JEUNES`), `OPPA` (`SEC-ADULTES`). |
| **Statistiques Membres** | `GET /api/v1/organisation/statistiques/membres` | `GET` | Export CSV & Fiche imprimable de statistiques pastorales. |
| **Statistiques Activités**| `GET /api/v1/organisation/statistiques/activites`| `GET` | Export CSV & Fiche imprimable des activités. |
| **Statistiques Pèlerinages**| `GET /api/v1/organisation/statistiques/pelerinages`| `GET` | Export CSV & Fiche imprimable des pèlerinages. |
| **Statistiques Finances** | `GET /api/v1/organisation/statistiques/finances` | `GET` | Export CSV & Fiche imprimable financière. |
| **Rapport Annuel Consolidé** | `GET /api/v1/organisation/rapports/annuel` | `GET` (avec filtre `annee`) | Impression officielle du Bilan Annuel (A4). |
| **Reçu / Quittance de paiement** | `GET /api/v1/organisation/pelerinages/{campagne}/inscriptions/{inscription}/paiements` | `GET` | Impression quittance officielle individuelle de paiement. |
| **Info / En-tête Organisation** | `GET /api/v1/organisation/info` (ou `context`) | `GET` | Entête officiel d'impression (nom paroisse, organisation, type, date). |

---

## 4. Architecture Frontend d'Impression & Export

### 4.1 ExportService (`export.service.ts`)
- Téléchargement direct des flux CSV backend réels (`api.downloadBlob`).
- Générateur CSV frontend avec BOM UTF-8 (`\uFEFF`), séparateur `;` et échappement des guillemets pour les listes et synthèses locales (ex: Population CATHEO, Statistiques sectorielles).
- Noms de fichiers horodatés : `membres-YYYY-MM-DD.csv`, `activites-YYYY-MM-DD.csv`, `pelerinage-participants-YYYY-MM-DD.csv`, `caisse-YYYY-MM-DD.csv`, etc.

### 4.2 PrintService (`print.service.ts`)
- Gestion centralisée de la préparation et déclenchement de `window.print()`.
- Gestion des métadonnées du document (Titre officiel, Organisation, Date d'impression, Année pastorale).
- Intégration transparente avec les styles `@media print` déjà en place dans `src/styles.css` (masquage automatique du chrome d'application, sidebar, boutons, filtres).

### 4.3 Centre d'Exports & Impressions (`ExportsPageComponent`)
- Route : `/organisation/exports`
- Permet un accès direct et unifié aux exports et impressions des différents modules avec gestion des permissions et filtres :
  1. Membres
  2. Activités
  3. Population CATHEO
  4. Pèlerinages (Participants & Paiements)
  5. Caisse & Opérations financières
  6. Statistiques & Rapport Annuel
