# LandR — infrastructure state

**Verified 2026-09-26** unless stated otherwise.

## Repo

- `eleven-smg/LandR` (private). Previously moved to the `eleven-smgg` **org** by accident, which
  broke Vercel (Hobby cannot connect private org repos); transferred back, Vercel↔Git reconnected.
- `main` head is a **memory commit**; the last application code commit is **`d721982b`** — the
  `/register` rate limit (F29). The work-claim flow `78af4f8b` is the code commit before it. The
  25 Aug head was `bb021b79`; the 26 Sep session added ~35 commits on top of it
  (see `SESSION-LOG.md`).
- `restore/editor-embeds-and-schema` @ `549239c7` — stale, delete (A30).
- Both branches unprotected. A typecheck workflow exists (`a260660b`) but **no tool here can read its
  result**, so 26 Sep code is CODE proof only (B14).
- Stack: Next.js 16.2.10 (App Router) + Supabase. Local machine is gone — **Vercel is the only compiler.**

### Layout

```
app/  GlobalProgress.tsx  layout.tsx  page.tsx  globals.css  icon.svg
      [handle]/   page.tsx  EmbedShowcase.tsx  SubscribeForm.tsx  ShareButton.tsx  Tracker.tsx
      api/track/  go/  signin/{page,actions}  register/{page,actions}
      dashboard/  page.tsx (creator home)  actions.ts (team + work claim)  compare/
      dashboard/[handle]/  layout.tsx (auth gate)  page.tsx (analytics)  loading.tsx
                           Sidebar  Charts  TrafficChart  BreakdownCard  dashboard.css
                           edit/  export/route.ts  users/ (= Team; rebuilt F23, admin + owner branches)
                           collections/  geoblocking/ (= Country rules)
lib/  analytics collectionScope collections countryGroups creatorTeam deeplink handles
      progress sections session signupLimit supabaseAdmin templates
sql/schema.sql (STALE - see BUGS B5)   middleware.ts   AGENTS.md   CLAUDE.md
```

`app/favicon.ico` was **deleted** on 26 Sep (`b33785e8`); the mark is now `app/icon.svg` only, so no
browser can prefer the old create-next-app default.

## Hosting

- Live: `https://alandr.vercel.app` — `/`, `/ava`, `/signin`, `/register`, `/dashboard`,
  `/dashboard/compare`, `/dashboard/ava`, `/dashboard/ava/edit`, `/dashboard/ava/users`.
- Vercel project: `vercel.com/leven-smg/land-r` → Deployments: `https://vercel.com/leven-smg/land-r/deployments`
  (always send this link to the client).
- Hobby plan, non-commercial terms; a custom domain (Step 8) may need a paid plan.

## Supabase

- **MCP server NOT connected** as of the end of the 26 Sep session: `connections.supabase` errors
  "not available in script mode". It was available during Block 4 and has been unreachable since, so
  **no read, row count or migration is possible** — the schema facts below are live-verified as of
  Block 4 (26 Sep) and the row counts still date from 3 Sep. Reconnect before trusting either.
- Project **LandR** `xwutsycngvrbgoxoarth`, eu-west-1, Postgres 17.6.1.141, created 2 Jul 2026.
  Status `ACTIVE_HEALTHY` when last seen (26 Sep, Block 4).
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

### collections (verified 26 Sep)

- `collections(id, name, redirect_url, owner_account_id, country_redirect_enabled, destinations
  jsonb, takeover_url, takeover_enabled, created_at)`; `creators.collection_id` files a page into one.
- `owner_account_id` was **backfilled from the pages already inside each collection**; legacy rows
  with a null owner are admin-only.
- `redirect_url` is the old dead field (F18). Existing values were deliberately left with
  `country_redirect_enabled = false` so no live visitor behaviour changed silently.
- `links.collection_key` optionally tags a link to a destination slot; when it is null the platform
  is derived from the link's own destination host instead, so destinations work with no tagging.

### signup_log (schema confirmed from `sql/schema.sql`, which is correct for this table)

- `signup_log(id, ip, handle, created_at)` with `signup_log_ip_created_at_idx` on `(ip, created_at)`.
  Both have existed since August. The index name matches the live unused-index advisory list, which
  is how it was confirmed while the MCP server is down.
- **It had no writer at all until `d721982b` (F29).** `lib/signupLimit.ts` now writes one row per
  **completed** `/register` signup and reads the last 24h to enforce 3 per IP per hour / 8 per day.
  A read failure allows the signup and logs loudly, by design.

### Real row counts (`count(*)`, 3 Sep 2026 — never trust `list_tables.rows`)

| Table | Rows |
| --- | --- |
| creators | 2 (the second is `/jaero_yt`, F13 — still not deleted) |
| accounts | 2 (still 2 on 26 Sep: `balogundivinee@gmail.com` admin, `jethrokhale@gmail.com` model) |
| links | 8 |
| page_views | 206 |
| link_clicks | 51 |
| subscribers | 0 |
| collections | 1 |
| signup_log | 0 — but the table **now has a writer** (F29); expect rows once a real signup happens |
| creator_clients | 0 (new, 26 Sep) |

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
```

Nothing after `creator_clients_work_claim`: the rate limit (F29) needed no migration, and none has
been possible since Block 4.

### Advisors

- Security: 8× `rls_enabled_no_policy` (INFO) — intended, every write goes through the service role.
  Re-run `get_advisors` after the creator work; `creator_clients` will add a ninth.
- Performance: 6× unused index (INFO) — `link_clicks_link_id_idx`, `links_creator_id_position_idx`,
  `signup_log_ip_created_at_idx`, `creators_collection_id_idx`, `creators_account_id_idx`,
  `page_views_visitor_idx`. `signup_log_ip_created_at_idx` is now read on every signup attempt, so it
  should drop off that list once `/register` sees traffic. The two indexes added on 26 Sep
  (`collections.owner_account_id`, `links.collection_key`) will read as unused until the features get
  traffic.

## Product facts

- One client: the creator **"Ava"**, under an agency that manages ~10 models.
- Ava: 8 links (Telegram, Instagram, OnlyFans, Threads, Snapchat — still no colour — plus
  YouTube / TikTok / X embeds; the X one shows "Tweet not found").
- Flagged-country list: `US, GB, DE` on Ava's page. Collection: "ava main".
- Themes: `noir`, `blush`, `aurora`, `gold`. Templates: Classic photo, Spotlight, Mosaic, Glass sheet.
- Palette: `#0f1117`, `#181c27`, `#232940`, `#5b7fff`.
- Brand: the product is written **LandR** everywhere, including `app/page.tsx` since `3efb889a`.
  The home page used to say "Lander"; unifying it was my call on the evidence, not the client's —
  still an open question for him.

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
