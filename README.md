# ReLoom

A mobile-first, interactive clothing exchange **prototype**, built with React and Sites. The original visual design and showroom are preserved; HTML templates and browser-side prototype compilation have been removed.

## Development

Use the existing pnpm lockfile and Node 22.13 or newer.

- `pnpm install` — install dependencies under your organization's security policy.
- `pnpm dev` — run the local site.
- `pnpm test` — test rendering and the principal application flows without a browser.
- `pnpm lint` — check source quality.
- `pnpm build` — create the production build.

## Structure

- `app/` owns routing, metadata, and the application entry point.
- `features/reloom/components/` contains the individual screens and overlays.
- `features/reloom/ReLoomApp.jsx` owns React state, persistence synchronization and lifecycle.
- `features/reloom/view-model.js` derives screen properties and connects actions to state.
- `features/reloom/domain.js` resolves catalogue and donated garment identities.
- `features/reloom/records.js` projects stored participation and garment records into screen state.
- `app/api/reloom/route.ts` validates writes and scopes personal records to an HttpOnly visitor cookie; `db/` and `drizzle/` own D1 access and migrations.
- `features/reloom/data.js` contains clearly separated demonstration records.
- `features/reloom/reloom.css` contains shared design tokens, deduplicated component styles and mobile layout rules. Inline styles are reserved for values that change with state.
- `tests/` covers server-rendered screens, filtering, voting, saved items, cart, donations, threads and animation lifecycle.

## Collaboration

Keep changes small and work on separate branches. Run tests, lint and build before merging. Keep the existing `.openai/hosting.json` project ID: creating another Site is not necessary. Publish through Sites with an authorized editor; never commit source-write credentials or environment secrets.

## Prototype limitations

Donations, participation (votes and personal comments), points and NFC designs are persisted in Sites D1. Each mutation writes an individual record; votes, posts and donations are idempotent. Server-side checks restrict new NFC bindings to participated stories. Browser tabs refresh shared state without replacing an unsaved design. A random HttpOnly visitor cookie identifies this prototype's visitor; it is not an account or cross-device login. Clearing cookies or switching browser profiles loses access to that visitor's private records. Favourites and cart remain temporary React state.

Old browser-only NFC designs are retained. Eligible designs migrate to D1 without overwriting newer server designs. Legacy designs with missing participation history remain visible locally until the visitor participates and saves them; migration never manufactures votes or comments.

Donation stories have public, unguessable links, while personal designs and participation records remain visitor-scoped. Shared story responses omit owner identifiers. Comments are personal threads, not shared message delivery. There is no payment, real reservation, upload service or physical NFC programming. Donation photos and impact statistics remain illustrative. The old decorative QR was removed in favour of a working story link.

The refactor does not claim real-device browser verification. Automated rendering/logic checks are separate from visual, touch and accessibility testing on physical phones.

## Local storage validation

Generate schema migrations with `pnpm exec drizzle-kit generate`. After a build, apply each pending SQL file once to the local D1 database using `node node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file <migration.sql>`. Publishing applies production migrations separately. Keep applied migrations immutable.

With `pnpm dev` running, execute `RELOOM_TEST_URL=http://localhost:3000 node --test tests/storage.integration.mjs` (substitute the printed local port). These tests create isolated local visitors and cover concurrent saves, reloads, ownership, participation checks, public story links and CSRF rejection. They refuse non-local URLs.
