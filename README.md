# Harbor Angebotsdesk

A real two-service quotation workflow with npm workspaces. JavaScript serves a
German browser UI with demo cookie login, editable line items, server quotes and
CSV export. A private TypeScript HTTP service validates inputs and computes a
deterministic quote. Both services import the local `@harbor/quote-core` package
through its package exports; it is not published to npm. All prices/data are
synthetic. No order, payment, external service or persisted state is involved.

From the repository root, run `npm ci`. In one terminal run `npm run quote`;
in another run `QUOTE_URL=http://127.0.0.1:8271 npm run desk`.
Open http://127.0.0.1:3270. Node22.22.1 supports the TypeScript strip-types entry.
The lockfile and workspaces belong to the root; individual package directories
are not independent npm projects for dependency installation.

Release1 gives5% discount for10 or more units, release2 gives10%. Values use
integer cents, explicit rounding,490c shipping and a fixed synthetic19% rate.
Duplicate SKUs, noninteger quantities, unknown products and malformedJSON are
rejected. Login is a deliberately public demo cookie, not real authentication.

Dev: use lily.toml for two HTTP ports and desk→quote edge. Keep both apps hidden
until their builds finish. Set the desk's QUOTE_URL to the actual private app URL
returned by lly, redeploy desk, then expose only desk. Do not expose quote.
Acceptance includes shared-package-only commit changes, both app redeploys,
backend restart, private hostname404, resources/logs and normal project delete.
