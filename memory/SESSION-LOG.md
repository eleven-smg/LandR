# LandR — session log

Append one entry per working session, newest first. Always record commit SHAs.

---

## 2026-09-26 (afternoon) — first code session since 25 Aug: the tap bug, an authorization sweep, then the reference-driven UI work

Client approved code changes ("lets start"). Head was `917494bf` before the session.

### Block 1 — the tap bug and the authorization sweep

| SHA | What |
| --- | --- |
| `923ca5d3` | `app/GlobalProgress.tsx` — fixed **F9**, the Enter-key / dead-click bug |
| `d5a365f6` | `lib/session.ts` — new `requireDashboardAccess(handle)` helper |
| `d56f5952` | `export/route.ts` now 403s without access (closes **B1**) |
| `5f228e89` | `edit/orderActions.ts` gated; writes scoped by creator id |
| `4e364060` | `edit/mediaActions.ts` gated; new `ownsLink` check |
| `5f0196e3` | `edit/actions.ts` — every action gated, link writes scoped `.eq("creator_id", …)`; `subscribe()` left public on purpose |
| `70aac9c3` | `users/actions.ts` — admin-only; cannot demote or delete your own account |
| `df6478ee` | `collections/actions.ts` — admin for create/rename/delete, owner-or-admin to assign a page |
| `0a19c982` | `memory/BUGS.md` rewritten: B1→F10, B2→F11, new F9/F12/F13, new B17–B19 |

**F9 root cause (worth remembering).** `.landr-tapped` set `pointer-events: none !important` and was
applied on `pointerdown`. The browser resolves a click target at pointer-*up*, so the tapped element
was already out of hit-testing and its handler never ran — while focus had landed on it, so pressing
Enter fired it. Introduced by `0630e185` (25 Aug), shipped live, and it also cost real link clicks on
`/ava`. Fix: dim with opacity only on pointerdown; `pointer-events: none` moved to a `.landr-busy`
class added from the click handler via `setTimeout(…, 0)`. Repeat taps are still swallowed.

**Authorization sweep.** `users/actions.ts` was the worst hole — no check at all, so any signed-in
model could create an admin account, change any password or role, delete accounts and reassign any
page. `collections/actions.ts` was also unchecked. Separately, `saveIcon`, `removeIcon`,
`uploadVideo`, `savePreview`, `updateLink`, `deleteLink`, `saveGeoRules` and `saveRotation` all wrote
by **link id alone**, so any signed-in user could edit any link row by guessing an id. All now scoped.

**Lesson recorded in `BUGS.md`:** route handlers and server actions never run a layout, so each one
needs its own gate.

### Block 2 — country rules, collections, delete-page

| SHA | What |
| --- | --- |
| `8de183b3` | `memory/SESSION-LOG.md` split into morning / afternoon blocks |
| `f15299ee` | `memory/PROGRESS.md` refreshed to `0a19c982`, Part 3 queue re-ordered |
| `ca011598` | **new** `edit/CountryRules.tsx` — tick box + per-rule scope dropdown (every flagged country / first / second / third world / pick countries), destination URL, country checkbox grid, summary line |
| `e5da8cfe` | `edit/page.tsx` uses `CountryRules`; free-text rule box and the stray "Link rotation lives in the Geoblocking tab" line removed; section retitled "Country rules for this link" with a count badge |
| `96d9cc6d` | Geoblocking → **Country rules** in the sidebar and page title (slug kept), `CountryPicker.tsx` reworded to flagged-visitor language, chips amber, `blockAll`/`unblockAll` → `addTier`/`clearTier` (closes **F17**) |
| `bdda4002` | Analytics **"Filter on collection"** dropdown, admin-gated; `collections/page.tsx` sub copy rewritten (closes **B13** → F14) |
| `3a1620f5` | `CollectionsUI.tsx` — redirect labelled optional, "blocked"/"block screen" copy gone, note that Analytics can add the group together |
| `2171e5fd` | Users → **Delete a page**: new admin-only `deletePage` action with typed-handle confirm and child-first cleanup (closes **B17** → F15) |

**Country rules.** `CountryRules.tsx` serialises its rules back into the existing `NG,GH = url` line
format through a hidden `geo_rules` input, so `saveGeoRules` and the `links.geo_rules` shape are
untouched and **no migration was needed** — which mattered, because the Supabase MCP server is not
connected this session. Unticking the box and saving clears the rules.

**Analytics collection filter.** `?collection=<id>` swaps the five `.eq("creator_id", creator.id)`
filters for `.in("creator_id", ids)` over the collection's pages. It is gated on **admin**, not just
access: a collection spans pages owned by other people, so without that check one model could read
another's numbers. A model who passes the parameter is ignored and still sees their own page. An
empty collection resolves to a sentinel uuid so every figure reads zero instead of silently falling
back to one page's traffic. CSV export still has no collection parameter — logged as **B20**.

**Delete a page.** Admin-only, the typed handle must match the target row, and the page named in the
address bar refuses to delete itself (it would pull the dashboard out from under the click). Children
are removed child-first — `link_clicks`, `page_views`, `subscribers`, `links`, then `creators` —
because `sql/schema.sql` declares `on delete cascade` but this database has been hand-patched more
than once. Uploaded media is deliberately left in the bucket. This unblocks removing the duplicate
`/jaero_yt` page, which **has not been done yet**.

**Proof status: CODE only.** There is no typecheck or CI (B14) and the Vercel result for these
commits has not been inspected. Nothing in this session is LIVE-verified.

Also settled this session, from the client's four reference screenshots (read as chat attachments):

- **B13 closed.** The reference "New collection" dialog is just **Name + Redirect url**, with
  "When someone from a blocked country visits your page, you can redirect them here." Nothing
  per-platform. Reference Analytics has a **"Filter on collection"** dropdown. So a collection is a
  group of pages + one optional redirect + an analytics filter; per-country destination swaps stay
  **per link**. Both halves are now built.
- FanplaceFinder is gone from the reference (moved to aicreatormarketplace.com) — nothing to build.
- Reference Analytics confirms Mediums + Events tiles are expected (B12 stands).
- Reference Users table: ID, Name, Email (verified tick), Role, Created At; no delete control visible
  — ours now has one anyway, because the duplicate page cannot be removed any other way.
- The rachelfit email collector is a **fixed centred card** with First Name + Email pill fields —
  answers half of the A24 sizing question.
- Client's own editor screenshot shows crop reading real values (50% / 18% / 100%), so "crop reads 0"
  is not reproducing here; awaiting confirmation.

## 2026-09-26 (morning) — audit, benchmark recovery, memory system

- Located the plan of record: the client supplied `project landr.zip` (24 step PDFs + 24 TEST
  checklists + guide, playbook, handoff, schema, July code snapshot). It had **never** existed in
  the chat export — only references to it — so no status document existed anywhere before today.
- Walked all 18 turns of the 22/25 Aug archive and folded the added scope into `PROGRESS.md` Part 2
  (A1–A30).
- Re-audited the repo at `bb021b79`. Confirmed the dashboard **does** have a real auth gate in
  `layout.tsx` (earlier suspicion retracted), and found two P0 holes it does not cover: the
  unauthenticated CSV export route (B1) and the unauthorized editor server actions (B2).
- Confirmed no `utm/`, `qr/`, `schedule/`, `experiments/`, `broadcast/` routes and no consent
  banner, which settles Steps 14, 17, 18, 20, 21, 23, 24 as NOT STARTED.
- Created this `memory/` system. No application code changed in this block — see the afternoon entry.

## 2026-09-23 — verification pass

- `main` still `bb021b79`; no commits since 25 Aug. Corrected an earlier commit reconstruction:
  `408a70a3`, `f08062f5`, `da3b71f6` sit between the red build `a665502` and `cb9de3e8`.

## 2026-09-03 — infra rescue

- Found the Supabase project **paused** (`INACTIVE`) after ~3 weeks idle — `/ava` had been serving
  database errors to real visitors. `restore_project` succeeded and queries were re-verified.
- Took real `count(*)` figures (see `STATE.md`): page_views 120 → 206 with link_clicks unchanged
  at 51, i.e. 86 new views and zero clicks in that window.
- Corrected the "cookie is guessable" claim: `accounts.id` is a v4 uuid.

## 2026-08-25 — the last code session (5 commits, head `bb021b79`)

| SHA | What |
| --- | --- |
| `630aae7a` | analytics: clicked-nothing rate, per-link click rate, CSV export for views/clicks/links |
| `0630e185` | ui: tapped button or link dims and stops accepting repeat taps, site-wide |
| `48035557` | auth: dashboard requires a login, models only see their own pages, signin links to signup |
| `c7ffcc12` | geo: blocked countries see the normal page with swapped link destinations, redirect now optional |
| `bb021b79` | background: zoom below 100%, desktop-shaped crop preview, recentre button, clearer labels |

- Earlier in the same run: `617bc430`, `e68df265`, `db437455`, `3402a6e4`, `61d1280c`, and the
  red build `a665502` followed by fix-forwards `408a70a3`, `f08062f5`, `da3b71f6` → `cb9de3e8` (green).
- Session ended with A24 (visual page builder) deliberately not built and five decisions unanswered.

## 2026-08-22 — recovery session

- Repo transferred back from the `eleven-smgg` org to `eleven-smg`; Vercel↔Git reconnected (the
  root cause of every failed build).
- PR #1 merged at `96ec5755`; two writes had accidentally landed on
  `restore/editor-embeds-and-schema` (`549239c7`) rather than `main` — nothing was ever lost.
- Migrations restored the columns the code expected, fixing the `/ava` 404 (Postgres 42703).
- Homepage built; visitor tracking, icon upload, collections, world-tier geoblocking agreed.
