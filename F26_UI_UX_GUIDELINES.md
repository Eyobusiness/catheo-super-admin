# F26 — GUIDE DE STYLE & DIRECTIVES D'EXPÉRIENCE UTILISATEUR (UI/UX)
=============================================================================

> **Projet :** `catheo-super-admin`  
> **Inspirations de Référence :** Stripe Dashboard, Linear App, Notion Workspace  
> **Approche Stylistique :** Desktop-First, Vanilla CSS Pur, Micro-interactions subtiles, Préparation Dark Mode

---

## 1. Philosophie & Principes Directeurs

L'interface Super Admin de CATHEO est conçue pour procurer une expérience utilisateur de niveau **SaaS d'élite** :
1. **Clarté Opérationnelle :** Réduire la charge cognitive de l'administrateur en hiérarchisant immédiatement les métriques vitales et les actions requises.
2. **Réactivité Instantanée :** Utilisation des Angular Signals pour des transitions sans aucun scintillement d'écran ni rechargement complet de page.
3. **Zéro Page Blanche :** Chaque composant ou vue gère systématiquement les 4 états d'interface :
   - *Loading* (avec skeleton loaders harmonieux reproduisant la forme des données à venir).
   - *Empty* (état vide informatif avec illustration vectorielle et bouton d'action contextuel).
   - *Error* (message explicite d'anomalie avec bouton de réessai sans perte de contexte).
   - *Success* (mise à jour fluide avec toasts non bloquants).

---

## 2. Palette de Couleurs & Variables CSS

Le système de design repose sur une palette sombre et raffinée (Dark Slate / Slate Gray), rehaussée de touches d'accentuation sémantiques :

```css
:root {
  /* Surfaces & Arrière-plans */
  --bg-primary: #0f172a;        /* Slate 900 - Fond principal de l'application */
  --bg-surface: #1e293b;        /* Slate 800 - Fond des cartes, modals, panneaux */
  --bg-surface-hover: #334155;  /* Slate 700 - Survol des éléments interactifs */
  --border-subtle: #334155;     /* Slate 700 - Bordures de séparation discrètes */
  --border-focus: #6366f1;      /* Indigo 500 - Mise en valeur des focus */

  /* Typographie & Textes */
  --text-primary: #f8fafc;      /* Slate 50 - Titres et valeurs majeures */
  --text-secondary: #94a3b8;    /* Slate 400 - Libellés secondaires et descriptions */
  --text-muted: #64748b;        /* Slate 500 - Métadonnées temporelles et placeholders */

  /* Couleurs Sémantiques & Accents */
  --color-primary: #3b82f6;      /* Bleu Électrique - Actions primaires, sélection active */
  --color-indigo: #6366f1;       /* Indigo - Cartes produits CATHEO Core */
  --color-emerald: #10b981;      /* Émeraude - Mode organisation 'liée', statuts actifs */
  --color-purple: #8b5cf6;       /* Violet Royal - Mode organisation 'indépendant' */
  --color-amber: #f59e0b;        /* Ambre - Alertes d'échéance, contrats en attente */
  --color-rose: #f43f5e;         /* Rose / Rouge - Suppressions, éléments corbeille, erreurs */
}
```

---

## 3. Typographie & Rythme Visuel

- **Famille de police :** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Échelle modulaire :**
  - `h1` (Titres de page) : `1.625rem` (26px), `font-weight: 700`, `letter-spacing: -0.025em`.
  - `h2` (En-têtes de cartes & modals) : `1.25rem` (20px), `font-weight: 600`.
  - `h3` (Sous-sections) : `1.0rem` (16px), `font-weight: 600`.
  - `Body / Tableau` : `0.875rem` (14px), `line-height: 1.5`.
  - `Badges & Micro-labels` : `0.75rem` (12px), `font-weight: 600`, `text-transform: uppercase`.

---

## 4. Composants Clés & Micro-Interactions

### A. Cartes KPI (`app-stat-card`)
- **Effet de survol :** `transform: translateY(-2px)` combiné avec une ombre portée diffuse `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)`.
- **Skeleton Shimmer :** Pendant le chargement, un dégradé linéaire animé circule de gauche à droite (`@keyframes shimmer`), évitant tout effet de saut d'écran (*layout shift*).

### B. Badges de Mode d'Organisation
- **Mode `liee` :**
  - Style : Fond `rgba(16, 185, 129, 0.12)`, texte `#34d399`, bordure `1px solid rgba(16, 185, 129, 0.25)`.
  - Signification : Organisation pastorale rattachée directement au conseil et à la paroisse diocésaine.
- **Mode `independant` :**
  - Style : Fond `rgba(139, 92, 246, 0.12)`, texte `#c084fc`, bordure `1px solid rgba(139, 92, 246, 0.25)`.
  - Signification : Mouvement diocésain ou organisation autonome dotée de sa propre gouvernance.

### C. Fenêtres Modales & Dialogues de Confirmation
- **Backdrop :** Flou d'arrière-plan `backdrop-filter: blur(4px)` avec fond assombri `rgba(15, 23, 42, 0.75)`.
- **Animation d'entrée :** `scale(0.97)` vers `scale(1)` et `opacity: 0` vers `1` en `180ms ease-out`.
- **Sécurité :** Fermeture par touche `Échap`, clic extérieur désactivable sur les actions critiques (ex: purge définitive de la corbeille).

### D. Système d'Onglets Réactifs (`app-tabs`)
- Transition fluide d'onglet via CSS sans rechargement de composants lourds.
- Indicateur de soulignement animé et compteur d'éléments optionnel pour chaque onglet.

---

## 5. Grille Responsive Desktop-First

L'application est optimisée en priorité pour les grands écrans de bureau et stations de travail de gestion, tout en s'adaptant parfaitement aux résolutions nomades :

| Point de rupture (*Breakpoint*) | Largeur d'écran | Adaptation de la mise en page |
|:---|:---|:---|
| **Ultra-Large (Desktop First)** | `≥ 1440px` | Grille 5 colonnes pour les KPI, double panneau d'abonnements côte à côte, timeline large. |
| **Large Desktop** | `1200px - 1439px` | Grille 3 + 2 pour les KPI, ajustement des espacements latéraux (`gap: 1.25rem`). |
| **Medium / Laptop** | `992px - 1199px` | Sidebar repliable, tableaux avec défilement horizontal fluide, KPI en 2 colonnes. |
| **Tablet** | `768px - 991px` | Sidebar sous forme de tiroir (drawer), cartes d'abonnements empilées verticalement. |
| **Mobile** | `< 768px` | Navigation simplifiée, boutons en pleine largeur, modals plein écran avec ascenseur scrollable. |

---

## 6. Accessibilité (A11y) & Préparation Dark Mode

- **Contraste Textuel :** Tous les textes principaux respectent le ratio minimal WCAG AA de `4.5:1` sur fond sombre.
- **Attributs ARIA :**
  - `role="dialog"` et `aria-modal="true"` sur les fenêtres modales.
  - `aria-label` descriptifs sur l'ensemble des boutons à icône seule (actions de tableau, boutons de fermeture).
- **Dark Mode Natif :** L'architecture des tokens CSS en variables (`var(--bg-primary)`, etc.) permet une bascule instantanée vers un thème clair ou personnalisé sans refactorisation du code HTML ou TypeScript.
