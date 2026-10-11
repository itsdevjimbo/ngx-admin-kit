# Ngx Admin Kit

Resource registration and generated list, create, and edit pages for Angular applications.

## Install

Once the first release is published to npm, install it in your Angular application:

```bash
npm install ngx-admin-kit
```

Version `0.0.1` supports Angular `^22.2.0`. Your application supplies `@angular/core`,
`@angular/common`, and `@angular/router` as peer dependencies. Earlier Angular versions have not
been tested.

The current release provides resource registration, routing, page titles, navigation, and edit
record IDs. Backend CRUD and form rendering are future work.

## Public API

- `provideResource(resource)` registers an `IResource`.
- `createResourceRoutes()` generates routes in an Angular injection context.
- `ADMIN_RESOURCES` exposes registered resources to consumer navigation and layouts.
- `IResource` and `IField` describe resource and field configuration.

## Define a resource

```ts
import type { IResource } from 'ngx-admin-kit';

export const usersResource: IResource = {
  id: 'users',
  title: 'Users',
  route: 'users',
  apiEndpoint: '/api/users',
  form: () => [
    { name: 'Name', key: 'name', type: 'text' },
    { name: 'Email', key: 'email', type: 'email' },
  ],
};
```

## Register resources and mount their routes

Consumers own the URL prefix, layout, navigation, redirects, empty states, and not-found handling.
Register resources with `provideResource()` and mount their generated pages wherever they belong in
your application's routes using `createResourceRoutes()`. Both functions and the `ADMIN_RESOURCES`
registry token are exported from `ngx-admin-kit`.

For example, mount resources at the root and explicitly redirect `/` to `/users`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';
import { createResourceRoutes, provideResource } from 'ngx-admin-kit';
import { usersResource } from './resources/users.resource';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '', loadChildren: () => createResourceRoutes() },
  // Add other application routes here, followed by your wildcard route.
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding()), provideResource(usersResource)],
};
```

Call the factory inside `loadChildren` so it runs in Angular's injection context and reads the
registered resources. `withComponentInputBinding()` is required to pass resource metadata, form
mode, and record IDs to the shared pages. Resource providers can appear before or after
`provideRouter()`; generated routes follow resource registration order.

Each resource uses the existing `IResource` interface and generates a componentless parent at its
`route` slug with three lazy-loaded child pages. At the root, these URLs are:

- `/{route}` — list page
- `/{route}/create` — create page
- `/{route}/:recordId/edit` — edit page

To mount the same pages under `/settings/manage` with your own layout, replace the root routes with:

```ts
import { Component } from '@angular/core';
import { RouterOutlet, Routes } from '@angular/router';
import { createResourceRoutes } from 'ngx-admin-kit';

@Component({
  imports: [RouterOutlet],
  template: `
    <header><h1>Settings</h1></header>
    <main><router-outlet /></main>
  `,
})
export class SettingsLayout {}

export const routes: Routes = [
  {
    path: 'settings',
    component: SettingsLayout,
    children: [
      {
        path: 'manage',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          { path: '', loadChildren: () => createResourceRoutes() },
          // Add sibling routes here, followed by your wildcard route.
        ],
      },
    ],
  },
];
```

The Users URLs become `/settings/manage/users`, `/settings/manage/users/create`, and
`/settings/manage/users/:recordId/edit`. Create and back links resolve relative to the resource's
parent route and retain the prefix. A consumer layout can inject `ADMIN_RESOURCES` to build its own
navigation.

Resource IDs and route slugs must be unique. Slugs must contain only letters, numbers, hyphens, or
underscores, with at least one character. Invalid registrations throw when `createResourceRoutes()`
runs, normally when Angular first loads the mounted routes. An empty registry returns `[]`.
The factory supplies no layout, sidebar, default redirect, empty page, or wildcard route. Add these
behaviors to your own route configuration as needed. Place explicit empty-path redirects or empty
pages before the lazy mount, and wildcard routes last so sibling routes remain reachable.

Resource registration alone does not install routes.

## License

[MIT](LICENSE).
