import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  provideRouter,
  Router,
  RouterOutlet,
  Routes,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { IResource } from './interfaces/resource.interface';
import { ResourceFormPage } from './pages/resource-form-page';
import { ResourceListPage } from './pages/resource-list-page';
import { ADMIN_RESOURCES, createResourceRoutes, provideResource } from './provider';

const users: IResource = {
  id: 'user-records',
  title: 'Users',
  route: 'users',
  apiEndpoint: '/api/users',
  form: () => [],
};

const products: IResource = {
  id: 'product-records',
  title: 'Products',
  route: 'products',
  apiEndpoint: '/api/products',
  form: () => [],
};

@Component({ selector: 'test-home-page', template: '<h1>Home</h1>' })
class HomePage {}

@Component({ selector: 'test-not-found-page', template: '<h2>Consumer page not found</h2>' })
class NotFoundPage {}

@Component({ selector: 'test-empty-page', template: '<h2>No configured resources</h2>' })
class EmptyPage {}

@Component({
  selector: 'test-consumer-layout',
  imports: [RouterOutlet],
  template: `
    <section data-consumer-layout>
      <header><h1>Settings</h1></header>
      <main><router-outlet /></main>
    </section>
  `,
})
class ConsumerLayout {}

const mounts = [
  {
    name: 'at the root',
    prefix: '',
    mount: (children: Routes): Routes => children,
  },
  {
    name: 'under a consumer layout',
    prefix: '/settings/manage',
    mount: (children: Routes): Routes => [
      {
        path: 'settings',
        component: ConsumerLayout,
        children: [{ path: 'manage', children }],
      },
      { path: 'home', component: HomePage },
      { path: '**', component: NotFoundPage },
    ],
  },
];

function getPage<T>(harness: RouterTestingHarness, type: Type<T>): T {
  const page = harness.fixture.debugElement.query(By.directive(type));
  expect(page).toBeTruthy();
  return page!.componentInstance;
}

function getResourceRoute() {
  let route = TestBed.inject(Router).routerState.snapshot.root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route;
}

async function clickLink(harness: RouterTestingHarness, selector: string) {
  const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>(selector);
  expect(link).toBeTruthy();
  link!.click();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

describe.each(mounts)('resource routing $name', ({ prefix, mount }) => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          mount([
            { path: '', pathMatch: 'full', redirectTo: 'products' },
            { path: '', loadChildren: () => createResourceRoutes() },
            { path: 'home', component: HomePage },
            { path: '**', component: NotFoundPage },
          ]),
          withComponentInputBinding(),
        ),
        provideResource(users),
        provideResource(products),
      ],
    });
  });

  for (const resource of [users, products]) {
    it(`renders the ${resource.title} list with its resource metadata`, async () => {
      const harness = await RouterTestingHarness.create(`${prefix}/${resource.route}`);

      expect(getPage(harness, ResourceListPage).resource()).toBe(resource);
      expect(getResourceRoute().data['resource']).toBe(resource);
      expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe(resource.title);
      expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
        `${prefix}/${resource.route}/create`,
      );
    });

    it(`renders the ${resource.title} create page with its resource and mode`, async () => {
      const harness = await RouterTestingHarness.create(`${prefix}/${resource.route}/create`);
      const page = getPage(harness, ResourceFormPage);

      expect(page.resource()).toBe(resource);
      expect(page.mode()).toBe('create');
      expect(page.recordId()).toBeUndefined();
      expect(getResourceRoute().data['resource']).toBe(resource);
      expect(getResourceRoute().data['mode']).toBe('create');
      expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe(
        `Create ${resource.title}`,
      );
      expect(harness.routeNativeElement?.textContent).not.toContain('Record ID:');
      expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
        `${prefix}/${resource.route}`,
      );
    });

    it(`supports direct ${resource.title} edit navigation with metadata and the record ID`, async () => {
      const harness = await RouterTestingHarness.create(
        `${prefix}/${resource.route}/record-42/edit`,
      );
      const page = getPage(harness, ResourceFormPage);

      expect(page.resource()).toBe(resource);
      expect(page.mode()).toBe('edit');
      expect(page.recordId()).toBe('record-42');
      expect(getResourceRoute().data['resource']).toBe(resource);
      expect(getResourceRoute().data['mode']).toBe('edit');
      expect(getResourceRoute().paramMap.get('recordId')).toBe('record-42');
      expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe(
        `Edit ${resource.title}`,
      );
      expect(harness.routeNativeElement?.textContent).toContain('Record ID: record-42');
    });
  }

  it('renders the pages in the consumer-provided outlet', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users`);
    const layout = harness.routeNativeElement?.querySelector('[data-consumer-layout]');

    if (prefix) {
      expect(getPage(harness, ConsumerLayout)).toBeTruthy();
      expect(layout?.querySelector('main h2')?.textContent).toBe('Users');
    } else {
      expect(layout).toBeNull();
      expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-resource-list-page');
    }
    expect(harness.routeNativeElement?.querySelector('aside')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('nav')).toBeNull();
  });

  it('updates the record ID when the edit component is reused', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users/first/edit`);
    const page = getPage(harness, ResourceFormPage);

    await harness.navigateByUrl(`${prefix}/users/second/edit`);

    expect(getPage(harness, ResourceFormPage)).toBe(page);
    expect(page.recordId()).toBe('second');
    expect(harness.routeNativeElement?.textContent).toContain('Record ID: second');
    expect(harness.routeNativeElement?.textContent).not.toContain('Record ID: first');
  });

  it('clears the record ID when following the create link from edit', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users/42/edit`);
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      `${prefix}/users/create`,
    );

    await clickLink(harness, 'a');

    const page = getPage(harness, ResourceFormPage);
    expect(TestBed.inject(Router).url).toBe(`${prefix}/users/create`);
    expect(page.mode()).toBe('create');
    expect(page.recordId()).toBeUndefined();
    expect(harness.routeNativeElement?.textContent).not.toContain('Record ID:');
  });

  it('updates metadata when navigating between resource forms', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users/42/edit`);

    await harness.navigateByUrl(`${prefix}/products/23/edit`);

    const page = getPage(harness, ResourceFormPage);
    expect(page.resource()).toBe(products);
    expect(page.recordId()).toBe('23');
    expect(harness.routeNativeElement?.querySelector('h2')?.textContent).toBe('Edit Products');
  });

  it('uses the consumer redirect instead of the first registered resource', async () => {
    const harness = await RouterTestingHarness.create(prefix || '/');

    expect(TestBed.inject(Router).url).toBe(`${prefix}/products`);
    expect(getPage(harness, ResourceListPage).resource()).toBe(products);
  });

  it('retains the prefix when following create and back links', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/products`);

    await clickLink(harness, 'a');
    expect(TestBed.inject(Router).url).toBe(`${prefix}/products/create`);
    expect(getPage(harness, ResourceFormPage).mode()).toBe('create');

    await clickLink(harness, 'a');
    expect(TestBed.inject(Router).url).toBe(`${prefix}/products`);
    expect(getPage(harness, ResourceListPage).resource()).toBe(products);
  });

  it('retains the prefix when following the edit page back link', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users/42/edit`);
    expect(harness.routeNativeElement?.querySelector('p a')?.getAttribute('href')).toBe(
      `${prefix}/users`,
    );

    await clickLink(harness, 'p a');

    expect(TestBed.inject(Router).url).toBe(`${prefix}/users`);
    expect(getPage(harness, ResourceListPage).resource()).toBe(users);
  });

  it.each([
    'missing',
    'missing/create',
    'users/42',
    'users/42/edit/extra',
    'users/create/extra',
    'users/42/delete',
  ])('uses the consumer not-found page for %s', async (path) => {
    const harness = await RouterTestingHarness.create(`${prefix}/${path}`);

    expect(getPage(harness, NotFoundPage)).toBeTruthy();
    expect(TestBed.inject(Router).url).toBe(`${prefix}/${path}`);
    expect(harness.routeNativeElement?.textContent).toContain('Consumer page not found');
  });

  it('preserves sibling routes after the resource route factory', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users`);

    await harness.navigateByUrl(`${prefix}/home`);

    expect(getPage(harness, HomePage)).toBeTruthy();
    expect(harness.routeNativeElement?.textContent).toContain('Home');
  });

  it('preserves ordinary application routes outside the mount', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/users`);

    await harness.navigateByUrl('/home', HomePage);

    expect(harness.routeNativeElement?.textContent).toBe('Home');
    expect(harness.routeNativeElement?.querySelector('[data-consumer-layout]')).toBeNull();
  });
});

describe.each(mounts)('empty resource registry $name', ({ prefix, mount }) => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          mount([
            { path: '', pathMatch: 'full', component: EmptyPage },
            { path: '', loadChildren: () => createResourceRoutes() },
            { path: 'home', component: HomePage },
            { path: '**', component: NotFoundPage },
          ]),
        ),
      ],
    });
  });

  it('generates no routes without registered resources', () => {
    expect(TestBed.runInInjectionContext(createResourceRoutes)).toEqual([]);
  });

  it('uses the consumer empty page', async () => {
    const harness = await RouterTestingHarness.create(prefix || '/');

    expect(getPage(harness, EmptyPage)).toBeTruthy();
    expect(TestBed.inject(Router).url).toBe(prefix || '/');
    expect(harness.routeNativeElement?.textContent).toContain('No configured resources');
  });

  it('preserves consumer sibling routes', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/home`);

    expect(getPage(harness, HomePage)).toBeTruthy();
  });

  it('uses the consumer not-found page', async () => {
    const harness = await RouterTestingHarness.create(`${prefix}/missing`);

    expect(getPage(harness, NotFoundPage)).toBeTruthy();
    expect(TestBed.inject(Router).url).toBe(`${prefix}/missing`);
  });
});

describe('resource registration', () => {
  const providerOrders: { order: ('router' | 'users' | 'products')[] }[] = [
    { order: ['router', 'users', 'products'] },
    { order: ['users', 'router', 'products'] },
    { order: ['users', 'products', 'router'] },
  ];

  it.each(providerOrders)('collects resources with provider order $order', async ({ order }) => {
    const registrations = {
      router: provideRouter(
        [
          { path: '', loadChildren: () => createResourceRoutes() },
          { path: 'home', component: HomePage },
        ],
        withComponentInputBinding(),
      ),
      users: provideResource(users),
      products: provideResource(products),
    };
    TestBed.configureTestingModule({ providers: order.map((key) => registrations[key]) });

    const harness = await RouterTestingHarness.create('/products/42/edit');

    expect(TestBed.inject(ADMIN_RESOURCES)).toEqual([users, products]);
    expect(getPage(harness, ResourceFormPage).resource()).toBe(products);
    await harness.navigateByUrl('/users/create');
    expect(getPage(harness, ResourceFormPage).resource()).toBe(users);
    await harness.navigateByUrl('/home', HomePage);
    expect(harness.routeNativeElement?.textContent).toBe('Home');
  });

  it('preserves registration order when generating resource routes', () => {
    TestBed.configureTestingModule({
      providers: [provideResource(products), provideResource(users)],
    });

    const resourceRoutes = TestBed.runInInjectionContext(createResourceRoutes);

    expect(TestBed.inject(ADMIN_RESOURCES)).toEqual([products, users]);
    expect(resourceRoutes.map((route) => route.path)).toEqual(['products', 'users']);
  });

  it('does not install routes when registering resources alone', () => {
    const routes: Routes = [{ path: 'home', component: HomePage }];
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideResource(users)],
    });

    expect(TestBed.inject(Router).config).toEqual(routes);
  });

  it('rejects duplicate resource IDs during route construction', () => {
    TestBed.configureTestingModule({
      providers: [provideResource(users), provideResource({ ...products, id: users.id })],
    });

    expect(() => TestBed.runInInjectionContext(createResourceRoutes)).toThrow(
      'Duplicate admin resource id "user-records".',
    );
  });

  it('rejects duplicate resource slugs during route construction', () => {
    TestBed.configureTestingModule({
      providers: [provideResource(users), provideResource({ ...products, route: users.route })],
    });

    expect(() => TestBed.runInInjectionContext(createResourceRoutes)).toThrow(
      'Duplicate admin resource route "users".',
    );
  });

  it.each([
    '',
    ' ',
    ' users',
    'users ',
    '/users',
    'users/',
    'team/users',
    ':recordId',
    '**',
    'users*',
    'users?active=true',
    'users#details',
    'users;active=true',
    '(users)',
    'users\\archive',
    'users%2Farchive',
    '.',
    '..',
  ])('rejects invalid slug "%s" during route construction', (route) => {
    TestBed.configureTestingModule({ providers: [provideResource({ ...users, route })] });

    expect(() => TestBed.runInInjectionContext(createResourceRoutes)).toThrow(
      `Invalid route slug "${route}"`,
    );
  });

  it('supports literal slugs with numbers, hyphens, and underscores', async () => {
    const resource = { ...users, route: 'Team-members_2' };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: '', loadChildren: () => createResourceRoutes() }],
          withComponentInputBinding(),
        ),
        provideResource(resource),
      ],
    });

    const harness = await RouterTestingHarness.create('/Team-members_2/42/edit');

    expect(getPage(harness, ResourceFormPage).resource()).toBe(resource);
    expect(harness.routeNativeElement?.querySelector('p a')?.getAttribute('href')).toBe(
      '/Team-members_2',
    );
  });
});
