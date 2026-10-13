# Tailwind styling guidance

Locally adapted from the official Tailwind CSS documentation linked below,
checked against installed Tailwind 4.3.3. Reviewed 2026-10-13.

## Scope

Apply this guidance within the requested styling change; existing patterns alone
do not justify a migration. The demo uses Tailwind, while the published
`ngx-admin-kit` package has no Tailwind consumer requirement. Preserve that
contract: library rendering must not require consumers to install Tailwind,
scan library sources, or import the demo stylesheet. Keep library styles
self-contained unless changing the consumer contract is explicitly in scope.

## CSS-first configuration

- Use the existing `@tailwindcss/postcss` integration and the demo's
  `projects/demo/src/styles.css` entry point with `@import 'tailwindcss'`.
- Configure v4 through CSS directives. Add shared tokens with `@theme` and source
  paths with `@source`; do not introduce a legacy JavaScript configuration or
  v3 `@tailwind` directives for new configuration.
- Check installed and locked versions before using features from newer docs.

## Class detection and Angular bindings

Follow Tailwind's [class detection guide](https://tailwindcss.com/docs/detecting-classes-in-source-files):

- Write complete class names in templates or static TypeScript mappings. Tailwind
  scans text, so concatenating fragments or interpolating utility names cannot
  reliably generate CSS.
- Use direct Angular class bindings with complete alternatives, for example
  (`compact` is a boolean component property):

  ```html
  <div [class]="compact ? 'p-2 gap-2' : 'p-6 gap-4'" class="flex">Content</div>
  ```

- When needed sources fall outside automatic detection, register them with
  `@source` in the Tailwind entry stylesheet, using paths relative to that
  stylesheet. Dependencies in `node_modules` and ignored files are not scanned
  automatically. Register only the sources the application needs; this does not
  authorize adding a source-scanning requirement for library consumers.

## Utilities and tokens

- Prefer utilities in Tailwind-enabled templates for layout, spacing, typography,
  and states. Use custom CSS when utilities would obscure the styling intent.
- Define shared design tokens that should generate utilities in a top-level
  `@theme` block; follow the [theme variables guide](https://tailwindcss.com/docs/theme).
  Use ordinary CSS custom properties for values that need no generated utility.
- Bind runtime values through Angular style bindings to CSS custom properties,
  and reference them from a fixed utility such as `w-[var(--panel-width)]`.
  Supply a valid CSS value, including units where needed, instead of constructing
  a utility name at runtime.

## Separately processed stylesheets

Follow the [directives reference](https://tailwindcss.com/docs/functions-and-directives):

- Reserve `@apply` for custom selectors that benefit from existing utilities,
  such as third-party style overrides; prefer template utilities for ordinary UI.
- In a separately processed component stylesheet using `@apply` or `@variant`,
  use `@reference` with the relative path to the application Tailwind stylesheet
  to expose its theme, utilities, and variants without emitting them again.
  `@reference 'tailwindcss'` is sufficient only when using the default theme
  without application customizations.
- Confirm that the stylesheet is processed by Tailwind before adding these
  directives. The demo's PostCSS setup does not establish support in the library
  packaging pipeline. Use ordinary CSS where that processing is unavailable.

## Responsive styles and interaction

- Start with unprefixed styles for small screens and layer breakpoint variants
  such as `md:` for wider layouts. Check affected layouts at narrow and wide sizes.
- Provide visible hover, keyboard focus (`focus-visible:`), active, and disabled
  states where applicable. Preserve a visible focus indicator and respect reduced
  motion preferences when adding animation.
- Follow [Angular accessibility guidance](angular.md#accessibility) for shared
  semantics, contrast, keyboard behavior, and verification requirements.
