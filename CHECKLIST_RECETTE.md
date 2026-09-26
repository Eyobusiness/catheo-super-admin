# Checklist de Recette Fonctionnelle — Cathéo Plateforme

Cette checklist détaille l'ensemble des cas d'usage et scénarios de test fonctionnels à valider lors de la phase de recette client et de pré-mise en production.

---

## 1. Authentification & Sécurité des Accès

- [ ] **1.1. Login Super Admin (`/auth/admin`)**
  - [ ] Saisie d'identifiants valides Super Admin → Redirection vers `/super-admin/dashboard`.
  - [ ] Tentative de connexion avec un mot de passe incorrect → Message d'erreur clair "Identifiants invalides".
  - [ ] Tentative de connexion d'un utilisateur sans droits Super Admin → Refus 403 et purge de session.

- [ ] **1.2. Login Organisation — Sélection d'Espace (`/auth/organisation`)**
  - [ ] Présence visuelle des 3 boutons de choix : `[ OPPE ] Enfants`, `[ OPPJ ] Jeunes`, `[ OPPA ] Adultes`.
  - [ ] Choix par défaut positionné sur OPPE (ou préférence mémorisée dans le navigateur).
  - [ ] Les 3 choix sont cliquables et modifient l'état sélectionné.
  - [ ] Absence totale de lien vers le portail Super Admin sur cette page.

- [ ] **1.3. Validation Croisée des Espaces Pastoraux**
  - [ ] Compte OPPE + choix OPPE → Connexion autorisée, redirection vers `/organisation/oppe`.
  - [ ] Compte OPPE + choix OPPJ → Refus immédiat avec message explicite "Votre compte est rattaché à l'espace OPPE...".
  - [ ] Compte OPPE + choix OPPA → Refus immédiat avec message explicite d'inadéquation d'espace.
  - [ ] Compte OPPJ + choix OPPJ → Connexion autorisée, redirection vers `/organisation/oppj`.
  - [ ] Compte OPPJ + choix OPPE → Refus immédiat avec message d'inadéquation.
  - [ ] Compte OPPA + choix OPPA → Connexion autorisée, redirection vers `/organisation/oppa`.
  - [ ] Compte OPPA + choix OPPE → Refus immédiat avec message d'inadéquation.

- [ ] **1.4. Déconnexion (`Logout`)**
  - [ ] Clic sur le bouton de déconnexion dans le menu utilisateur.
  - [ ] Token Sanctum purgé du stockage local.
  - [ ] Redirection vers la page de login appropriée.
  - [ ] Le bouton "Précédent" du navigateur ne permet pas de revenir sur une page protégée.

---

## 2. Tableaux de Bord (Dashboards)

- [ ] **2.1. Dashboard Super Admin (`/super-admin/dashboard`)**
  - [ ] Affichage des KPI réels : total des paroisses, organisations actives, volume des abonnements et flux financiers.
  - [ ] Répartition par type de paroisse et formules souscrites.
  - [ ] Bouton d'actualisation sans rechargement de page.

- [ ] **2.2. Dashboard Organisation OPPE (`/organisation/oppe`)**
  - [ ] Synthèse pastorale de l'année en cours affichée.
  - [ ] Distinction nette entre membres de l'organisation et enfants catéchumènes CATHEO.
  - [ ] Affichage des effectifs Primaire (`SEC-ENFANTS-PRI`) et Collège (`SEC-ENFANTS-COL`).

- [ ] **2.3. Dashboard Organisation OPPJ (`/organisation/oppj`)**
  - [ ] Synthèse pastorale restreinte à la jeunesse (`SEC-JEUNES`).
  - [ ] Aucune donnée d'enfants du primaire affichée dans cet espace.

---

## 3. Gestion Pastorale & Paroissiale

- [ ] **3.1. Membres de l'Organisation (`/organisation/membres`)**
  - [ ] Affichage du tableau paginé des membres.
  - [ ] Filtrage par terme de recherche, statut (actif/inactif) et sexe.
  - [ ] Modal d'ajout de membre : validation des champs requis, création effective via l'API.
  - [ ] Modification des coordonnées d'un membre existant.
  - [ ] Changement de statut ou suppression logique d'un membre.

- [ ] **3.2. Activités Pastorales (`/organisation/activites`)**
  - [ ] Liste paginée des activités et retraites paroissiales.
  - [ ] Filtres par type d'activité et plage de dates.
  - [ ] Création d'une nouvelle activité : contrôle des dates (début/fin) et des lieux.
  - [ ] Consultation des détails de l'activité dans la modale dédiée.

- [ ] **3.3. Population CATHEO (`/organisation/catheo`)**
  - [ ] Affichage des catéchumènes rattachés aux sections de l'espace actif.
  - [ ] Filtrage par niveau, section et statut pastoral.
  - [ ] Consultation détaillée de la fiche d'un catéchumène avec historique des sacrements.

---

## 4. Pèlerinages, Participants & Caisse

- [ ] **4.1. Campagnes de Pèlerinages (`/organisation/pelerinages`)**
  - [ ] Liste des campagnes avec indicateurs de capacité et taux de remplissage.
  - [ ] Création / Modification d'une campagne de pèlerinage.
  - [ ] Définition des tarifs et options de transport/hébergement.
  - [ ] Changement de statut de la campagne (Brouillon → Ouverte → Clôturée).

- [ ] **4.2. Inscriptions & Participants**
  - [ ] Formulaire d'inscription d'un participant :
    - [ ] Présence obligatoire des champs : Nom, Prénoms, Âge, Téléphone, Taille de kit (`M`, `L`, `XL`, `XXL`, `XXXL`).
    - [ ] Absence totale des champs `date_naissance` et `email` sur le formulaire de participant.
  - [ ] Suivi du statut de participation (Prévue, Présente, Absente).

- [ ] **4.3. Caisse & Opérations Financières (`/organisation/caisse`)**
  - [ ] Journal des opérations de caisse : entrées, sorties et encaissements de pèlerinages.
  - [ ] Enregistrement d'un paiement partiel ou total pour un participant.
  - [ ] Calcul et affichage exact du reste à payer selon les retours de l'API.
  - [ ] Annulation d'une opération avec motif obligatoire.

---

## 5. Statistiques, Exports & Impression

- [ ] **5.1. Statistiques & Rapports (`/organisation/statistiques`)**
  - [ ] Chargement des graphiques et indicateurs pastoraux sans données fictives.
  - [ ] Filtrage par année pastorale.

- [ ] **5.2. Exports de Données (`/organisation/exports`)**
  - [ ] Téléchargement d'un export CSV (Membres, Caisse, Pèlerinages).
  - [ ] Vérification du fichier CSV téléchargé : séparateur `;`, encodage UTF-8 (caractères accentués préservés).

- [ ] **5.3. Impression Navigateur**
  - [ ] Clic sur le bouton d'impression d'une fiche ou d'un rapport.
  - [ ] Déclenchement de la boîte de dialogue d'impression système (`window.print()`).
  - [ ] Aperçu avant impression au format A4 sans header, ni sidebar, ni boutons superflus.

---

## 6. Ergonomie, Responsive & Accessibilité

- [ ] **6.1. Adaptation Multi-Écrans**
  - [ ] Écran 1920x1080 (Desktop Large) : Disposition fluide sans étirement excessif.
  - [ ] Écran 1440x900 (Desktop Standard) : Alignement optimal des cartes et grilles.
  - [ ] Tablette 1024x768 et 768x1024 : Adaptation de la sidebar et des tables avec scroll horizontal doux.
  - [ ] Mobile 375x667 et 480x800 : Menu burger escamotable, boutons pleine largeur, formulaires lisibles.

- [ ] **6.2. Navigation au Clavier & Lecteurs d'Écran**
  - [ ] Touche `Tab` séquentielle sur tous les éléments interactifs.
  - [ ] Touche `Escape` fonctionnelle pour fermer les fenêtres modales.
  - [ ] Présence des attributs `aria-label`, `role` et des messages d'erreur associés aux champs invalidés.
