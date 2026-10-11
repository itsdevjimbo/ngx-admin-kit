import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { Routes } from '@angular/router';
import { IResource } from './interfaces/resource.interface';

export const ADMIN_RESOURCES = new InjectionToken<readonly IResource[]>('ADMIN_RESOURCES');

/** Register a resource at application startup. */
export function provideResource(resource: IResource): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ADMIN_RESOURCES, multi: true, useValue: resource }]);
}

/** Generate resource routes in an injection context, such as a loadChildren callback. */
export function createResourceRoutes(): Routes {
  const resources = inject(ADMIN_RESOURCES, { optional: true }) ?? [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const resource of resources) {
    if (ids.has(resource.id)) {
      throw new Error(`Duplicate admin resource id "${resource.id}".`);
    }
    if (typeof resource.route !== 'string' || !/^[A-Za-z0-9_-]+$/.test(resource.route)) {
      throw new Error(
        `Invalid route slug "${resource.route}" for admin resource "${resource.id}". ` +
          'Use a nonempty slug containing only letters, numbers, hyphens, or underscores.',
      );
    }
    if (slugs.has(resource.route)) {
      throw new Error(`Duplicate admin resource route "${resource.route}".`);
    }
    ids.add(resource.id);
    slugs.add(resource.route);
  }

  return resources.map((resource) => ({
    path: resource.route,
    data: { resource },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/resource-list-page').then((m) => m.ResourceListPage),
      },
      {
        path: 'create',
        pathMatch: 'full',
        loadComponent: () => import('./pages/resource-form-page').then((m) => m.ResourceFormPage),
        data: { mode: 'create' },
      },
      {
        path: ':recordId/edit',
        pathMatch: 'full',
        loadComponent: () => import('./pages/resource-form-page').then((m) => m.ResourceFormPage),
        data: { mode: 'edit' },
      },
    ],
  }));
}
