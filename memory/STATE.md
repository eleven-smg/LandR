# LandR — infrastructure state

**Verified 2026-09-26** unless stated otherwise.

## Repo

- `eleven-smg/LandR` (private). Previously moved to the `eleven-smgg` **org** by accident, which
  broke Vercel (Hobby cannot connect private org repos); transferred back, Vercel↔Git reconnected.
- `main` @ **`bb021b79`** — "fix(background): zoom can go below 100 percent, desktop-shaped crop
  preview, recentre button, clearer labels", 2026-08-25T18:08:03Z. **No commits since.**
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

- Project **LandR** `xwutsycngvrbgoxoarth`, eu-west-1, Postgres 17.6.1.141, created 2 Jul 2026.
- Second project `chatterdesk` `jlptjkmycdwsnslglquk` (eu-west-2) — unrelated, do not touch.
- **Free tier auto-pauses after ~1 week idle** (see BUGS B8). Found `INACTIVE` and restored on 3 Sep.
- Storage bucket `media`, public. Upload path `<creator_id>/<prefix>-<timestamp>.<ext>`.
- `accounts.id` is `uuid DEFAULT gen_random_uuid()`; the session cookie holds that uuid and is
  validated against the table on every request.

### Real row counts (`count(*)`, 3 Sep 2026 — never trust `list_tables.rows`)

| Table | Rows |
| --- | --- |
| creators | 2 (was 1 — second one unidentified, BUGS B10) |
| accounts | 2 |
| links | 8 |
| page_views | 206 |
| link_clicks | 51 |
| subscribers | 0 |
| collections | 1 |
| signup_log | 0 (table unused — BUGS B9) |

### Migrations applied

```
20260822182715_landr_complete_missing_columns_and_rotation
20260822183434_pin_next_rotation_index_search_path
20260825012851_landr_collections_accounts_templates
20260825024041_landr_visitor_tracking_and_layout
20260825152536_landr_templates_focal_point_subscribe_styles
20260825160131_landr_photo_focal_point
```

### Advisors

- Security: 8× `rls_enabled_no_policy` (INFO) — intended, every write goes through the service role.
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
