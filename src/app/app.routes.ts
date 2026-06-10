import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'offline-demo', pathMatch: 'full' },
  {
    path: 'offline-demo',
    loadComponent: () =>
      import('./pages/offline-demo/offline-demo').then((m) => m.OfflineDemoComponent),
  },
];
