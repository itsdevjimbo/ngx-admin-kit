# Ngx Admin Kit

This Angular workspace contains the `ngx-admin-kit` library and an example application that consumes
its built package.

The library is an early release: resource registration and list/create/edit routing work; backend
CRUD and form rendering are future work. It currently targets Angular `^22.2.0`.

```text
projects/ngx-admin-kit/
  package.json               Published package metadata and peer dependencies
  ng-package.json            Package build configuration
  README.md                  Consumer documentation
  LICENSE                    MIT license included in the package
  src/public-api.ts          Public exports
  src/lib/
    provider.ts              Resource registry and route factory
    provider.spec.ts         Routing and registration tests
    interfaces/              Resource and field contracts
    pages/                   Generated resource pages
projects/demo/
  src/app/                   Example application importing ngx-admin-kit
    resources/               Consumer resource definitions
  src/material-theme.scss    Example application's Material theme
  public/                    Example application's static assets
dist/ngx-admin-kit/          Generated package output
```

See [the library README](projects/ngx-admin-kit/README.md) for root and nested-layout examples.

## Build the library

Install workspace dependencies after cloning:

```bash
npm ci
```

```bash
npm run build
```

This produces the distributable package in `dist/ngx-admin-kit` using Angular partial compilation.
The example imports `ngx-admin-kit` through the workspace path mapping to this built output.

## Run the example

Start the example:

```bash
npm start
```

The `prestart` script builds the library before starting the demo. Open `http://localhost:4200/`.
The example explicitly redirects `/` to `/users`.

For library changes, run `npm run watch` in a separate terminal to rebuild the package as you edit.

## Verify

```bash
npm test -- --watch=false
npm run test:demo -- --watch=false
npm run build:demo
```

`npm test` runs the library's tests. The demo test and build scripts first rebuild the library so the
example uses the latest packaged code. Package metadata belongs in
`projects/ngx-admin-kit/package.json`; the root package is a private development workspace.

## Inspect the release package

Build and preview the files npm would include:

```bash
npm run build
npm pack ./dist/ngx-admin-kit --dry-run
```

The package should contain its manifest, consumer README, MIT license, type declarations, and all
generated JavaScript bundles, including the lazy resource pages. To create a local tarball for
testing in another application:

```bash
npm pack ./dist/ngx-admin-kit
```

Install that tarball from another Angular application using its full path:

```bash
npm install /absolute/path/to/ngx-admin-kit-0.0.1.tgz
```

Release metadata is maintained in `projects/ngx-admin-kit/package.json`. The library's `LICENSE`
is copied into the build automatically; keep it identical to the repository's root `LICENSE`.

## License

[MIT](LICENSE).
