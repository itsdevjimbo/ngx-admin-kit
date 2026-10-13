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
  mock-api/                  In-memory HTTP backend and Node tests
  proxy.conf.json            Development proxy for /api/**
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

## Run the demo mock API

Use two terminals from the workspace root. In the first, start the local backend:

```bash
npm run mock-api
```

In the second, start the example as usual:

```bash
npm start
```

The backend listens at `http://127.0.0.1:3000/api/users`. Angular's development server forwards
`/api/**` to it without changing the request path, so requests to
`http://localhost:4200/api/users` reach the same backend. The proxy follows
[Angular's development server configuration](https://angular.dev/tools/cli/serve).

Each backend startup seeds three fictional users with string IDs `1`, `2`, and `3`. All changes
stay in memory and reset when you restart the backend. Press Ctrl+C to stop it.

| Endpoint                | Result                                             |
| ----------------------- | -------------------------------------------------- |
| `GET /api/users`        | Users array (200)                                  |
| `GET /api/users/:id`    | One user (200)                                     |
| `POST /api/users`       | Created user with a generated string ID (201)      |
| `PUT /api/users/:id`    | User with replaced name and email (200)            |
| `PATCH /api/users/:id`  | User with supplied name/email fields updated (200) |
| `DELETE /api/users/:id` | Empty response (204)                               |

Create and replace requests require nonempty string `name` and `email` fields. Partial updates
validate only the supplied fields; an empty object leaves the user unchanged. IDs are server-owned:
supplying `id` returns 400. Other fields are ignored. Errors are JSON objects of the form
`{ "message": "..." }`: 400 for malformed JSON or invalid fields, 404 for missing users or unknown
paths, and 405 for unsupported methods on recognized endpoints.

Try these requests through the development proxy (use the returned ID for a newly created user):

```bash
curl http://localhost:4200/api/users
curl http://localhost:4200/api/users/1
curl -X POST http://localhost:4200/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Casey Taylor","email":"casey.taylor@example.com"}'
curl -X PUT http://localhost:4200/api/users/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Avery Quinn","email":"avery.quinn@example.com"}'
curl -X PATCH http://localhost:4200/api/users/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Avery Parker"}'
curl -i -X DELETE http://localhost:4200/api/users/1
```

The mock API is demo-only and is excluded from the published library. Resource pages still render
their existing routing examples; connecting the pages to HTTP and adding CRUD UI remain future work.

## Verify

```bash
npm run test:mock-api
npm test -- --watch=false
npm run test:demo -- --watch=false
npm run build:demo
```

`npm run test:mock-api` uses Node's built-in test runner with isolated servers on automatically
allocated ports and requires no running backend. `npm test` runs the library's tests.
The demo test and build scripts first rebuild the library so the
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
