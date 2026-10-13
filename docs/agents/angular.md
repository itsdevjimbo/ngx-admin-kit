# Angular coding guidance

Adapted from [Angular's official AI instructions](https://angular.dev/ai/develop-with-ai),
with Angular 22 API and guide references below. Reviewed 2026-10-13.

## Scope

Apply this guidance to the library and demo application when writing, modifying,
or reviewing Angular code. Adopt it within the requested change; existing patterns
alone do not justify a migration. Preserve public API compatibility and existing
compiler settings unless the task explicitly calls for changing them.

## TypeScript

- Write strictly typed code; infer obvious types and narrow `unknown` values
  instead of using `any`.
- Treat strict checking as a coding practice, not permission to change tsconfig.

## Components and Angular 22 defaults

The [Component API](https://angular.dev/api/core/Component) documents these defaults:

- Create standalone components; omit the redundant `standalone: true` metadata.
- Rely on implicit OnPush change detection in Angular 22; omit redundant
  `changeDetection: ChangeDetectionStrategy.OnPush` metadata in new components.
  Preserve existing explicit strategies unless changing behavior is in scope.
- Keep components focused. Inline short templates; resolve external template and
  style paths relative to the component file.
- Declare new inputs with `input()` and events with `output()`. Use `model()` for
  two-way bindings.
- Put host bindings and listeners in decorator `host` metadata.
- Import individual template dependencies instead of `CommonModule`.

## Signals

Follow the [signals guide](https://angular.dev/guide/signals):

- Represent local state with signals and derive values with `computed()`.
- Replace values through `set()` or derive replacements through `update()`;
  avoid deep mutations that bypass notifications. Keep transformations pure.
- Use `linkedSignal()` when derived state also needs to be writable and reset
  as its sources change.

## Templates

- Use built-in [control flow](https://angular.dev/guide/templates/control-flow):
  `@if`, `@for`, and `@switch`. Track repeated items by stable identity;
  reserve index tracking for collections that remain static.
- Keep expressions simple. Expose values from the component rather than assuming
  JavaScript globals or constructors are available in templates.
- Consume template observables with `AsyncPipe`; bind classes and styles directly.
- Apply `NgOptimizedImage` to static images, excluding inline base64 sources.

## Dependency injection

- Keep each service focused and prefer `inject()` for dependencies.
- For new singleton services, prefer Angular 22's
  [`@Service()`](https://angular.dev/api/core/Service), which automatically makes
  the service available to dependency injection. Existing
  `@Injectable({ providedIn: 'root' })` services need no migration.
- Preserve deliberate component or route provider scopes when editing services.

## Forms and routing

- Prefer [Signal Forms](https://angular.dev/guide/forms/signals/overview) from
  `@angular/forms/signals` for new forms; they are stable in Angular 22.
  Existing reactive forms remain appropriate. When Signal Forms are unsuitable,
  prefer typed reactive forms over template-driven forms.
- Lazy-load feature routes. Keep routing changes within the requested feature.

## Accessibility

Target WCAG AA and passing axe checks for affected UI. Follow Angular's
[accessibility guide](https://angular.dev/best-practices/a11y):

- Prefer semantic HTML controls with accessible names and keyboard interaction.
- Manage focus through navigation and dialogs, including restoring focus on close.
- Provide sufficient contrast and meaningful ARIA attributes where native
  semantics are insufficient.
- Verify keyboard and focus behavior alongside automated accessibility checks;
  automated results alone do not establish WCAG conformance.
