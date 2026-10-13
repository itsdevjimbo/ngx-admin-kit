import { Component, inject, isDevMode, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import {
  AdminShellPrototype,
  PrototypeItem,
  PrototypeNavigationSlot,
} from './admin-shell.prototype';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [RouterOutlet, AdminShellPrototype, PrototypeNavigationSlot, MatIconModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styles: `
    .review-panel {
      position: fixed;
      z-index: 5;
      left: 12px;
      bottom: 90px;
      max-width: min(360px, calc(100vw - 24px));
      color: var(--mat-sys-on-surface);
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      box-shadow: 0 4px 16px #0002;
    }
    .review-panel summary {
      cursor: pointer;
      padding: 12px 16px;
      font-weight: 600;
    }
    .review-panel .panel-body {
      max-height: 65dvh;
      overflow: auto;
      padding: 0 16px 16px;
    }
    .review-panel label {
      display: grid;
      gap: 4px;
      margin-bottom: 12px;
    }
    .review-panel select {
      padding: 8px;
      color: inherit;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline);
      border-radius: 4px;
    }
    .review-panel dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
      font-size: 12px;
    }
    .review-panel dd {
      margin: 0;
    }
    .review-panel p,
    .review-panel li {
      font-size: 12px;
    }
    .custom-nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
    }
    .custom-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      color: var(--mat-sys-primary);
      text-decoration: none;
    }
    .custom-nav a:hover {
      background: var(--mat-sys-surface-container-highest);
    }
    .custom-nav .custom-heading {
      color: var(--mat-sys-on-surface-variant);
      padding: 12px;
      font-size: 12px;
    }
  `,
})
export class App {
  readonly prototypeEnabled = isDevMode() && new URLSearchParams(location.search).has('variant');
  readonly navigationMode = signal('schema');
  readonly contentMode = signal<'route' | 'long' | 'empty'>('route');
  readonly navigation: readonly PrototypeItem[] = [
    {
      id: 'overview',
      name: 'Overview',
      svgIcon: 'prototype-grid',
      route: '/shell-prototype/overview',
      exact: true,
    },
    {
      id: 'manage',
      name: 'Manage',
      icon: 'folder_open',
      children: [
        { id: 'users', name: 'Users', icon: 'group', route: '/users' },
        {
          id: 'tools',
          name: 'Workspace tools',
          children: [
            {
              id: 'invite',
              name: 'Invite a user',
              icon: 'person_add',
              route: '/users/create',
              exact: true,
            },
            {
              id: 'long',
              name: 'A deliberately long navigation label to review wrapping and narrow layouts',
              route: '/shell-prototype/preferences',
              exact: true,
            },
          ],
        },
        { id: 'empty-group', name: 'Empty group (must not render)', children: [] },
      ],
    },
    { id: 'billing', name: 'Billing', route: '/shell-prototype/billing', exact: true },
    {
      id: 'docs',
      name: 'Angular documentation',
      icon: 'open_in_new',
      external: 'https://angular.dev',
    },
  ];
  private readonly router = inject(Router);
  setContent(value: string): void {
    if (value === 'route' || value === 'long' || value === 'empty') this.contentMode.set(value);
  }
  async onCustomNavigation(
    shell: AdminShellPrototype,
    event: MouseEvent,
    destination: string,
  ): Promise<void> {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    const url = this.router.createUrlTree([destination], {
      queryParams: { variant: shell.variant() },
    });
    if (await this.router.navigateByUrl(url)) {
      if (shell.isMobile() && shell.mobileOpen()) shell.closeMobile('navigation');
    }
  }
}
