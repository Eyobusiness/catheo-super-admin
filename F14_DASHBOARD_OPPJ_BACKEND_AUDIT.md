# Audit Backend Laravel — Étape F14 (Dashboard OPPJ)

**Date d'audit** : 23 Septembre 2026  
**Application Backend** : `catheo` (Laravel 11, PHP 8.2)  
**Application Frontend** : `catheo-super-admin` (Angular 21)  
**Périmètre** : Dashboard Organisation Pastorale Pour les Jeunes (OPPJ)

---

## 1. Objectif de l'Audit

Vérifier rigoureusement l'existence, la signature, le comportement et le cloisonnement de l'endpoint du tableau de bord organisationnel pour la population **OPPJ**, en conformité avec les règles métier de Cathéo :
- Correspondance stricte : **`OPPJ = SEC-JEUNES`**
- Filtrage strict sur **l'année catéchétique active/courante** de la paroisse
- Découplage strict entre **membres de l'organisation** et **jeunes catéchumènes de la paroisse**

---

## 2. Endpoints Réels Disponibles

L'inspection de `c:\xampp\htdocs\catheo\routes\api.php` révèle les routes suivantes pour le module Organisation :

```php
Route::middleware(['auth:sanctum', 'organisation'])->prefix('organisation')->group(function () {
    // Contexte & profil de l'organisation
    Route::get('/context', [OrganisationProfileController::class, 'context']);
    Route::get('/info', [OrganisationProfileController::class, 'context']);
    Route::put('/info', [OrganisationProfileController::class, 'update']);

    // Reporting, Statistiques & Exports
    // Dashboard général consolidé
    Route::get('/dashboard', [OrganisationDashboardController::class, 'index']);
    ...
});
```

### Signature de l'endpoint Dashboard :
- **Méthode** : `GET`
- **URL** : `/api/v1/organisation/dashboard`
- **Middlewares** : `auth:sanctum`, `organisation` (résolution du tenant d'après le token), vérification de permission `dashboard.read`.
- **Paramètre supporté** : `?fresh=true` (permet de forcer le recalcul en vidant le cache applicatif Redis/File de 120 secondes).

Aucun endpoint spécifique `/organisation/oppj/dashboard` n'est nécessaire ni présent : l'endpoint `/api/v1/organisation/dashboard` est **pleinement générique** et s'adapte automatiquement à l'organisation authentifiée.

---

## 3. Contrôleur et Service Backend

### Contrôleur : `App\Http\Controllers\Api\V1\Organisation\OrganisationDashboardController`
```php
public function index(Request $request): JsonResponse
{
    $this->checkPermission($request, 'dashboard.read');

    /** @var Organisation $organisation */
    $organisation = $request->attributes->get('organisation');

    $data = $this->dashboardService->getDashboard(
        $organisation,
        $request->boolean('fresh', false)
    );

    return response()->json([
        'status'  => 'success',
        'message' => 'Tableau de bord de l\'organisation récupéré avec succès.',
        'data'    => $data,
    ]);
}
```

### Règle métier de section : `App\Services\Organisation\CatheoPopulationService`
```php
public const CODE_ENFANTS_PRIMAIRE = 'SEC-ENFANTS-PRI';
public const CODE_ENFANTS_COLLEGE  = 'SEC-ENFANTS-COL';
public const CODE_JEUNES           = 'SEC-JEUNES';
public const CODE_ADULTES          = 'SEC-ADULTES';

public function getTargetSectionCodes(string $typeOrganisation): array
{
    return match (strtoupper(trim($typeOrganisation))) {
        Organisation::TYPE_OPPE => [self::CODE_ENFANTS_PRIMAIRE, self::CODE_ENFANTS_COLLEGE],
        Organisation::TYPE_OPPJ => [self::CODE_JEUNES],
        Organisation::TYPE_OPPA => [self::CODE_ADULTES],
        default                 => [],
    };
}
```

### Extraction des métriques CATHEO : `App\Services\Organisation\OrganisationDashboardService`
```php
public function getCatheoMetrics(Organisation $organisation): array
{
    $paroisseId = (int) $organisation->paroisse_configuration_id;
    if (!$paroisseId) {
        return ['catheo_connecte' => false];
    }

    $anneeCourante = AnneeCatechese::getAnneeCourante($paroisseId);
    if (!$anneeCourante) {
        return [
            'catheo_connecte' => false,
            'message'         => 'Aucune année catéchétique active sur la paroisse.',
        ];
    }

    $targetCodes = $this->catheoPopulationService->getTargetSectionCodes($organisation->type_organisation);
    if (empty($targetCodes)) {
        return [
            'catheo_connecte' => false,
            'message'         => 'Aucune correspondance de section pour ce type d\'organisation.',
        ];
    }

    $baseQuery = InscriptionAnnuelle::where('paroisse_configuration_id', $paroisseId)
        ->where('annee_catechese_id', $anneeCourante->id)
        ->whereHas('section', function ($q) use ($targetCodes) {
            $q->whereIn('code', $targetCodes);
        });

    $total = (clone $baseQuery)->count();

    // Répartition par niveau
    $parNiveau = (clone $baseQuery)
        ->with('niveau')
        ->select('niveau_id', DB::raw('count(*) as total'))
        ->groupBy('niveau_id')
        ->get()
        ->map(fn ($item) => [
            'niveau_id' => $item->niveau_id,
            'niveau'    => $item->niveau?->nom ?? 'Inconnu',
            'total'     => $item->total,
        ]);

    $result = [
        'catheo_connecte'     => true,
        'annee_catechese'     => $anneeCourante->libelle,
        'total_population'    => $total,
        'repartition_niveaux' => $parNiveau,
        'repartition_classes' => $parClasse,
    ];

    if (strtoupper($organisation->type_organisation) === Organisation::TYPE_OPPE) {
        $result['total_primaire'] = $totalPrimaire;
        $result['total_college']  = $totalCollege;
    } elseif (strtoupper($organisation->type_organisation) === Organisation::TYPE_OPPJ) {
        $result['total_jeunes'] = $total;
    } elseif (strtoupper($organisation->type_organisation) === Organisation::TYPE_OPPA) {
        $result['total_adultes'] = $total;
    }

    return $result;
}
```

---

## 4. Structure de la Réponse JSON pour OPPJ

Exemple de réponse retournée pour une organisation de type `OPPJ` :

```json
{
  "status": "success",
  "message": "Tableau de bord de l'organisation récupéré avec succès.",
  "data": {
    "organisation": {
      "id": 2,
      "uuid": "4c3b7782-bcf3-4813-bc75-9b247f12e8b2",
      "code": "OPPJ-STE-FAMILLE",
      "nom": "Jeunesse Pastorale Sainte Famille",
      "type_organisation": "OPPJ",
      "statut": "actif"
    },
    "membres": {
      "total": 28,
      "actifs": 25,
      "inactifs": 3
    },
    "activites": {
      "total": 8,
      "brouillon": 1,
      "planifiees": 3,
      "en_cours": 2,
      "terminees": 2,
      "annulees": 0,
      "taux_moyen_execution": 82.5
    },
    "pelerinages": {
      "campagnes_total": 1,
      "campagnes_ouvertes": 1,
      "campagnes_cloturees": 0,
      "campagnes_annulees": 0,
      "capacite_totale": 50,
      "places_occupees": 40,
      "places_restantes": 10,
      "total_inscrits": 40,
      "inscrits_payes": 35,
      "inscrits_partiellement_payes": 5,
      "inscrits_en_attente": 0,
      "inscrits_annules": 0,
      "inscrits_presents": 0,
      "inscrits_absents": 0,
      "montant_attendu": 400000.0,
      "montant_encaisse": 360000.0,
      "reste_a_encaisser": 40000.0
    },
    "finances": {
      "total_entrees": 1200000.0,
      "total_sorties": 700000.0,
      "solde_caisse": 500000.0
    },
    "catheo": {
      "catheo_connecte": true,
      "annee_catechese": "2026-2027",
      "total_population": 180,
      "total_jeunes": 180,
      "repartition_niveaux": [
        { "niveau_id": 11, "niveau": "1ère Année Jeunes", "total": 45 },
        { "niveau_id": 12, "niveau": "2ème Année Jeunes", "total": 40 },
        { "niveau_id": 13, "niveau": "3ème Année Jeunes", "total": 35 },
        { "niveau_id": 14, "niveau": "4ème Année Jeunes", "total": 32 },
        { "niveau_id": 15, "niveau": "5ème Année Jeunes", "total": 28 }
      ],
      "repartition_classes": []
    }
  }
}
```

---

## 5. Points Clés & Validation

1. **Section exacte** : Seul le code `SEC-JEUNES` est pris en compte. Les catéchumènes inscrits en primaire (`SEC-ENFANTS-PRI`) ou collège (`SEC-ENFANTS-COL`) sont formellement exclus de la population OPPJ.
2. **Année active certifiée** : L'année catéchétique provient directement de `AnneeCatechese::getAnneeCourante($paroisseId)`. Les années historiques antérieures ne sont pas mélangées.
3. **Membres ≠ Catéchumènes** :
   - `data.membres` : membres encadrants et animateurs enregistrés dans la table `membres` de l'organisation pastorale.
   - `data.catheo` : jeunes paroissiens inscrits à la catéchèse dans la section `SEC-JEUNES`.
4. **Pas d'effet UX sur les droits** : La clé localStorage `catheo_organisation_space_pref` n'a aucune incidence sur l'autorisation backend. Le contexte organisationnel est rigoureusement extrait du token Sanctum.
