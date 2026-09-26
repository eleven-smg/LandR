<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules

Read `README.md` first for what this project is and how it is wired.

## Start in `memory/` - this project has persistent memory

`memory/` is the project's engineering memory and it is chat-independent. Read it
before doing anything, in this order:

1. `memory/README.md` - how the memory works and the maintenance protocol.
2. `memory/PROGRESS.md` - the benchmark. The 24 planned steps plus all added
   scope, each with a status and the proof behind it. This is the single source
   of truth for what is done. Do not invent or follow any other roadmap.
3. `memory/BUGS.md` - open defects, plus a list of previously reported bugs that
   turned out to be false. Never repeat those claims.
4. `memory/DECISIONS.md` - decisions the client already made. Do not re-ask them.
5. `memory/STATE.md` - repo head, hosting, database, real row counts, migrations.
6. `memory/SESSION-LOG.md` - what each past session actually shipped, with SHAs.

After every task, update those files in the same session. The protocol is in
`memory/README.md`. Work that is shipped but not recorded is work that will be
redone or forgotten.

The plan of record lives with the client as `project landr.zip` (24 step
documents, 24 matching test checklists, the guide, the playbook and the
handoff). `memory/PROGRESS.md` mirrors it. Note that the memory files are
UTF-8 markdown documentation and are exempt from the ASCII rule below, which
applies to source files.

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
- Passwords are plaintext. Logins now live in the `accounts` table
  (`accounts.password`), not the older `creators.dashboard_password`. Plaintext
  is a conscious client decision from the single-client testing phase; see
  `memory/DECISIONS.md` and bug B3 in `memory/BUGS.md` before changing it.

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
