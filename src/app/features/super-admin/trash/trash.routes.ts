import { Routes } from '@angular/router';

export const TRASH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/trash-list/trash-list-page.component').then(
        (m) => m.TrashListPageComponent
      ),
  },
];
