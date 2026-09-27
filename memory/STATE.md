# LandR — infrastructure state

**Verified 2026-09-27** unless stated otherwise.

## Repo

- `eleven-smg/LandR` (private). Previously moved to the `eleven-smgg` **org** by accident, which
  broke Vercel (Hobby cannot connect private org repos); transferred back, Vercel↔Git reconnected.
- `main` head is **`1ebde424`** — Step 17, the live visitor counter. The 27 Sep session added, in
  order: `4245acb8` (BUGS only), `38ffe4cd` (unsubscribe), `79c02f18` + `8a5043ef` + `e260217a`
  (welcome email), `c9fedb48` (keep-alive), `d27a2897` + `533ce01a` (Step 19 editor fields),
  `882ffea9` (Step 18), `ce0d75a4` + `98d7a2aa` + `7f5539ec` + `5dc83800` (the memory pass),
  `0c09ec5f` (Step 14 heatmap), `1ebde424` (Step 17 live counter). The 26 Sep session added ~35
  commits on top of the 25 Aug head `bb021b79` (see `SESSION-LOG.md`).
- `restore/editor-embeds-and-schema` @ `549239c7` — stale, delete (A30).
- Both branches unprotected. A typecheck workflow exists (`a260660b`) but **no tool here can read its
  result**, so every code commit is CODE proof only, never LIVE (B14). The client's forwarded Vercel
  failure emails are the only signal a build broke.
- **Never split a caller and its callee across commits** — the lesson of F31/F32, two failed builds.
- Stack: Next.js 16.2.10 (App Router) + Supabase + Tailwind 4. Local machine is gone —
  **Vercel is the only compiler.**

### Layout

```
app/  GlobalProgress.tsx  layout.tsx  page.tsx  globals.css  icon.svg
      [handle]/   page.tsx  EmbedShowcase.tsx  SubscribeForm.tsx  ShareButton.tsx  Tracker.tsx
                  whitelist/  contact.vcf/
      api/track/  api/keepalive/route.ts (new 27 Sep)  api/online/route.ts (new 27 Sep)
      go/[id]/route.ts   unsubscribe/{page.tsx,actions.ts} (new 27 Sep)
      signin/{page,actions}  register/{page,actions}
      dashboard/  page.tsx (creator home)  actions.ts (team + work claim)  compare/
      dashboard/[handle]/  layout.tsx (auth gate)  page.tsx (analytics)  loading.tsx
                           Sidebar  Charts  TrafficChart  BreakdownCard  dashboard.css
                           edit/  ActionForm AvatarCard Builder CountryRules ProfileForm
                                  SaveButton SectionOrder ScheduleFields (new 27 Sep)
                                  actions.ts mediaActions.ts orderActions.ts page.tsx
                           heatmap/  page.tsx Heatmap.tsx OnlineNow.tsx (all new 27 Sep)
                           export/route.ts  users/ (= Team)  collections/  geoblocking/
lib/  analytics collectionScope collections countryGroups creatorTeam deeplink handles
      mailboxes progress schedule sections session signupLimit subscriberGeo supabaseAdmin
      templates unsubscribe utm (new 27 Sep) welcomeCopy welcomeEmail
sql/schema.sql (STALE - see BUGS B5)   middleware.ts   next.config.ts   vercel.json (new 27 Sep)
AGENTS.md   .env.example   memory/
```

`middleware.ts` matches **only `/dashboard`**, so `/api/keepalive`, `/api/online`, `/unsubscribe` and
`/go/[id]` are outside the auth gate. That is deliberate for the first three; `/api/online` returns
visitor numbers, so it calls `requireDashboardAccess(handle)` itself — route handlers never run a
layout, which is F12's rule.

Dashboard tabs, in sidebar order: Analytics, **Best time** (new 27 Sep, `slug: "heatmap"`, clock
icon), Page Editor, Collections, Country rules, Team.

`app/favicon.ico` was **deleted** on 26 Sep (`b33785e8`); the mark is now `app/icon.svg` only.

## Hosting

- Live: `https://alandr.vercel.app` — `/`, `/ava`, `/signin`, `/register`, `/dashboard`,
  `/dashboard/compare`, `/dashboard/ava`, `/dashboard/ava/edit`, `/dashboard/ava/heatmap`,
  `/dashboard/ava/users`, `/{handle}/whitelist`, `/{handle}/contact.vcf`, `/unsubscribe`,
  `/api/keepalive`, `/api/online`, `/api/track`.
- Vercel project: `vercel.com/leven-smg/land-r` → Deployments: `https://vercel.com/leven-smg/land-r/deployments`
  (always send this link to the client).
- Hobby plan, non-commercial terms; a custom domain (Step 8) may need a paid plan.
- `vercel.json` holds one cron: `0 6 * * *` → `/api/keepalive` (see Supabase, below).
- Environment variables still **not set** (the client's own Wednesday list): `RESEND_API_KEY`,
  optional `CRON_SECRET`. Both features are written to be inert without them — the welcome email
  logs `skipped`, and the keep-alive route enforces a bearer token only if `CRON_SECRET` exists.

## Supabase

- **MCP server IS connected**, verified 27 Sep: `execute_sql` and `apply_migration` both ran. The
  26 Sep note claiming it was unavailable was wrong and has been retracted in `BUGS.md` — test it,
  never assume it is missing. `connections.ts` lists only `mcpServer_github`; that inventory is
  stale and is not evidence.
- Project **LandR** `xwutsycngvrbgoxoarth`, eu-west-1, Postgres 17, created 2 Jul 2026.
- Second project `chatterdesk` `jlptjkmycdwsnslglquk` (eu-west-2) — unrelated, do not touch.
- **Free tier auto-pauses after ~1 week idle** (B8). Decision: stay free and keep it awake with the
  daily Vercel cron above, which does a head-only `count` on `creators`. Found `INACTIVE` and
  restored once, on 3 Sep.
- Storage bucket `media`, public. Upload path `<creator_id>/<prefix>-<timestamp>.<ext>`.
- `accounts.id` is `uuid DEFAULT gen_random_uuid()`; the session cookie holds that uuid and is
  validated against the table on every request.

### accounts / creator ownership (verified 26 Sep, re-read 27 Sep)

- `accounts(id, email, name, password, role, created_at, username)` — **no `creator_id` column**, and
  **no `account_pages` table**. Ownership linkage runs through `creators.account_id` and
  `creator_clients`; `lib/session.ts` is the only place that resolves it.
  - `email` is **nullable**: a creator-created model logs in with a username and may add one later.
  - Partial unique indexes on `lower(email)` and `lower(username)`, plus a check that at least one is
    present. Before 26 Sep the table had only a primary key, so duplicate signups were possible.
  - `role` is constrained to `admin | model | creator`.
- `creators.account_id` is the **single owner** of a page (the model). Creator access is never
  granted by changing this column — it comes from `creator_clients`.
- `creator_clients(id, creator_account_id, model_account_id, status, invited_by, created_at,
  responded_at, release_requested_at, release_note, work_claim, work_claimed_by, work_claim_note,
  work_claimed_at, work_decided_at)` — the many-to-many management link.
  - `status`: `pending | active | release_requested | revoked`. `invited_by`: `model | creator`.
  - `work_claim`: `none | approved | requested | declined`, default `none`; `work_claimed_by`:
    `model | creator`. Both check-constrained.
  - A model adds a creator's email to her team → row `pending`, `invited_by='model'` → the creator
    accepts from his dashboard → `active`. A creator who creates the model writes `active` directly.
  - On accept the creator may claim he is the one building the page → `work_claim='requested'`. Her
    approval makes it `approved`, and **only then** does it restrain her.
  - She can disconnect instantly → `revoked` — unless `invited_by='creator'` **or**
    `work_claim='approved'`, in which case she can only reach `release_requested` and he decides.
  - Unique on `(creator_account_id, model_account_id)`; self-links rejected; indexed on both sides;
    RLS enabled with no policies, like every other table.

### creators — email and campaign columns (added 27 Sep)

- Welcome email, all five added by `welcome_email_settings_and_send_log`:
  `welcome_email_enabled boolean not null default false`, `welcome_email_from`,
  `welcome_email_reply_to`, `welcome_email_subject`, `welcome_email_body`.
  **Off on every page**, so the feature is inert until somebody ticks it *and* a provider key exists.
- Campaign tags, all four added by `utm_tagging_settings`:
  `utm_enabled boolean not null default false`, `utm_source`, `utm_medium`, `utm_campaign`.
  Empty source falls back to the handle, empty medium to `link`; `utm_content` is always the button's
  own label and is not stored.
- Also present from earlier work: `whitelist_redirect_mode` (`compose` on both pages),
  `whitelist_from_email` (ava: `balogundivinee@gmail.com` — a Gmail address, fine for drafts, never a
  bulk sender), `whitelist_from_name`, `whitelist_compose_subject/body`, `whitelist_prompt_*`
  (prompt **off**), `subscribe_button_text` (ava: "Subscribe and say hello") and
  `subscribe_button_note` ("and get free gifts").

### email_sends (new 27 Sep)

- `email_sends(id, creator_id → creators on delete cascade, email, kind default 'welcome', status,
  detail, provider_id, created_at)`; index on `(creator_id, created_at desc)`; RLS on, no policies.
- Every welcome-email outcome is written here — `sent`, `skipped` (switch off, no key, no from
  address) or `failed` with the provider's message. This table is the only record of what the site
  tried to send, so read it before believing any "the mail did not arrive" report.

### subscribers

- Holds `creator_id, handle, email, name, country, region, city, tier, wants_updates,
  whitelist_opened_at, unsubscribed_at, created_at`. Unique on `(creator_id, email)` — a repeat
  signup returns 23505 and is treated as success, and no second welcome is sent.
- `unsubscribed_at` is stamped by `/unsubscribe`, which also sets `wants_updates = false`, guarded on
  `.is("unsubscribed_at", null)` so a second click cannot rewrite the date.

### page_views / link_clicks (re-read 27 Sep)

- `page_views(id, creator_id, created_at, country, region, city, device, browser, os, referrer,
  source, path, visitor_id, session_id, duration_seconds, language, screen)`.
- `link_clicks(id, creator_id, link_id, created_at, country, region, city, device, browser, os,
  referrer, source, destination_url, visitor_id, session_id)`.
- **Neither table has any `utm_*` column**, which is exactly why B12 is still open: the Mediums tile
  needs incoming `utm_*` captured onto `page_views` (a migration), and Events needs a table that does
  not exist yet.
- `duration_seconds` is what `/api/online` adds to `created_at` to decide whether a session is still
  present, and what the analytics page uses for time-on-page. The heatmap uses `created_at` only.

### links

- `starts_at` / `ends_at` (timestamptz, nullable) have existed since August. Enforced since 26 Sep in
  `lib/schedule.ts` (used by both the public page and `/go/[id]`) and **editable since 27 Sep** in
  `edit/ScheduleFields.tsx`. Every row still has both null, so nothing is currently timed.
- Also: `geo_rules`, `rotate`, `rotation_urls`, `rotation_index`, `collection_key`, `layout`,
  `size`/`shape`/`color`, `preview_image_url`, `media_url`, `position`, `is_active`.

### collections (verified 26 Sep)

- `collections(id, name, redirect_url, owner_account_id, country_redirect_enabled, destinations
  jsonb, takeover_url, takeover_enabled, created_at)`; `creators.collection_id` files a page into one.
- `owner_account_id` was **backfilled from the pages already inside each collection**; legacy rows
  with a null owner are admin-only.
- `redirect_url` is the old dead field (F18). Existing values were deliberately left with
  `country_redirect_enabled = false` so no live visitor behaviour changed silently.
- `links.collection_key` optionally tags a link to a destination slot; when it is null the platform
  is derived from the link's own destination host instead, so destinations work with no tagging.

### signup_log

- `signup_log(id, ip, handle, created_at)` with `signup_log_ip_created_at_idx` on `(ip, created_at)`.
- **It had no writer at all until `d721982b` (F29).** `lib/signupLimit.ts` now writes one row per
  **completed** `/register` signup and reads the last 24h to enforce 3 per IP per hour / 8 per day.
  A read failure allows the signup and logs loudly, by design.

### Real row counts (`count(*)`, 27 Sep 2026 — never trust `list_tables.rows`)

| Table | Rows |
| --- | --- |
| creators | **2** — `ava` (8 links, 229 views) and `jaero_yt` (display name "John the first", 0 links, 3 views). **There is no duplicate `/jaero_yt` row: F13 is closed, nothing to delete.** |
| accounts | 2 — `balogundivinee@gmail.com` admin, `jethrokhale@gmail.com` model |
| links | 8 |
| subscribers | 0 |
| email_sends | 0 (new today) |
| collections | 1 ("ava main") |
| creator_clients | 0 |
| signup_log | 0 — the table now has a writer (F29); expect rows once a real signup happens |

With 229 views on one page and 3 on the other, the heatmap's 90-day window and 5,000-row cap are
nowhere near binding, and the grid will be sparse — which the screen states plainly rather than
naming a "best hour" from a handful of visits.

### Migrations applied

```
20260822182715_landr_complete_missing_columns_and_rotation
20260822183434_pin_next_rotation_index_search_path
20260825012851_landr_collections_accounts_templates
20260825024041_landr_visitor_tracking_and_layout
20260825152536_landr_templates_focal_point_subscribe_styles
20260825160131_landr_photo_focal_point
creator_accounts_and_client_links                 (26 Sep 2026)
collection_destinations_takeover_and_owner        (26 Sep 2026)
creator_clients_work_claim                        (26 Sep 2026)
welcome_email_settings_and_send_log               (27 Sep 2026)
utm_tagging_settings                              (27 Sep 2026)
```

Steps 14 and 17 added **no** migration — both read tables that already existed.

### Advisors

- Security: `rls_enabled_no_policy` (INFO) on every table — intended, every write goes through the
  service role. `email_sends` adds one more; re-run `get_advisors` to confirm the new count.
- Performance: unused indexes (INFO) — `link_clicks_link_id_idx`, `links_creator_id_position_idx`,
  `signup_log_ip_created_at_idx`, `creators_collection_id_idx`, `creators_account_id_idx`,
  `page_views_visitor_idx`, plus the 26 Sep pair (`collections.owner_account_id`,
  `links.collection_key`) and now `email_sends (creator_id, created_at desc)`. All will read as
  unused until the features see traffic.

## Product facts

- One client: the creator **"Ava"**, under an agency that manages ~10 models.
- Ava: 8 links (Telegram, Instagram, OnlyFans, Threads, Snapchat — still no colour — plus
  YouTube / TikTok / X embeds; the X one shows "Tweet not found").
- Flagged-country list: `US, GB, DE` on Ava's page. Collection: "ava main".
- Themes: `noir`, `blush`, `aurora`, `gold`. Templates: Classic photo, Spotlight, Mosaic, Glass sheet.
- Palette: `#0f1117`, `#181c27`, `#232940`, `#5b7fff`.
- Brand: the product is written **LandR** everywhere, including `app/page.tsx` since `3efb889a`.
  The client has said the name is moving off "Lander"; the new name is his to choose and is parked
  until Wednesday with the domain.
- **Honest limit, repeated to the client:** no provider API can whitelist a third-party sender. Only
  "open a prefilled draft" and "land on the right screen" are real; everything else in that area is
  wording, not delivery.

## Credentials

**Not recorded in this repo, by design.** They live in Vercel/Supabase environment variables.
Note for whoever picks this up: the service-role key and the admin password were pasted into the
Aug chat archive and the handoff PDF, and the client **declined to rotate them** (Step 12,
CANCELLED). Treat the archive as a secret-bearing document. `lib/unsubscribe.ts` signs its tokens
with `SUPABASE_SERVICE_ROLE_KEY`, so rotating that key would invalidate every unsubscribe link
already sent.

## Source documents (the plan of record)

Held by the client, supplied as `project landr.zip`:
`Step 1.pdf` … `Step 24.pdf`, each with a `Step N TEST.pdf` checklist, plus
`LANDER-Guide.md` / `.pdf`, `notion-playbook.md` / `.pdf`, `LANDER-HANDOFF.pdf`,
`LANDER — Scaling to a SaaS Platform.pdf`, `.env.local.example`, and a `code/` folder with the
July versions of `EmbedShowcase.tsx` and `edit/actions.ts`.
