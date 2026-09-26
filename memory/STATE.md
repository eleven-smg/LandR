# LandR — infrastructure state

**Verified 2026-09-26** unless stated otherwise.

## Repo

- `eleven-smg/LandR` (private). Previously moved to the `eleven-smgg` **org** by accident, which
  broke Vercel (Hobby cannot connect private org repos); transferred back, Vercel↔Git reconnected.
- `main` @ **`89ef7060`** (memory commit). Last application code commit: **`7ae2484e`** — the fix for
  the stray brace shipped in `00a43883`. The 25 Aug head was `bb021b79`; the 26 Sep session added
  ~20 commits on top of it (see `SESSION-LOG.md`).
- `restore/editor-embeds-and-schema` @ `549239c7` — stale, delete (A30).
- Both branches unprotected; no CI.
- Stack: Next.js 16.2.10 (App Router) + Supabase. Local machine is gone — **Vercel is the only compiler.**

### Layout

```
app/  GlobalProgress.tsx  layout.tsx  page.tsx  globals.css  favicon.ico
      [handle]/   page.tsx  EmbedShowcase.tsx  SubscribeForm.tsx  ShareButton.tsx  Tracker.tsx
      api/track/  go/  signin/{page,actions}  register/{page,actions}
      dashboard/[handle]/  layout.tsx (auth gate)  page.tsx (analytics)  loading.tsx
                           Sidebar  Charts  TrafficChart  BreakdownCard  dashboard.css
                           edit/  export/route.ts  users/  collections/  geoblocking/
lib/  analytics countryGroups deeplink handles progress sections session supabaseAdmin templates
sql/schema.sql (STALE - see BUGS B5)   middleware.ts   AGENTS.md   CLAUDE.md
```

## Hosting

- Live: `https://alandr.vercel.app` — `/`, `/ava`, `/signin`, `/register`, `/dashboard/ava`,
  `/dashboard/ava/edit`.
- Vercel project: `vercel.com/leven-smg/land-r` → Deployments: `https://vercel.com/leven-smg/land-r/deployments`
  (always send this link to the client).
- Hobby plan, non-commercial terms; a custom domain (Step 8) may need a paid plan.

## Supabase

- **MCP server reconnected 2026-09-26** after being unavailable earlier in the session. DB facts in
  this file are live-verified as of that date unless a row is marked 3 Sep.
- Project **LandR** `xwutsycngvrbgoxoarth`, eu-west-1, Postgres 17.6.1.141, created 2 Jul 2026.
  Status `ACTIVE_HEALTHY` (26 Sep).
- Second project `chatterdesk` `jlptjkmycdwsnslglquk` (eu-west-2) — unrelated, do not touch.
- **Free tier auto-pauses after ~1 week idle** (see BUGS B8). Found `INACTIVE` and restored on 3 Sep.
- Storage bucket `media`, public. Upload path `<creator_id>/<prefix>-<timestamp>.<ext>`.
- `accounts.id` is `uuid DEFAULT gen_random_uuid()`; the session cookie holds that uuid and is
  validated against the table on every request.

### accounts / creator ownership (verified 26 Sep)

- `accounts(id, email, name, password, role, created_at, username)`.
  - `email` is now **nullable**, because a creator-created model logs in with a username and may add
    an email later.
  - Before the 26 Sep migration `accounts` had **only a primary key** — no unique constraint on
    `email` at all, so duplicate signups were possible. Partial unique indexes on `lower(email)`
    and `lower(username)` now exist, plus a check that at least one of the two is present.
  - `role` is now constrained to `admin | model | creator` (previously unconstrained text).
- `creators.account_id` is the **single owner** of a page (the model). Creator access is never
  granted by changing this column — it comes from `creator_clients`.
- `creator_clients(id, creator_account_id, model_account_id, status, invited_by, created_at,
  responded_at)` — the many-to-many management link.
  - `status`: `pending | active | revoked`. `invited_by`: `model | creator`.
  - A model adds a creator's email to her team → row `pending`, `invited_by='model'` → the creator
    accepts from his dashboard → `active`. A creator who creates the model writes `active` directly.
  - The model can disconnect at any time → `revoked`, and the creator loses access immediately.
  - Unique on `(creator_account_id, model_account_id)`; self-links rejected; indexed on both sides;
    RLS enabled with no policies, like every other table.

### Real row counts (`count(*)`, 3 Sep 2026 — never trust `list_tables.rows`)

| Table | Rows |
| --- | --- |
| creators | 2 (was 1 — second one unidentified, BUGS B10) |
| accounts | 2 (still 2 on 26 Sep: `balogundivinee@gmail.com` admin, `jethrokhale@gmail.com` model) |
| links | 8 |
| page_views | 206 |
| link_clicks | 51 |
| subscribers | 0 |
| collections | 1 |
| signup_log | 0 (table unused — BUGS B9) |
| creator_clients | 0 (new, 26 Sep) |

### Migrations applied

```
20260822182715_landr_complete_missing_columns_and_rotation
20260822183434_pin_next_rotation_index_search_path
20260825012851_landr_collections_accounts_templates
20260825024041_landr_visitor_tracking_and_layout
20260825152536_landr_templates_focal_point_subscribe_styles
20260825160131_landr_photo_focal_point
creator_accounts_and_client_links            (26 Sep 2026)
```

### Advisors

- Security: 8× `rls_enabled_no_policy` (INFO) — intended, every write goes through the service role.
  Re-run `get_advisors` after the creator work; `creator_clients` will add a ninth.
- Performance: 6× unused index (INFO) — `link_clicks_link_id_idx`, `links_creator_id_position_idx`,
  `signup_log_ip_created_at_idx`, `creators_collection_id_idx`, `creators_account_id_idx`,
  `page_views_visitor_idx`.

## Product facts

- One client: the creator **"Ava"**, under an agency that manages ~10 models.
- Ava: 8 links (Telegram, Instagram, OnlyFans, Threads, Snapchat — still no colour — plus
  YouTube / TikTok / X embeds; the X one shows "Tweet not found").
- Geoblock list: `US, GB, DE`. Collection: "ava main".
- Themes: `noir`, `blush`, `aurora`, `gold`. Templates: Classic photo, Spotlight, Mosaic, Glass sheet.
- Palette: `#0f1117`, `#181c27`, `#232940`, `#5b7fff`.

## Credentials

**Not recorded in this repo, by design.** They live in Vercel/Supabase environment variables.
Note for whoever picks this up: the service-role key and the admin password were pasted into the
Aug chat archive and the handoff PDF, and the client **declined to rotate them** (Step 12,
CANCELLED). Treat the archive as a secret-bearing document.

## Source documents (the plan of record)

Held by the client, supplied as `project landr.zip`:
`Step 1.pdf` … `Step 24.pdf`, each with a `Step N TEST.pdf` checklist, plus
`LANDER-Guide.md` / `.pdf`, `notion-playbook.md` / `.pdf`, `LANDER-HANDOFF.pdf`,
`LANDER — Scaling to a SaaS Platform.pdf`, `.env.local.example`, and a `code/` folder with the
July versions of `EmbedShowcase.tsx` and `edit/actions.ts`.
