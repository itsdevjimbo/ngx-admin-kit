import { Routes } from '@angular/router';
import { createResourceRoutes } from 'ngx-admin-kit';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '', loadChildren: () => createResourceRoutes() },
];
