import { Routes } from '@angular/router';
import { isDevMode } from '@angular/core';
import { createResourceRoutes } from 'ngx-admin-kit';

// Only the throwaway preview replaces the stub Users list with a populated consumer page.
const prototypeRoutes: Routes =
  isDevMode() && new URLSearchParams(location.search).has('variant')
    ? [
        {
          path: 'users',
          pathMatch: 'full',
          data: { page: 'users' },
          loadComponent: () =>
            import('./shell-page.prototype').then((module) => module.ShellPagePrototype),
        },
      ]
    : [];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  ...prototypeRoutes,
  {
    path: 'shell-prototype/:page',
    loadComponent: () =>
      import('./shell-page.prototype').then((module) => module.ShellPagePrototype),
  },
  { path: '', loadChildren: () => createResourceRoutes() },
];
