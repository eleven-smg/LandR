# LandR

A link-in-bio builder for creators. Each creator gets a public page at `/<handle>`
with themed styling, tap-through links, social icons, media embeds and email
capture, plus a private dashboard with real traffic analytics.

Built for one client first, but the data model is multi-tenant throughout, so it
can grow into a hosted product without a rewrite.

## Stack

- Next.js 16.2.10, App Router, Server Actions
- React 19.2.4
- Tailwind CSS 4
- Supabase for Postgres and Storage
- recharts for dashboard charts, react-tweet for X embeds, ua-parser-js for device detection

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page. Still placeholder. |
| `/[handle]` | Public creator page. |
| `/go/[id]` | Click tracker and redirect. Applies country rules, then rotation, then the first live destination. |
| `/dashboard/[handle]` | Analytics for one creator. |
| `/dashboard/[handle]/edit` | Page editor. |

## Environment variables

Set these in Vercel and in a local `.env.local`. `.env*` is gitignored; never
commit real values.

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS. Must never reach the browser. |
| `DASHBOARD_USER` | Basic-auth user for `/dashboard`, enforced in `middleware.ts`. |
| `DASHBOARD_PASSWORD` | Basic-auth password for `/dashboard`. |

## Database

The schema lives in `sql/schema.sql`. Paste it into the Supabase SQL editor and
run it. It is written to be safely re-runnable.

Three things about it are worth knowing before you edit it:

**`create table if not exists` does not add columns.** If a table already exists,
that statement is a silent no-op, so every later column has its own
`alter table ... add column if not exists`. This project has already been bitten
by this: the tables existed while fourteen newer columns did not, so the public
page's `select` failed with Postgres error `42703` and the code reported the
creator as missing. The page rendered "This page does not exist." while the
creator and all their links were sitting in the database.

**Index names must match the live database.** `create index if not exists`
matches on the index *name*, not its definition, so renaming an existing index in
this file creates a second, redundant index over identical columns and doubles
the write cost. Check `pg_indexes` before adding one.

**A database change is invisible until a rebuild.** Route output is cached at
build time, so fixing the schema does nothing to the live site until a new
deployment runs.

### Access model

Every read and write goes through the service role key from server code, so row
level security is enabled with no policies, deliberately. The anon key is never
used to reach these tables. Supabase's advisor reports `rls_enabled_no_policy`
as INFO for each table; that is the intended state, not an outstanding issue.

### Dashboard passwords

`creators.dashboard_password` stores plaintext on purpose while the product is in
testing with a single client and at most a handful of users. Hash it before there
is any public signup.

### Introspection

To see the real current shape of the database rather than what this file claims:

```sql
select table_name,
       string_agg(column_name || ' ' || data_type, ', ' order by ordinal_position) as columns
from information_schema.columns
where table_schema = 'public'
group by table_name
order by table_name;

select tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename;
```

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploying

Push to `main`. If the Vercel project is Git-connected that deploys by itself;
otherwise trigger a redeploy from the Vercel dashboard. Remember that schema
changes need a rebuild to show up.

## Known gaps

- `app/page.tsx` is still unmodified create-next-app output.
- There is no avatar upload anywhere in the editor, so `creators.photo_url` can
  only be set directly in the database.
- `links.starts_at` and `links.ends_at` exist but neither the public page nor
  `/go/[id]` filters on them yet, so scheduling is stored and ignored.
- There is no signup or per-creator login. `/dashboard` is behind one shared
  basic-auth credential, and `creators.dashboard_password` is not wired up yet.
- `app/test/page.tsx` is dead and should be deleted.
