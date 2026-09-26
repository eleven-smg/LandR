# LandR — session log

Append one entry per working session, newest first. Always record commit SHAs.

---

## 2026-09-26 — audit, benchmark recovery, memory system

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
- Created this `memory/` system. **No application code changed.**

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
