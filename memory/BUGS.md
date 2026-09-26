# LandR — bugs, errors and risks

Severity: **P0** client data or client trust at risk now · **P1** blocks or misleads · **P2** polish.
Every entry needs evidence. Move to *Fixed* with the commit SHA. Never delete the *Retracted* table.

## Open

| ID | Sev | What | Evidence | Fix direction |
| --- | --- | --- | --- | --- |
| B3 | P1 | **Passwords stored and compared in plaintext.** `register/actions.ts` inserts `password` raw; `signin/actions.ts` does `String(account.password) !== password`. Client explicitly accepted this while testing (see `DECISIONS.md`), but `/register` is now public, which was the stated precondition for changing it. `pgcrypto` is already installed. | Read at `bb021b79` | `crypt()`/bcrypt + one-time migration of the existing rows. |
| B4 | P1 | Session cookie has **no `secure` flag**, no rotation, no revocation, 30-day life; comparison is timing-unsafe. `middleware.ts` still only checks the cookie is non-empty — acceptable now that the layout, the export route and every server action validate it properly, but it is a redirect helper, not a gate. | `lib/session.ts`, `middleware.ts`, `register/actions.ts` | Random token table + `secure` + logout invalidation (= A25). |
| B5 | P1 | **`sql/schema.sql` is stale** although it calls itself consolidated: it omits the `accounts` and `collections` tables and every visitor-tracking / template / focal-point column added by the six later migrations. Running it on a fresh project produces a broken app. | Compared against live schema | Regenerate from the live database. |
| B6 | P2 | The X/Twitter embed on `/ava` renders **"Tweet not found."** | Client-reported, 25 Aug | Client said they will disable or replace that embed; fallback behaviour (uploaded clip + tap-to-redirect) is the agreed design. |
| B7 | P2 | One **social icon is broken on desktop**, and links have no per-link deep-link override. | Client desktop screenshot, 25 Aug | Queued with the icon/link polish pass. |
| B8 | P1 | **Supabase free tier auto-pauses after ~1 week idle.** The LandR project was found `INACTIVE` on 3 Sep after ~3 weeks idle, which means `alandr.vercel.app/ava` was serving database errors to real visitors. `restore_project` brought it back; it will pause again. | Verified via Supabase MCP, 3 Sep | Paid plan, or a scheduled keep-alive. Wrong foundation for a client-facing product. |
| B9 | P1 | **Signup rate limiting does not exist.** The `signup_log` table and `signup_log_ip_created_at_idx` exist but nothing writes to them (0 rows), so `/register` is an open endpoint that creates both an account and a public page per request. | `register/actions.ts`, live row count | Part of Step 22. |
| B11 | P2 | Stale branch `restore/editor-embeds-and-schema` @ `549239c7` still exists; its work is already on `main` via `96ec5755`. Client agreed to delete it on 22 Aug. | GitHub, verified 23 Sep | Delete (= A30). |
| B12 | P2 | Dashboard **Mediums** and **Events** tiles still say "not built yet". The client's reference dashboard shows both as real panels (Referrers → Channels/Sources/Mediums, and a standalone Events card). | Live dashboard + reference screenshot `IMG-20260926-WA0005` | Resolved by Step 18 + an events table. |
| B13 | P1 | **Collections semantics — decided 26 Sep, implementation pending.** The reference product's own "New collection" dialog is Name + Redirect url + "When someone from a blocked country visits your page, you can redirect them here", and its Analytics tab has a **"Filter on collection"** dropdown. So a collection = a group of pages + one optional redirect + an analytics filter; it does **not** carry per-platform destinations. Per-country destination swaps stay per link (see B18). Ours has the grouping and the redirect; the **analytics filter is missing**. | Reference screenshots `IMG-20260926-WA0006` (dialog) and `WA0005` (filter), `Now I have a clEAR.docx` | Add the collection filter to Analytics; relabel the redirect as optional; delete the "block screen" copy (B19). |
| B14 | P2 | Both branches on the repo are **unprotected**; there is no CI check, so a red build can only be caught on Vercel after the fact. | GitHub | Optional branch protection + typecheck action. |
| B17 | P1 | **A creator/page cannot be deleted anywhere in the product.** Pages are created at `/register` and there is no delete control in any tab; Users → "Remove an account" deletes a *login* only and deliberately leaves the page in place as unassigned. So a page added twice by mistake (see B10) is permanent without hand-written SQL. | `app/dashboard/[handle]/users/`, whole `app/dashboard` tree, 26 Sep | Delete-page control in Users → "Who owns which page", typed-handle confirm, cascading links/analytics/subscribers. |
| B18 | P2 | **Per-link country routing UI is unusable as designed.** The editor shows a free-text box ("One rule per line, format `NG,GH = https://t.me/africa`"), so every country has to be typed in by hand and there is no "every flagged country" option. It also carries the line "Link rotation lives in the Geoblocking tab", which describes a different feature and belongs nowhere near that box. | `edit/page.tsx`, page-editor capture, client 26 Sep | Tick-box per link that reveals rule rows: scope dropdown (**all flagged countries** / a `countryGroups.ts` tier / pick countries) + destination URL. |
| B19 | P2 | **"Blocked" is the wrong word throughout.** The agreed behaviour is that flagged countries still land on the normal page and only see the overridden link destinations. The Collections tab still says "blocked visitors see the block screen", and the tab is called Geoblocking. | Collections capture, client 26 Sep | Rename the tab to Country rules, remove the block-screen copy, keep the collection redirect as an explicit opt-in. |

## Fixed

| ID | What | Fixed by |
| --- | --- | --- |
| F1 | `/ava` returned 404 — the page selected columns that did not exist (Postgres 42703, error silently discarded) | migration `20260822182715_landr_complete_missing_columns_and_rotation` |
| F2 | `/Ava` failed on Android (auto-capitalised first letter, case-sensitive lookups) | all four lookups switched to case-insensitive |
| F3 | Vercel could not build — repo had moved to the `eleven-smgg` org and Hobby cannot connect private org repos | repo transferred back to `eleven-smg`, Vercel↔Git reconnected |
| F4 | Background/icon replacement kept serving the old image | unique upload filenames + deletion of the previous file |
| F5 | Editor fields reverted to their previous value after save | controlled fields + 4-state save button |
| F6 | Section reorder overshot the intended position on repeat taps | whole-order-at-once save + live drag |
| F7 | Rotation could collide on simultaneous clicks | atomic `next_rotation_index()` with a random fallback |
| F8 | Supabase project paused, live page erroring | `restore_project`, 3 Sep (recurs — see B8) |
| F9 (was B15) | **The first tap on every button and link did nothing site-wide; the control had to be activated with Enter instead.** `GlobalProgress.tsx` added `pointer-events: none` on `pointerdown`, and the browser resolves the click target at pointer-up, so the tapped element was already out of hit-testing and its handler never ran — while `pointerdown` had still moved focus to it, so Enter worked. Introduced by `0630e185` (25 Aug), shipped in the live deploy, and it cost real link clicks on `/ava` as well as breaking the dashboard. | `923ca5d3` — dim is opacity only on pointerdown; `pointer-events: none` moves to a second class applied from the click handler on the next tick |
| F10 (was B1) | Analytics CSV export had no authorization — any non-empty `landr_session` cookie could download up to 20k rows of visitor data for any handle | `d5a365f6` (new `requireDashboardAccess` in `lib/session.ts`) + `d56f5952` (route returns 403) |
| F11 (was B2) | Editor server actions performed no authorization: `handle` and `creator_id` came from client `FormData` and were written with the service role. Also found while fixing: `saveIcon`, `removeIcon`, `uploadVideo`, `savePreview`, `updateLink`, `deleteLink`, `saveGeoRules` and `saveRotation` wrote by **link id alone**, so any signed-in user could edit any link row in the database by guessing an id | `5f228e89` (orderActions) + `4e364060` (mediaActions) + `5f0196e3` (actions.ts). Every action resolves the creator through `requireDashboardAccess`, takes the creator id from the session, and scopes link writes with `.eq("creator_id", …)`. `subscribe()` is intentionally left public |
| F12 (was B16) | **Account and collection management had no check of any kind.** Any signed-in model could post to `users/actions.ts` and create an admin account, change any account's password or role, delete an account, or reassign any page to themselves — a full workspace takeover from a model login. `collections/actions.ts` was the same, and `setPageCollection` took a page id from the form, so any page could be moved into any collection | `70aac9c3` (admin-only, and you cannot demote or delete your own account) + `df6478ee` (admin for create/rename/delete, owner-or-admin to assign a page) |
| F13 (was B10) | The unidentified second creator is **`/jaero_yt`, "John the first"**, owned by account `jethrokhale@gmail.com` — a `/register` test, as suspected | Identified 26 Sep from the Collections and Users captures. Deleting it is blocked on B17 |

## Retracted — false reports. Never repeat these.

| Claim | Truth |
| --- | --- |
| "The session cookie *is* the account id, so it is guessable" — stated in the 25 Aug final response and repeated once afterwards | `accounts.id` is `uuid DEFAULT gen_random_uuid()`, verified against `information_schema`. A v4 UUID is not guessable, and `getSession()` validates it against the `accounts` table. Hardening is still wanted (B4) but not for this reason. |
| "The dashboard performs no authorization at all" | `app/dashboard/[handle]/layout.tsx` holds a real gate: `getSession()`, redirect to `/signin`, admins see every page, a model is bounced to its own handle. The holes were B1, B2 and B16 — route handlers and server actions, which never pass through a layout — not the pages. |
| "Analytics writes undeclared columns" | Wrong; the columns exist. |
| "No indexes exist" | Wrong; see `STATE.md`. |
| "Rows were lost" (from `list_tables`' `rows` field) | That field is a planner estimate. Always use `count(*)`. |

## Verification rules learned the hard way

- Never trust `list_tables.rows`; run `count(*)`.
- `create index if not exists` matches on **name**; `create table if not exists` does **not** add columns.
- Cached web fetches are not evidence of production state. The client's browser and the
  `page_views` counts are ground truth.
- Country detection and geo features cannot be tested locally — only on the deployed URL.
- A layout gate protects pages only. **Route handlers and server actions never run a layout**, so
  each one needs its own `requireDashboardAccess` call. This was the single largest class of defect
  in the project.
