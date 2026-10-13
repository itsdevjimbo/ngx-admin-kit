import { Routes } from '@angular/router';
import { createResourceRoutes } from 'ngx-admin-kit';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'shell-prototype/:page',
    loadComponent: () =>
      import('./shell-page.prototype').then((module) => module.ShellPagePrototype),
  },
  { path: '', loadChildren: () => createResourceRoutes() },
];
