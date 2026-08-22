<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules

Read `README.md` first for what this project is and how it is wired.

## Trust the live database over this repo

`sql/schema.sql` has drifted from the real database more than once. Before
writing a migration or a query, introspect `information_schema.columns` and
`pg_indexes` and work from what is actually there. The introspection queries are
at the bottom of the schema file and in the README.

In particular: `create table if not exists` will not add a column to a table that
already exists, and `create index if not exists` matches on index name rather
than definition, so a renamed index becomes a duplicate index.

## Deliberate decisions that look like bugs

Do not "fix" these without asking:

- Row level security is enabled with no policies on every table. All access is
  through the service role key in server code. The anon key must never be used
  to reach these tables.
- `creators.dashboard_password` is plaintext. That is a conscious choice for the
  current single-client testing phase.

## Conventions

- ASCII only in source files. Use HTML entities for arrows, bullets, dashes and
  similar (`&rarr;`, `&mdash;`, `&#8942;`). Non-ASCII characters have been
  corrupted by this project's tooling before and shipped as mojibake.
- Do not build URLs by interpolating into a template literal that is itself
  wrapped in braces. Assemble them from named constants with `+`.
- Analytics reads geo from the `x-vercel-ip-country`, `x-vercel-ip-country-region`
  and `x-vercel-ip-city` request headers, so it only produces real values in a
  deployed environment.
- Link rotation uses the `next_rotation_index` Postgres function for an even,
  race-free split, falling back to random selection if the function is missing.
  Do not replace it with `Math.random`; random distribution skews badly at low
  click volume.
- Conventional commit messages.
