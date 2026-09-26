# F21 — Rapport final : Exports & Impression

## 1. Objectif

L'objectif de l'étape **F21** est de créer un module cohérent d'exports et d'impression permettant aux utilisateurs autorisés de l'espace Organisation de produire des documents et extractions à partir des données réellement disponibles dans le backend Laravel central (`catheo`) :
- **Membres**
- **Activités Pastorales**
- **Population CATHEO** (cohortes sectorielles : OPPE, OPPJ, OPPA)
- **Pèlerinages & Voyages**
- **Participants aux Pèlerinages** (champs stricts : Nom, Prénoms, Âge, Téléphone, Taille M/L/XL/XXL/XXXL — sans aucune réintroduction de données sensibles)
- **Caisse & Opérations Financières**
- **Statistiques Pastorales & Consolidées** (F20)
- **Rapports & Bilan Annuel** (F20)

### Règle d'or PDF
> **Aucune génération PDF côté Laravel** : L'impression est exécutée côté navigateur via `window.print()` combiné aux styles CSS `@media print` dédiés (`print.css`), permettant à l'utilisateur de choisir nativement "Imprimer" ou "Enregistrer au format PDF" sans aucune dépendance lourde backend (DomPDF, Snappy, Browsershot, mPDF proscrits).

---

## 2. Audit backend

L'audit approfondi a été consigné dans [`F21_EXPORTS_IMPRESSION_BACKEND_AUDIT.md`](file:///c:/Users/Kouadio%20Ferdinand/Desktop/ANGULAR/catheo-super-admin/F21_EXPORTS_IMPRESSION_BACKEND_AUDIT.md).

Le backend Laravel central dispose d'un contrôleur dédié `App\Http\Controllers\Api\Organisation\ExportController` fournissant des flux CSV streamés via `StreamedResponse`, garantissant une consommation mémoire constante même pour des volumes élevés de données.

---

## 3. Endpoints d'export existants

| Endpoint Laravel | Méthode | Format | Filtres supportés | Permissions / Rôles |
| :--- | :---: | :---: | :--- | :--- |
| `/api/v1/organisation/exports/membres` | `GET` | CSV (`text/csv`) | `statut`, `sexe`, `fonction` | `membres.view`, Responsable / Animateur |
| `/api/v1/organisation/exports/activites` | `GET` | CSV (`text/csv`) | `statut`, `type_activite` | `activites.view`, Responsable / Animateur |
| `/api/v1/organisation/exports/pelerinages/{campagne}/participants` | `GET` | CSV (`text/csv`) | `statut_inscription`, `statut_participation`, `type_export` (`general`, `transport`, `embarquement`, `hebergement`) | `pelerinages.read`, Responsable |
| `/api/v1/organisation/exports/pelerinages/{campagne}/paiements` | `GET` | CSV (`text/csv`) | `statut`, `mode_paiement` | `pelerinages.read`, `caisse.read` |
| `/api/v1/organisation/exports/caisse` (alias `/exports/operations`) | `GET` | CSV (`text/csv`) | `type_operation`, `date_debut`, `date_fin` | `caisse.read`, Responsable |
| `/api/v1/organisation/catheo/population` | `GET` | JSON paginé | `search`, `sexe`, `niveau_id`, `classe_id` | `catheo.population.view` |
| `/api/v1/organisation/rapports/annuel` | `GET` | JSON consolidé | `annee` | `rapports.read` |
| `/api/v1/organisation/statistiques/*` | `GET` | JSON structuré | `statut`, `periode`, etc. | `statistiques.read` |

---

## 4. Exports implémentés

### Services centralisés
1. **`ExportService`** (`src/app/features/organisation/exports/services/export.service.ts`) :
   - Consomme les endpoints réels de streaming CSV backend via `ApiClient.downloadBlob()`.
   - Fournit un générateur CSV frontend standardisé pour les modules sans streaming direct backend (`generateCsv()`, `downloadCsv()`, `buildCsvContent()`).
   - Prend en charge le téléchargement de Blob dans le navigateur (`downloadBlob()`, `downloadBlobFile()`).

### Intégrations contextuelles & Hub central
- **Hub Centralisé** (`/organisation/exports`) : page `ExportsPageComponent` permettant de lancer les exports de tous les modules depuis un tableau de bord unifié avec sélecteur de campagne de pèlerinage et types d'export (général, embarquement/kits).
- **Page Membres** (`/organisation/membres`) : bouton contextuel "Exporter CSV" avec respect strict des filtres actifs (`statut`, `sexe`, `search`).
- **Page Activités** (`/organisation/activites`) : bouton contextuel "Exporter CSV" avec filtres actifs (`statut`, `type_activite`, `search`).
- **Page Population CATHEO** (`/organisation/catheo-population`) : bouton "Exporter CSV" respectant le cloisonnement canonique (OPPE, OPPJ, OPPA) et omettant les données sensibles privées.
- **Page Pèlerinages Détail** (`/organisation/pelerinages/:id`) : bouton contextuel "Exporter CSV" pour la liste des participants de la campagne sélectionnée.
- **Page Caisse** (`/organisation/caisse`) : bouton "Exporter la caisse" branché sur `/api/v1/organisation/exports/caisse`.

---

## 5. Impression implémentée

1. **`PrintService`** (`src/app/core/services/print.service.ts`) :
   - Service injectable dans toute l'application.
   - Configure dynamiquement `document.title` avant impression pour que le nom de fichier suggéré par le navigateur lors de "Enregistrer en PDF" soit clair et contextuel (ex: `Bilan Annuel 2026 - OPPE Sainte Famille`).
   - Déclenche `window.print()` de façon synchrone.
   - Restaure le titre original automatiquement.

2. **Feuille de styles `@media print`** (`src/styles/print.css`) :
   - Importée globalement dans `src/styles.css`.
   - Masque automatiquement les éléments d'interface non imprimables : sidebar, header, filtres, pagination, boutons d'action, barres d'onglets, toasts.
   - Force un fond blanc neutre, typographie haute lisibilité et contraste adapté.
   - Format de page A4 standard avec marges de 1.5cm (`@page { size: A4 portrait; margin: 15mm; }`).
   - Gestion des sauts de page propres (`break-inside: avoid; page-break-after: avoid;`).
   - En-têtes de tableaux répétés sur chaque page (`thead { display: table-header-group; }`).

---

## 6. CSV

Tous les exports CSV produits ou téléchargés respectent scrupuleusement la norme d'export F21 :
- **Encodage** : UTF-8 strict.
- **BOM UTF-8** : Préfixe `\uFEFF` systématique garantissant l'ouverture automatique immédiate avec accents dans Microsoft Excel et LibreOffice sans corruption d'encodage.
- **Séparateur** : Point-virgule (`;`).
- **Échappement des guillemets** : Délimitation par guillemets droits et doublage systématique des guillemets internes (`""`).
- **Gestion des retours à la ligne** : Enveloppés entre guillemets sans corrompre le tableau.
- **Noms de fichiers standardisés et horodatés** :
  - `membres-YYYY-MM-DD.csv`
  - `activites-YYYY-MM-DD.csv`
  - `catheo_population_oppe_YYYY-MM-DD.csv`
  - `participants-pelerinage-PEL-XXX-YYYY-MM-DD.csv`
  - `caisse_organisation_YYYY-MM-DD.csv`

---

## 7. Documents imprimables

Préparés avec mise en page dédiée et en-tête institutionnel complet (Nom de l'organisation, paroisse, type d'organisation, date, exercice) :
1. **Population CATHEO** : tableau des effectifs par cohorte sectorielle (Primaire / Collège / Jeunes / Adultes) avec classe et niveau.
2. **Bilan Annuel Consolidé** : rapport d'activité officiel quadri-partite (Membres, Activités, Pèlerinages, Finances & Caisse) avec solde net.
3. **Statistiques Pastorales & Consolidées** : états chiffrés et indicateurs consolidés par onglet thématique.
4. **Listes Pastorales** : Membres, Activités, Participants.

---

## 8. Reçus

Conformément à la règle de non-duplication :
- Le système existant de reçus de paiement et de pièces de caisse (`PaiementDetailModalComponent` et `prefixe_recu` paroisse) a été réutilisé sans créer de système parallèle.
- Les références émises par le backend Laravel sont strictement conservées sans altération frontend.

---

## 9. Permissions (RBAC)

Chaque action d'export ou d'impression est subordonnée aux permissions réelles de l'utilisateur :
- `membres.view` / `membres.manage` : Export membres.
- `activites.view` / `activites.manage` : Export activités.
- `catheo.population.view` : Export & impression population CATHEO.
- `pelerinages.read` : Export participants et paiements de pèlerinage.
- `caisse.read` : Export du journal de caisse.
- `statistiques.read` : Impression des statistiques.
- `rapports.read` : Impression du bilan annuel.
- `dashboard.read` / `exports.read` : Accès au centre d'exports.

---

## 10. Multi-tenant

- Tous les exports s'exécutent dans le contexte de l'organisation connectée authentifiée par Sanctum.
- Aucun paramètre frontend d'organisation étrangère n'est injecté.
- Cloisonnement sectoriel préservé :
  - **OPPE** : `SEC-ENFANTS-PRI`, `SEC-ENFANTS-COL`
  - **OPPJ** : `SEC-JEUNES`
  - **OPPA** : `SEC-ADULTES`

---

## 11. Tests

La suite de tests automatisés Vitest a été exécutée avec succès :
- **114 suites de tests** exécutées.
- **618 tests unitaires et d'intégration** validés.
- **0 échec**.
- Couverture complète des fonctionnalités F21 :
  - `print.service.spec.ts` (déclenchement `window.print()`, titre temporaire et restauration).
  - `export.service.spec.ts` (5 endpoints de flux backend, génération UTF-8 BOM, séparateur `;`, échappement des guillemets, gestion multi-lignes, export CATHEO).
  - `exports-page.component.spec.ts` (chargement des campagnes, déclenchement des exports CSV, gestion des erreurs, toasts).
  - Tests de non-régression sur F1 à F20 (Membres, Activités, Catheo, Pèlerinages, Caisse, Statistiques, Rapports).

---

## 12. TypeScript

Compilation vérifiée avec :
```bash
npx tsc --noEmit
```
**Résultat : 0 erreur TypeScript.**

---

## 13. Build

Compilation de production vérifiée avec :
```bash
npm run build
```
**Résultat : Application bundle generation complete, code 0 (PASS).**

---

## 14. Non-régression

Toutes les étapes précédentes (F1 à F20) continuent de fonctionner à 100% sans aucun impact :
- Les dashboards Super Admin et Organisation restent intacts.
- Les modules Membres, Activités, Population CATHEO, Pèlerinages, Caisse, Statistiques et Rapports conservent leur intégrité.
- Les 618 tests existants passent sans régression.

---

## 15. Fichiers créés / modifiés

### Fichiers créés :
1. `F21_EXPORTS_IMPRESSION_BACKEND_AUDIT.md` (Audit des endpoints backend)
2. `src/styles/print.css` (Feuille de styles `@media print`)
3. `src/app/core/services/print.service.ts` (Service d'impression Angular)
4. `src/app/core/services/print.service.spec.ts` (Tests du PrintService)
5. `src/app/features/organisation/exports/models/export.model.ts` (Modèles et filtres d'export)
6. `src/app/features/organisation/exports/services/export.service.ts` (Service centralisé d'export)
7. `src/app/features/organisation/exports/services/export.service.spec.ts` (Tests du ExportService)
8. `src/app/features/organisation/exports/pages/exports-page.component.ts` (Centre d'exports et d'impressions)
9. `src/app/features/organisation/exports/pages/exports-page.component.spec.ts` (Tests du centre d'exports)
10. `src/app/features/organisation/exports/routes/exports.routes.ts` (Routes d'export)
11. `ETAPE_F21_RAPPORT_FINAL.md` (Ce rapport final)

### Fichiers modifiés :
1. `src/styles.css` (Import de `print.css`)
2. `src/app/core/services/sidebar.service.ts` (Ajout de l'entrée Exports & Impressions)
3. `src/app/features/organisation/routes/organisation.routes.ts` (Route paresseuse `/organisation/exports`)
4. `src/app/features/organisation/membres/pages/membres-list-page.component.ts` (Bouton contextuel Exporter CSV)
5. `src/app/features/organisation/activites/pages/activites-list-page.component.ts` (Bouton contextuel Exporter CSV)
6. `src/app/features/organisation/catheo-population/pages/catheo-population-page.component.ts` (Boutons Exporter CSV & Imprimer)
7. `src/app/features/organisation/pelerinages/pages/pelerinage-detail-page.component.ts` (Bouton contextuel Exporter CSV participants)
8. `src/app/features/organisation/rapports/pages/rapports-page.component.ts` (Bouton Imprimer Bilan et conteneur printable)
9. `src/app/features/organisation/statistiques/pages/statistiques-page.component.ts` (Bouton Imprimer et conteneur printable)

---

## 16. Limitations backend

- Le backend Laravel central ne fournit pas actuellement d'endpoint direct de streaming CSV pour la cohorte CATHEO, les statistiques agglomérées et le bilan annuel consolidé. Pour ces trois cas, le frontend prépare et formate le CSV avec UTF-8 BOM à partir des données réelles retournées par les API officielles (`/api/v1/organisation/catheo/population`, `/api/v1/organisation/statistiques/*`, `/api/v1/organisation/rapports/annuel`), et offre l'impression complète via le navigateur.
- Pour les participants aux pèlerinages, le backend filtre et n'expose jamais les données sensibles obsolètes (`date_naissance`, `email`), respectant scrupuleusement la structure métier (Nom, Prénoms, Âge, Téléphone, Taille).

---

## 17. Protection des autres projets

- **`catheo/`** : `git status` vérifié -> `working tree clean` (0 modification).
- **`catheo-cim/`** : Aucun fichier modifié.
