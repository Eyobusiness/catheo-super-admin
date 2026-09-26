# F26 — CARTOGRAPHIE DES COMPOSANTS & ARCHITECTURE ANGULAR 21
=============================================================================

> **Projet :** `catheo-super-admin`  
> **Framework :** Angular 21.0+ Standalone  
> **Paradigme :** Signals (`signal`, `computed`), OnPush, Desktop-First CSS  
> **Emplacement :** `src/app/features/super-admin/` & `src/app/shared/`

---

## 1. Arborescence Globale des Modules & Composants

```
src/app/
├── core/                                # Services Singletons, Intercepteurs, Guards
│   ├── guards/
│   │   ├── auth.guard.ts                # Protection des routes par Token JWT
│   │   └── role.guard.ts                # Vérification RBAC Super Admin
│   ├── interceptors/
│   │   ├── auth.interceptor.ts          # Injection Bearer Token automatique
│   │   └── error.interceptor.ts         # Capture & propagation unifiée des erreurs HTTP
│   └── services/
│       ├── auth.service.ts              # Session, profil courant & statut d'authentification
│       └── toast.service.ts             # File d'attente réactive de notifications toast
│
├── features/super-admin/                # Modules Fonctionnels Super Admin
│   ├── abonnements/                     # Module Abonnements Découplés
│   │   ├── components/                  # Composants de présentation & formulaire
│   │   │   ├── abonnement-form-modal.component.ts
│   │   │   └── abonnement-stats-card.component.ts
│   │   ├── models/abonnement.model.ts   # Typages TypeScript stricts
│   │   ├── pages/
│   │   │   └── abonnements-list-page.component.ts # Page principale (Paroisses vs Organisations)
│   │   └── services/abonnement.service.ts # Consommation API Abonnements F25
│   │
│   ├── audit/                           # Module Journal d'Activité
│   │   ├── models/audit.model.ts        # Typages AuditLog & AuditFilters
│   │   ├── pages/
│   │   │   └── audit-logs-page.component.ts # Vue hybride Tableau / Timeline
│   │   └── services/audit.service.ts    # Consommation GET /api/v1/super-admin/audit-logs
│   │
│   ├── dashboard/                       # Module Dashboard Intelligent
│   │   ├── components/
│   │   │   ├── dashboard-notifications/ # Centre de notifications intelligent
│   │   │   ├── dashboard-parish-summary/ # Résumé d'activité diocésaine
│   │   │   ├── dashboard-recent-activity/ # Timeline d'activité en temps réel
│   │   │   ├── dashboard-subscription-summary/ # Double carte CATHEO vs Organisations + SaaS
│   │   │   └── dashboard-trash-preview/ # Mini-carte réactive de la corbeille
│   │   ├── models/dashboard.model.ts    # Modèle de données unifié
│   │   ├── pages/
│   │   │   └── dashboard-page.component.ts # Orchestrateur principal avec 5 KPI et skeletons
│   │   └── services/dashboard.service.ts # Données consolidées et rafraîchissement
│   │
│   ├── formules/                        # Module Formules & Tarifications
│   │   ├── components/formule-card.component.ts
│   │   ├── models/formule.model.ts
│   │   ├── pages/
│   │   │   └── formules-list-page.component.ts # Grille avec filtres produit/gratuit/actif
│   │   └── services/formule.service.ts
│   │
│   ├── organisations/                   # Module Organisations Pastorales
│   │   ├── components/
│   │   │   ├── organisation-card.component.ts
│   │   │   ├── organisation-form-modal.component.ts # Création unitaire / batch
│   │   │   └── organisation-status-badge.component.ts # Badges liée (vert) / indépendant (violet)
│   │   ├── models/organisation.model.ts
│   │   ├── pages/
│   │   │   ├── organisations-list-page.component.ts # Liste avec filtres multi-facettes
│   │   │   └── organisation-detail-page.component.ts # Fiche détail à 9 onglets par Signals
│   │   └── services/super-admin-organisation.service.ts # API Organisations F25
│   │
│   ├── paroisses/                       # Module Paroisses Diocésaines
│   │   ├── components/
│   │   │   ├── paroisse-card.component.ts
│   │   │   └── paroisse-form-modal.component.ts
│   │   ├── models/paroisse.model.ts
│   │   ├── pages/
│   │   │   ├── paroisses-list-page.component.ts
│   │   │   └── paroisse-detail-page.component.ts # Bloc organisations rattachées + Modal batch
│   │   └── services/super-admin-paroisse.service.ts
│   │
│   ├── produits/                        # Module Produits SaaS (CATHEO, OPPE, OPPJ, OPPA)
│   │   ├── models/produit.model.ts
│   │   ├── pages/
│   │   │   └── produits-list-page.component.ts # Présentation des 4 suites logicielles
│   │   └── services/produit.service.ts
│   │
│   ├── trash/                           # Module Audit des Suppressions (Corbeille)
│   │   ├── models/trash.model.ts        # Typage TrashItem & TrashStats
│   │   ├── pages/
│   │   │   └── trash-list-page.component.ts # Tableau corbeille, modal dépendances & actions
│   │   └── services/trash.service.ts    # GET /trash, GET /trash/{uuid}, restore, force delete
│   │
│   └── users/                           # Module Utilisateurs & Sécurité
│       ├── models/utilisateur.model.ts
│       ├── pages/
│       │   └── utilisateurs-list-page.component.ts # Tableau moderne, modals détail & reset pwd
│       └── services/utilisateur.service.ts # Consommation /super-admin/users
│
└── shared/                              # Composants d'Interface Réutilisables
    ├── components/
    │   ├── badge/badge.component.ts     # Badges sémantiques (succès, avertissement, etc.)
    │   ├── button/button.component.ts   # Boutons primaires, secondaires, outline, danger
    │   ├── card/card.component.ts       # Conteneur de carte stylisé
    │   ├── confirm-dialog/confirm-dialog.component.ts # Boîte modale de confirmation sécurisée
    │   ├── empty-state/empty-state.component.ts # Affichage pour listes vides
    │   ├── error-state/error-state.component.ts # Bannière et réessai sur erreur
    │   ├── modal/modal.component.ts     # Conteneur modale avec backdrop et fermeture clavier
    │   ├── page-header/page-header.component.ts # Entête unifié avec titre, badge et actions
    │   ├── skeleton/skeleton.component.ts # Animation shimmer de préchargement
    │   ├── stat-card/stat-card.component.ts # Carte de statistique avec icône, variation et tooltip
    │   ├── table/table.component.ts     # Tableau stylisé
    │   ├── tabs/tabs.component.ts       # Système d'onglets réactifs
    │   ├── toast/toast.component.ts     # Affichage toast animé
    │   └── upload/upload.component.ts   # Zone de glisser-déposer de médias
    └── pipes/
        ├── currency-cfa.pipe.ts         # Formatage des montants monétaires en FCFA
        └── date-fr.pipe.ts              # Formatage des dates au format français
```

---

## 2. Matrice Détaillée des Composants Principaux

| Composant | Sélecteur | Standalone | Inputs Clés | Outputs Clés | Responsabilité |
|:---|:---|:---:|:---|:---|:---|
| **DashboardPageComponent** | `app-dashboard-page` | Oui | — | — | Orchestration du tableau de bord, 5 KPI, chargement asynchrone des blocs. |
| **StatCardComponent** | `app-stat-card` | Oui | `title`, `value`, `icon`, `variation`, `tooltip`, `loading` | — | Affichage d'indicateur clé avec animation skeleton et infobulle d'aide. |
| **DashboardSubscriptionSummaryComponent** | `app-dashboard-subscription-summary` | Oui | `loading` | `filterByProduct` | Affichage découplé Abonnements Paroisses vs Abonnements Organisations + grille SaaS. |
| **DashboardRecentActivityComponent** | `app-dashboard-recent-activity` | Oui | `activities`, `loading` | `openAudit` | Timeline chronologique visuelle des derniers événements d'audit. |
| **DashboardNotificationsComponent** | `app-dashboard-notifications` | Oui | `notifications`, `loading` | `actionClick` | Centre d'alertes intelligentes avec niveaux de criticité (info, warning, danger). |
| **DashboardTrashPreviewComponent** | `app-dashboard-trash-preview` | Oui | `stats`, `loading` | `openTrash` | Mini-carte avec décompte des éléments supprimés et lien rapide vers la corbeille. |
| **OrganisationDetailPageComponent** | `app-organisation-detail-page` | Oui | — | — | Fiche organisation à 9 onglets gouvernée par Signals sans aucun rechargement. |
| **ParoisseDetailPageComponent** | `app-paroisse-detail-page` | Oui | — | — | Fiche paroisse avec tableau des organisations rattachées et modal d'ajout batch. |
| **AbonnementsListPageComponent** | `app-abonnements-list-page` | Oui | — | — | Gestion séparée des abonnements diocésains et des abonnements des mouvements. |
| **UtilisateursListPageComponent** | `app-utilisateurs-list-page` | Oui | — | — | Tableau de bord des comptes utilisateurs, modal de détails, rôles, reset mot de passe. |
| **AuditLogsPageComponent** | `app-audit-logs-page` | Oui | — | — | Journalisation unifiée avec bascule de mode Tableau/Timeline et recherche instantanée. |
| **TrashListPageComponent** | `app-trash-list-page` | Oui | — | — | Audit et gestion de la corbeille, restauration et purge définitive sécurisée. |
| **SkeletonComponent** | `app-skeleton` | Oui | `width`, `height`, `shape` | — | Placeholder animé simulant le contenu textuel, avatar ou carte en cours de chargement. |
| **TabsComponent** | `app-tabs` | Oui | `tabs`, `activeTab` | `tabChange` | Sélecteur d'onglets stylisé avec indicateur actif fluide et badges de compteur. |
| **UploadComponent** | `app-upload` | Oui | `accept`, `maxSizeMb`, `currentUrl` | `fileSelected` | Zone d'upload de fichiers avec glisser-déposer et prévisualisation d'image. |

---

## 3. Gestion Réactive de l'État (State Management par Signals)

Tous les nouveaux composants et services privilégient l'utilisation des **Angular Signals** plutôt que les RxJS Subjects impératifs, garantissant des performances optimales et une détection de changement chirurgicale (`OnPush`) :

1. **Signaux de Données Brutes :**
   ```typescript
   readonly data = signal<T | null>(null);
   readonly loading = signal<boolean>(true);
   readonly error = signal<string | null>(null);
   ```

2. **Signaux de Filtrage & Recherche :**
   ```typescript
   readonly searchQuery = signal<string>('');
   readonly selectedModule = signal<string>('all');
   readonly selectedStatut = signal<string>('all');
   ```

3. **Signaux Calculés (`computed`) :**
   ```typescript
   readonly filteredItems = computed(() => {
     const query = this.searchQuery().toLowerCase().trim();
     const items = this.data() || [];
     return items.filter(item => ...);
   });
   ```

Cette architecture élimine les fuites de mémoire (pas d'abonnements RxJS résiduels non nettoyés) et offre une réactivité instantanée à la frappe ou au changement de filtre.
