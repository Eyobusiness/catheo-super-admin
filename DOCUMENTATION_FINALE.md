# Cathéo Super Admin & Organisation — Documentation Technique & Fonctionnelle Finale

**Version :** 1.0.0 (Production Ready)  
**Framework :** Angular 21.2.0 (Standalone Components, Signals, OnPush, Vanilla CSS)  
**Backend :** Laravel 11 / Sanctum API (Multi-tenant, RBAC)  
**Dernière révision :** 24 Septembre 2026  

---

## 1. Architecture Générale

L'application `catheo-super-admin` est une interface web monopage (SPA) hautement réactive construite pour piloter l'écosystème Cathéo à deux niveaux d'accès hermétiques :
1. **Portail Super Admin :** Supervision globale de la plateforme, gestion des paroisses, des catalogues de produits et formules, des abonnements, des paiements, des organisations et des pistes d'audit immuables.
2. **Portail Organisation :** Gestion pastorale et administrative dédiée aux paroisses et œuvres, découpée en 3 espaces pastoraux :
   - **OPPE (Enfants) :** Catéchisme primaire et collège (`SEC-ENFANTS-PRI`, `SEC-ENFANTS-COL`).
   - **OPPJ (Jeunes) :** Pastorale des jeunes (`SEC-JEUNES`).
   - **OPPA (Adultes) :** Pastorale des adultes (`SEC-ADULTES`).

```
src/
├── app/
│   ├── core/                  # Socle technique transverse
│   │   ├── guards/            # AuthGuard, SuperAdminGuard, OrganisationGuard, PermissionGuard
│   │   ├── interceptors/      # AuthInterceptor (Sanctum Bearer + X-Organisation-Id)
│   │   ├── models/            # Modèles transverses (Auth, Organisation, User)
│   │   └── services/          # AuthService, SessionService, OrganisationContextService, etc.
│   ├── shared/                # Design System UI & Utilitaires partagés
│   │   ├── components/        # Button, Badge, Input, Select, Modal, Table, Pagination, etc.
│   │   ├── models/            # TableColumn, PaginationModel, SelectOption, etc.
│   │   └── ui/                # Layout (Header, Sidebar, Navigation)
│   └── features/              # Modules fonctionnels en Lazy Loading
│       ├── auth/              # Connexion Super Admin & Organisation
│       ├── super-admin/       # Modules Super Admin (F5 → F11)
│       └── organisation/      # Modules Organisation (F12 → F21)
├── environments/              # Configuration des environnements (Dev, Staging, Prod)
└── styles.css                 # Design Tokens & Thème Vanilla CSS
```

---

## 2. Installation & Prérequis

### Prérequis système
- **Node.js :** Version 20.x ou 22.x LTS (compatible avec Angular 21)
- **Gestionnaire de paquets :** npm 10+ ou 11+
- **Backend actif :** API Laravel Cathéo accessible avec base de données initialisée.

### Procédure d'installation
```bash
# Cloner le dépôt
git clone <url-du-depot>
cd catheo-super-admin

# Installer les dépendances
npm install
```

---

## 3. Configuration & Environnements

Les fichiers de configuration sont situés dans `src/environments/` :
- `environment.development.ts` : Environnement de développement local (ex. `http://localhost:8000/api/v1`)
- `environment.ts` : Environnement de production (ex. `https://api.catheo.org/api/v1`)

Variables disponibles :
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.catheo.org/api/v1',
  appName: 'Cathéo Plateforme Centrale',
  storagePrefix: 'catheo_',
  sessionTimeoutMinutes: 60,
};
```

---

## 4. Parcours d'Authentification & Connexion

### 4.1. Portail Super Admin (`/auth/admin`)
- Accessible aux seuls utilisateurs disposant du privilège `user_type: 'super_admin'`.
- En cas de tentative d'accès avec un compte organisationnel, l'accès est refusé (403) et la session est purgée.

### 4.2. Portail Organisation (`/auth/organisation`)
- L'utilisateur est invité à spécifier son espace pastoral d'intention :
  - `[ OPPE ] Enfants`
  - `[ OPPJ ] Jeunes`
  - `[ OPPA ] Adultes`
- **Validation croisée certifiée :** Le choix de l'utilisateur est une simple intention. Dès l'obtention du token Sanctum, l'application interroge immédiatement `/api/v1/organisation/context`. Si le type réel certifié par le serveur ne correspond pas à l'espace choisi, l'accès est révoqué avec l'erreur `SPACE_MISMATCH` et la session est intégralement nettoyée.

---

## 5. Espaces Métiers : OPPE, OPPJ & OPPA

| Espace Pastoral | Sections Associées | Public Cible | Fonctionnalités Clés |
|-----------------|--------------------|--------------|----------------------|
| **OPPE** | `SEC-ENFANTS-PRI`, `SEC-ENFANTS-COL` | Enfants Primaire & Collège | Inscriptions, Catéchumènes, Suivi sacrements, Caisse, Pèlerinages |
| **OPPJ** | `SEC-JEUNES` | Jeunes & Lycéens | Activités de jeunesse, Pèlerinages jeunes, Suivi des effectifs jeunes |
| **OPPA** | `SEC-ADULTES` | Adultes | Catéchuménat adulte, Groupes de prière, Missions pastorales |

---

## 6. Sécurité RBAC & Multi-Tenant

### 6.1. Multi-Tenant Strict
- Chaque requête HTTP vers les endpoints d'organisation est associée au token Sanctum de l'utilisateur authentifié.
- L'en-tête `X-Organisation-Id` est transmis pour valider la concordance du tenant sans jamais substituer la vérification serveur.
- Aucune fuite d'informations (paroissiens, opérations de caisse, activités) n'est possible entre deux organisations distinctes.

### 6.2. Contrôle d'Accès Basé sur les Rôles (RBAC)
- Les permissions (`Membres`, `Activités`, `Caisse`, `Pèlerinages`, `Exports`, `Audit`) sont vérifiées en amont par `PermissionGuard` et dynamiquement dans l'UI via `PermissionService`.
- Les boutons d'actions protégées (création, suppression, export, impression) sont masqués si l'utilisateur ne dispose pas du privilège requis.

---

## 7. Gestion des Pèlerinages & Participants

Les participants aux campagnes de pèlerinage sont strictement caractérisés par :
- `nom` & `prenoms`
- `age`
- `telephone`
- `taille` de kit : `M`, `L`, `XL`, `XXL`, `XXXL`.

Conformément à la directive d'architecture F18/F22, les champs `date_naissance` et `email` ont été définitivement exclus du modèle de participant de pèlerinage pour fluidifier les inscriptions paroissiales.

---

## 8. Moteur d'Exports & d'Impression

- **Export de données :** Format CSV encodé en UTF-8 avec BOM (`\uFEFF`) et séparateur `;` pour une ouverture parfaite dans Microsoft Excel et LibreOffice.
- **Impression :** Génération directe côté navigateur via les media queries CSS `@media print` de mise en page A4. Aucun composant serveur PDF n'est requis.

---

## 9. Déploiement & Mise en Production

```bash
# 1. Vérification TypeScript
npx tsc --noEmit

# 2. Exécution des tests automatisés
npx ng test

# 3. Compilation optimisée de production
npm run build

# 4. Les fichiers générés sont disponibles dans dist/catheo-super-admin/browser/
```

Consulter le guide complet dans [`DEPLOIEMENT.md`](file:///c:/Users/Kouadio%20Ferdinand/Desktop/ANGULAR/catheo-super-admin/DEPLOIEMENT.md).

---

## 10. Maintenance & Dépannage

### 10.1. Erreur `SPACE_MISMATCH`
- **Symptôme :** L'utilisateur reçoit `"Votre compte est rattaché à l'espace OPPE. Vous ne pouvez pas vous connecter à l'espace OPPJ."`
- **Action :** L'utilisateur doit sélectionner le bouton radio correspondant au type de sa paroisse/organisation sur l'écran de connexion.

### 10.2. Session expirée ou 401
- L'intercepteur HTTP capture automatiquement les retours 401 et redirige vers la page de connexion appropriée tout en affichant un toast explicatif.

### 10.3. Erreurs réseau 500 / Passerelle
- L'application bascule automatiquement sur les composants `ErrorStateComponent` offrant un bouton « Réessayer » sans recharger brutalement la page web.
