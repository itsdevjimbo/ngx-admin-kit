// THROWAWAY: three responsive shell layouts on /users?variant=A|B|C.
// Variant A and its interactions are confirmed; this is not the public library API.
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  Component,
  Directive,
  ElementRef,
  computed,
  contentChild,
  inject,
  input,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface PrototypeItem {
  id: string;
  name: string;
  icon?: string;
  svgIcon?: string;
  route?: string;
  external?: string;
  exact?: boolean;
  children?: readonly PrototypeItem[];
}

@Directive({ selector: '[ngxAdminShellNavigation]' })
export class PrototypeNavigationSlot {}

@Component({
  selector: 'app-admin-shell-prototype',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-shell.prototype.html',
  styleUrl: './admin-shell.prototype.css',
  host: {
    '[class.variant-a]': 'variant() === "A"',
    '[class.variant-b]': 'variant() === "B"',
    '[class.variant-c]': 'variant() === "C"',
    '[class.mobile]': 'isMobile()',
    '[class.collapsed]': 'navigationCollapsed()',
    '(window:keydown)': 'onKey($event)',
  },
})
export class AdminShellPrototype {
  readonly items = input<readonly PrototypeItem[]>([]);
  readonly contentMode = input<'route' | 'long' | 'empty'>('route');
  readonly customSlot = contentChild(PrototypeNavigationSlot);
  readonly hasNavigation = computed(() => !!this.customSlot() || this.prunedItems().length > 0);
  readonly prunedItems = computed(() => this.prune(this.items()));
  readonly desktopCollapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly isMobile = signal(false);
  // Effective context for consumer-owned navigation: desktop state never hides mobile labels.
  readonly navigationCollapsed = computed(() => !this.isMobile() && this.desktopCollapsed());
  readonly navigationPresentation = computed(() =>
    this.isMobile() ? 'mobile' : this.desktopCollapsed() ? 'desktop-collapsed' : 'desktop-expanded',
  );
  readonly variant = signal(this.readVariant());
  readonly variantNames = { A: 'Classic sidebar', B: 'Global top bar', C: 'Workspace' };
  readonly expandedGroups = signal<ReadonlySet<string>>(new Set(['manage']));
  readonly pageRoute = signal('');
  readonly event = signal('Ready. Try collapse, resize, groups, and navigation.');
  readonly devMode = isDevMode();
  private readonly router = inject(Router);
  private readonly menuButton = viewChild('menuButton', {
    read: ElementRef<HTMLButtonElement>,
  });
  private pendingFocus: 'page' | 'menu' | undefined;

  constructor() {
    inject(MatIconRegistry).addSvgIconLiteral(
      'prototype-grid',
      inject(DomSanitizer).bypassSecurityTrustHtml(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>',
      ),
    );
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        const wasMobile = this.isMobile();
        const focusInNav = document.activeElement?.closest('[data-prototype-nav]');
        this.isMobile.set(matches);
        if (matches !== wasMobile) {
          this.mobileOpen.set(false);
          this.event.set(
            `${matches ? 'Mobile' : 'Desktop'} presentation; drawer closed, desktop preference preserved.`,
          );
          if (focusInNav) requestAnimationFrame(() => this.focusMenu());
        }
      });
    this.updateRoute(this.router.url);
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.variant.set(this.readVariant());
        const path = event.urlAfterRedirects.split('?')[0];
        if (path !== this.pageRoute()) {
          this.updateRoute(path);
          if (!this.customSlot() && this.isMobile() && this.mobileOpen())
            this.closeMobile('navigation');
        }
      }
    });
  }

  prune(items: readonly PrototypeItem[]): readonly PrototypeItem[] {
    return items.flatMap((item) => {
      if (!item.children) return [item];
      const children = this.prune(item.children);
      return children.length ? [{ ...item, children }] : [];
    });
  }

  private readVariant(): 'A' | 'B' | 'C' {
    const variant = new URLSearchParams(location.search).get('variant');
    return variant === 'B' || variant === 'C' ? variant : 'A';
  }

  private updateRoute(url: string): void {
    this.pageRoute.set(url.split('?')[0]);
    const groups = new Set(this.expandedGroups());
    const visit = (items: readonly PrototypeItem[]): boolean =>
      items.reduce((found, item) => {
        const active = item.children ? visit(item.children) : this.active(item);
        if (item.children && active) groups.add(item.id);
        return found || active;
      }, false);
    visit(this.items());
    this.expandedGroups.set(groups);
  }

  active(item: PrototypeItem): boolean {
    const path = this.pageRoute();
    return (
      !!item.route &&
      (item.exact ? path === item.route : path === item.route || path.startsWith(`${item.route}/`))
    );
  }

  groupActive(item: PrototypeItem): boolean {
    return !!item.children?.some((child) =>
      child.children ? this.groupActive(child) : this.active(child),
    );
  }

  toggleGroup(item: PrototypeItem): void {
    if (this.navigationCollapsed()) {
      this.desktopCollapsed.set(false);
      this.event.set('Selecting a collapsed group expands the sidebar and its group.');
      this.expandedGroups.update((groups) => new Set([...groups, item.id]));
      return;
    }
    this.expandedGroups.update((groups) => {
      const next = new Set(groups);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      return next;
    });
    this.event.set(
      `${item.name} ${this.expandedGroups().has(item.id) ? 'expanded' : 'collapsed'}; drawer state preserved.`,
    );
  }

  toggleDesktop(): void {
    this.desktopCollapsed.update((value) => !value);
    this.event.set(`Desktop sidebar ${this.desktopCollapsed() ? 'collapsed' : 'expanded'}.`);
  }

  toggleMobile(): void {
    if (this.mobileOpen()) this.closeMobile('dismiss');
    else {
      this.mobileOpen.set(true);
      this.event.set('Mobile drawer opened. Focus enters Close navigation; Tab stays inside.');
    }
  }

  closeMobile(reason: 'navigation' | 'dismiss' = 'dismiss'): void {
    this.pendingFocus = reason === 'navigation' ? 'page' : 'menu';
    this.mobileOpen.set(false);
    this.event.set(
      reason === 'navigation'
        ? 'Successful navigation closes the drawer and focuses page content.'
        : 'Drawer dismissed; focus returns to the menu button.',
    );
  }

  onDrawerChanged(open: boolean): void {
    if (this.isMobile() && !open && this.mobileOpen()) this.closeMobile('dismiss');
  }

  afterDrawerClosed(): void {
    const focus = this.pendingFocus;
    this.pendingFocus = undefined;
    requestAnimationFrame(() => {
      if (focus === 'page') document.querySelector<HTMLElement>('[data-prototype-page]')?.focus();
      if (focus === 'menu') this.focusMenu();
    });
  }

  private focusMenu(): void {
    this.menuButton()?.nativeElement.focus();
  }

  cycleVariant(direction: number): void {
    const variants: readonly ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const variant =
      variants[(variants.indexOf(this.variant()) + direction + variants.length) % variants.length];
    void this.router.navigate([], {
      queryParams: { variant },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onKey(event: KeyboardEvent): void {
    if (!this.devMode || event.altKey || event.ctrlKey || event.metaKey || this.mobileOpen())
      return;
    const element = event.target;
    if (
      element instanceof HTMLElement &&
      element.closest('input, textarea, select, button, a, [contenteditable]')
    )
      return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.cycleVariant(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
}
