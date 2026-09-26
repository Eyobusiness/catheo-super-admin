import { Routes } from '@angular/router';

export const PRODUITS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/produits-list-page.component').then(
        (m) => m.ProduitsListPageComponent
      ),
  },
  {
    path: 'nouveau',
    loadComponent: () =>
      import(
        '../pages/produit-create-page/produit-create-page.component'
      ).then((m) => m.ProduitCreatePageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import(
        '../pages/produit-detail-page/produit-detail-page.component'
      ).then((m) => m.ProduitDetailPageComponent),
  },
  {
    path: ':id/modifier',
    loadComponent: () =>
      import(
        '../pages/produit-edit-page/produit-edit-page.component'
      ).then((m) => m.ProduitEditPageComponent),
  },
];
