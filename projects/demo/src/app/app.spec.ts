import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { appConfig } from './app.config';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Users page through the root router outlet without a generated layout', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(TestBed.inject(Router).url).toBe('/users');
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('h2')?.textContent).toBe('Users');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/users/create');
    expect(compiled.querySelector('nav')).toBeNull();
    expect(compiled.querySelector('aside')).toBeNull();
  });

  it('should lazy-load the packaged edit page and update its record ID', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/users/record-42/edit');
    await fixture.whenStable();
    const compiled: HTMLElement = fixture.nativeElement;

    expect(compiled.querySelector('h2')?.textContent).toBe('Edit Users');
    expect(compiled.textContent).toContain('Record ID: record-42');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/users/create');
    expect(compiled.querySelector('p a')?.getAttribute('href')).toBe('/users');

    await router.navigateByUrl('/users/record-99/edit');
    await fixture.whenStable();

    expect(compiled.textContent).toContain('Record ID: record-99');
    expect(compiled.textContent).not.toContain('Record ID: record-42');
  });
});
