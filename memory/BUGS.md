# LandR — bugs, errors and risks

Severity: **P0** client data or client trust at risk now · **P1** blocks or misleads · **P2** polish.
Every entry needs evidence. Move to *Fixed* with the commit SHA. Never delete the *Retracted* table.

## Open

| ID | Sev | What | Evidence | Fix direction |
| --- | --- | --- | --- | --- |
| B1 | P0 | **Analytics CSV export has no authorization.** `app/dashboard/[handle]/export/route.ts` is a route handler, so the dashboard layout's auth gate never runs for it, and the file contains no `getSession()` call. `middleware.ts` only checks the session cookie is *non-empty*, never validates it. Any request with `landr_session=<anything>` can download up to 20k rows of visitor data (country, region, city, device, browser, OS, referrer, visitor_id, session_id) for any handle. | Read at `bb021b79` | Add `requireDashboardAccess(handle)` at the top of `GET`; return 403. |
| B2 | P0 | **Editor server actions perform no authorization.** `edit/mediaActions.ts`, `edit/orderActions.ts` and `edit/actions.ts` take `handle` and `creator_id` straight from client `FormData` and write with the Supabase **service role**, with no session or ownership check. Any signed-in model can overwrite another model's photo, links, icons or section order. Commit `48035557`'s claim "models only see their own pages" is true for viewing only. | Read at `bb021b79` | Same helper; derive `creator_id` from the session, stop trusting posted ids. |
| B3 | P1 | **Passwords stored and compared in plaintext.** `register/actions.ts` inserts `password` raw; `signin/actions.ts` does `String(account.password) !== password`. Client explicitly accepted this while testing (see `DECISIONS.md`), but `/register` is now public, which was the stated precondition for changing it. `pgcrypto` is already installed. | Read at `bb021b79` | `crypt()`/bcrypt + one-time migration of the existing rows. |
| B4 | P1 | Session cookie has **no `secure` flag**, no rotation, no revocation, 30-day life; comparison is timing-unsafe. | `lib/session.ts`, `register/actions.ts` | Random token table + `secure` + logout invalidation (= A25). |
| B5 | P1 | **`sql/schema.sql` is stale** although it calls itself consolidated: it omits the `accounts` and `collections` tables and every visitor-tracking / template / focal-point column added by the six later migrations. Running it on a fresh project produces a broken app. | Compared against live schema | Regenerate from the live database. |
| B6 | P2 | The X/Twitter embed on `/ava` renders **"Tweet not found."** | Client-reported, 25 Aug | Client said they will disable or replace that embed; fallback behaviour (uploaded clip + tap-to-redirect) is the agreed design. |
| B7 | P2 | One **social icon is broken on desktop**, and links have no per-link deep-link override. | Client desktop screenshot, 25 Aug | Queued with the icon/link polish pass. |
| B8 | P1 | **Supabase free tier auto-pauses after ~1 week idle.** The LandR project was found `INACTIVE` on 3 Sep after ~3 weeks idle, which means `alandr.vercel.app/ava` was serving database errors to real visitors. `restore_project` brought it back; it will pause again. | Verified via Supabase MCP, 3 Sep | Paid plan, or a scheduled keep-alive. Wrong foundation for a client-facing product. |
| B9 | P1 | **Signup rate limiting does not exist.** The `signup_log` table and `signup_log_ip_created_at_idx` exist but nothing writes to them (0 rows), so `/register` is an open endpoint that creates both an account and a public page per request. | `register/actions.ts`, live row count | Part of Step 22. |
| B10 | P2 | An **unidentified second account/creator** exists (creators went 1 → 2). Probably a `/register` test, but unconfirmed. | Live counts, 3 Sep | Identify, then delete if it is test data. |
| B11 | P2 | Stale branch `restore/editor-embeds-and-schema` @ `549239c7` still exists; its work is already on `main` via `96ec5755`. Client agreed to delete it on 22 Aug. | GitHub, verified 23 Sep | Delete (= A30). |
| B12 | P2 | Dashboard **Mediums** and **Events** tiles still say "not built yet". | Live dashboard | Resolved by Step 18 + an events table. |
| B13 | P1 | **Collections semantics mismatch.** The client expects a collection (e.g. a Telegram group) to carry *different link destinations* for blocked countries, with non-collection links identical worldwide. What is built: collections group *pages*, and per-country destination swaps are configured per link in the editor. The engine can do what they want; the model and the copy do not match their mental picture. Raised 22 Aug, restated 25 Aug, still unresolved. | Chat turns + code | Decide: move country swaps onto collections, or rewrite the UI copy to explain per-link rules. |
| B14 | P2 | Both branches on the repo are **unprotected**; there is no CI check, so a red build can only be caught on Vercel after the fact. | GitHub | Optional branch protection + typecheck action. |

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

## Retracted — false reports. Never repeat these.

| Claim | Truth |
| --- | --- |
| "The session cookie *is* the account id, so it is guessable" — stated in the 25 Aug final response and repeated once afterwards | `accounts.id` is `uuid DEFAULT gen_random_uuid()`, verified against `information_schema`. A v4 UUID is not guessable, and `getSession()` validates it against the `accounts` table. Hardening is still wanted (B4) but not for this reason. |
| "The dashboard performs no authorization at all" | `app/dashboard/[handle]/layout.tsx` holds a real gate: `getSession()`, redirect to `/signin`, admins see every page, a model is bounced to its own handle. The holes are B1 and B2, not the pages. |
| "Analytics writes undeclared columns" | Wrong; the columns exist. |
| "No indexes exist" | Wrong; see `STATE.md`. |
| "Rows were lost" (from `list_tables`' `rows` field) | That field is a planner estimate. Always use `count(*)`. |

## Verification rules learned the hard way

- Never trust `list_tables.rows`; run `count(*)`.
- `create index if not exists` matches on **name**; `create table if not exists` does **not** add columns.
- Cached web fetches are not evidence of production state. The client's browser and the
  `page_views` counts are ground truth.
- Country detection and geo features cannot be tested locally — only on the deployed URL.
