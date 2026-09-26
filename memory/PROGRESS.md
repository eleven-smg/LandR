# LandR — Progress Benchmark

**Plan of record:** the 24-step pack from `project landr.zip`. Added scope from the chat sessions
is Part 2. No other roadmap.

**Last verified:** 2026-09-26 against `main @ bb021b79` (25 Aug 2026), plus the live Supabase
project and the 22/25 Aug chat archive.

**Status:** `DONE` · `PARTIAL` · `NOT STARTED` · `CANCELLED`
**Proof:** `LIVE` = verified in production or in the database · `CODE` = in the repo, never
exercised by a real user · `NONE`

---

## Part 1 — the 24 planned steps

| # | Step (pack title) | Status | Proof | Notes / deviation |
| --- | --- | --- | --- | --- |
| 1 | Reliable Embeds + Layout Options | DONE | LIVE | `app/[handle]/EmbedShowcase.tsx`. Shipped 6 layouts (Stack, Carousel, Deck, Deck vertical, Picker grid, Spotlight) vs the pack's smaller set. Open bug B6: the X/Twitter embed renders "Tweet not found". |
| 2 | Email Subscribe Capture | DONE | CODE | `app/[handle]/SubscribeForm.tsx`, `subscribers` table, Subscribers card in the editor, `show_subscribe` on for Ava. **0 subscribers ever** — never exercised by a real visitor. |
| 3 | Video Uploads | DONE | CODE | Upload-video control per link in the editor; `media` bucket. No real client upload confirmed. |
| 4 | Backgrounds (image/video picker + 4th theme) | DONE | LIVE | Exceeded: 4 themes (`noir`, `blush`, `aurora`, `gold`) **and** 4 whole-page templates. Background crop/zoom added later (A13). |
| 5 | Button Polish (preview image + size) | DONE | CODE | Per-link preview image, size (`md`), shape (`pill`), colour, subtitle in `edit/page.tsx`. |
| 6 | Visual Builder (drag reorder & resize) | PARTIAL | LIVE | `edit/Builder.tsx` does the **pack** scope (link buttons, phone-width preview, S/M/L). The client then redefined "visual builder" as a whole-page canvas — tracked separately as **A24, not started**. |
| 7 | Geoblocking & Smart Routing | DONE | LIVE | Rewritten twice. Now "Countries treated differently": blocked countries see the normal page, only per-link destinations change; redirect demoted to an option. Rotation uses the atomic `next_rotation_index()`. Open mismatch B13 (collections semantics). |
| 8 | Custom Domain (+ per-creator subdomains) | NOT STARTED | NONE | Still on `alandr.vercel.app`. Pack flags subdomains may need a paid Vercel plan; Hobby is non-commercial. |
| 9 | Multi-Client (scoped client logins + Clients overview) | DONE | CODE | **Re-architected:** an `accounts` table with `role` (`admin`/`model`) + Users tab, instead of the pack's `creators.dashboard_password` + shared env password. Auth gate lives once in `app/dashboard/[handle]/layout.tsx`. Never tested with a second real account. |
| 10 | Deeper Analytics (top countries + richer dashboard) | DONE | LIVE | Rebuilt on real visitor data: unique visitors, sessions, clicked-nothing, time on page, entry/exit, languages, screens, countries, "which link earns". |
| 11 | Public Self-Serve Sign-Up | DONE | LIVE | **Deviation:** route is `/register`, not `/signup`; writes `accounts` + a `creators` page. One unidentified extra account exists (see `STATE.md`). |
| 12 | Rotate Your Secret Keys | CANCELLED | — | Client declined outright (22 Aug, restated later). Keys leaked into the chat archive and the handoff PDF remain live. Do not raise again; recorded in `DECISIONS.md`. |
| 13 | Analytics Date-Range Picker | DONE | LIVE | **Deviation:** Day / Week / Month / Year tabs instead of 7 / 30 / 90 / All time. |
| 14 | Best-Time-to-Post Heatmap (7×24) | NOT STARTED | NONE | No heatmap in `app/dashboard/[handle]/page.tsx`. |
| 15 | Traffic Sources Table (views, clicks & CTR) | PARTIAL | LIVE | Referrer/source breakdowns and per-link click rate shipped; the **Mediums** and **Events** tiles still render "not built yet" because UTM capture and an events table do not exist (blocks on A18/Step 18). |
| 16 | CSV Export | PARTIAL | CODE | **Deviation:** shipped 3 exports (views, clicks, per-link) via `dashboard/[handle]/export/route.ts`, 20k row cap. The pack's **subscribers CSV is missing**. Route is also unauthenticated — bug B1. |
| 17 | Live Visitor Counter ("N online now") | NOT STARTED | NONE | — |
| 18 | UTM Link Builder (`/dashboard/[handle]/utm`) | NOT STARTED | NONE | No `utm/` route. Also blocks Step 15's Mediums tile. |
| 19 | Scheduled & Expiring Links | PARTIAL | CODE | `starts_at` / `ends_at` columns exist; **nothing filters on them** and there is no `schedule/` UI. |
| 20 | A/B Testing (variant performance) | NOT STARTED | NONE | No `experiments/` route. Depends on Step 7 rotation, which is built. |
| 21 | QR Code | NOT STARTED | NONE | No `qr/` route. Pack's third-party QR service must be replaced with local generation (see `DECISIONS.md`). |
| 22 | Signup Guardrails (rate-limit + reserved handles) | PARTIAL | CODE | Reserved handles + handle sanitising + duplicate email/handle checks are in `app/register/actions.ts`. **No rate limiting:** the `signup_log` table and its IP index exist but nothing writes to them (0 rows). |
| 23 | Cookie / Consent Banner | NOT STARTED | NONE | No consent component anywhere in `app/`. |
| 24 | Email Broadcast (Resend) | NOT STARTED | NONE | No `broadcast/` route, no Resend integration or env vars. |

**Pack totals:** 12 DONE · 5 PARTIAL · 6 NOT STARTED · 1 CANCELLED.

---

## Part 2 — added scope agreed in chat (not in the 24-step pack)

Walked turn by turn through the 22 Aug and 25 Aug archive. Source = the turn that requested it.

| ID | Item | Status | Proof | Source |
| --- | --- | --- | --- | --- |
| A1 | Move repo back from `eleven-smgg` org to `eleven-smg`, reconnect Vercel↔Git | DONE | LIVE | 22 Aug 8:13–8:52 PM |
| A2 | Real homepage at `/` (did not exist) | DONE | LIVE | 22 Aug 9:54 PM |
| A3 | Fill Ava's blank position-7 link; turn `show_subscribe` on | DONE | LIVE | 22 Aug 8:29 PM |
| A4 | Real visitor tracking: visitor cookie, session id, duration heartbeat, language, screen | DONE | LIVE | 22 Aug 10:55 PM / 25 Aug 3:39 AM |
| A5 | Icon upload field (file **or** pasted URL) + add-link section | DONE | LIVE | 22 Aug 10:55 PM |
| A6 | Geoblocking by world tiers (1st/2nd/3rd) with select/deselect | DONE | LIVE | 22 Aug 10:55 PM → `lib/countryGroups.ts` |
| A7 | Link Rotation UI (rotation groups, dropdown) | DONE | LIVE | 22 Aug 10:55 PM |
| A8 | Remove the duplicated geoblocking section from the editor | DONE | CODE | 22 Aug 10:55 PM |
| A9 | Collections concept corrected (group pages) | DONE | LIVE | 22 Aug 10:55 PM — but see **B13**: the client's intended meaning (per-collection link destination swaps for blocked countries) is still not what is built |
| A10 | Embed arrangement templates, ~5 layouts, Instagram-picker style | DONE | LIVE | 25 Aug 3:39 AM → 6 layouts shipped |
| A11 | Section ordering — drag whole sections (header, socials, buttons, subscribe, videos, embeds) | DONE | LIVE | 25 Aug 3:39 AM |
| A12 | "Template" means the **whole page look**, not the background; 4 templates total | DONE | LIVE | 25 Aug 4:18 PM / 4:58 PM → Classic photo, Spotlight, Mosaic, Glass sheet |
| A13 | Background photo crop/zoom/placement; zoom below 100%; desktop-shaped preview; Recentre | DONE | LIVE | 25 Aug 3:39 AM → 6:57 PM |
| A14 | Replacing a background/icon must delete the old file (stale image bug) | DONE | LIVE | 25 Aug 4:18 PM → unique filenames + old-file deletion |
| A15 | Profile photo tap-to-crop, parity with background | DONE | CODE | 25 Aug 4:58 PM → `saveAvatarFocus` |
| A16 | Editable email-subscribe style | DONE | CODE | 25 Aug 4:18 PM → `landr_templates_focal_point_subscribe_styles` migration |
| A17 | Tidier, more compact page editor (collapse the embeds area) | PARTIAL | CODE | 25 Aug 3:39 AM / 4:18 PM — some compaction done, never signed off by the client |
| A18 | Site-wide tap feedback: tapped control dims and locks; progress bar; hover/focus states | DONE | LIVE | 25 Aug 4:18 PM / 4:58 PM |
| A19 | Save button must show unsaved → saving → saved, and values must stop reverting | DONE | LIVE | 25 Aug 4:18 PM (3b) → controlled fields + 4-state button |
| A20 | Live drag reorder instead of up/down arrows (overshoot bug) | DONE | LIVE | 25 Aug 4:58 PM |
| A21 | Smart deep linking, default on | DONE | LIVE | 25 Aug 4:18 PM → `lib/deeplink.ts`. Per-link overrides still missing (B7) |
| A22 | Rename "Bounce Rate" → "visits that clicked nothing", measured per session | DONE | LIVE | 25 Aug 6:57 PM |
| A23 | Case-insensitive handles (`/Ava` broke on Android auto-capitalise) | DONE | LIVE | 25 Aug — all four lookups now `ilike` |
| **A24** | **Visual page builder — whole-page WYSIWYG canvas: drag *and resize* profile photo, email collector, every element; sizes saved per page** | **NOT STARTED** | NONE | 25 Aug 6:57 PM. Deliberately stopped pending decisions. **Biggest remaining item.** Supersedes Step 6's scope. |
| A25 | Session hardening (random token, rotation, revocation, `secure` flag) | NOT STARTED | NONE | 25 Aug 6:57 PM → now bugs B3/B4 |
| A26 | This tracking checklist / persistent memory | DONE | LIVE | Promised 22 Aug 10:01 PM, delivered 26 Sep 2026 |
| A27 | Local dev on Windows (`C:\Users\Devine\Documents\landr`) | CANCELLED | — | That machine is gone; Vercel is the only compiler |
| A28 | NSFW / 18+ warning | CANCELLED | — | Client dropped it (25 Aug 3:39 AM). Never raise again |
| A29 | Create ten model pages/accounts for the agency | CANCELLED | — | Client: not our job, the platform only has to *allow* ~10 (25 Aug 4:58 PM) |
| A30 | Delete the stale `restore/editor-embeds-and-schema` branch | NOT STARTED | NONE | Client agreed 22 Aug 10:01 PM; branch still exists at `549239c7` |

**Reference products the client is benchmarking against:** `tapforallmylinks.com`,
`lander.launchyoursocials.com/signin`, and the "rachelfit" bio-page style (now the Spotlight template).

---

## Part 3 — where we are and what is next

**Last session (25 Aug 2026) ended mid-flow:** it shipped five commits, then listed A24 as the next
block and asked five decisions. No code has been pushed since. Nothing is half-committed — the
repo is consistent at `bb021b79`.

**Queue, in order:**

1. **P0 security fixes** — `BUGS.md` B1 + B2. Real client analytics and page data are exposed
   today. One commit, ~30 min. *Awaiting client go-ahead.*
2. **Infra** — move Supabase off the free tier (B8: the project auto-paused and the live page
   served database errors for ~3 weeks).
3. **A24 visual page builder** — blocked on the four open decisions in `DECISIONS.md`.
4. **A25 / B3 / B4 session + password hardening** — required before ten real model logins exist.
5. **Finish the partials:** Step 15 (needs Step 18 UTM), Step 16 (subscribers CSV), Step 19
   (filter on `starts_at`/`ends_at`), Step 22 (write `signup_log`, add rate limit).
6. **Then the untouched steps:** 14, 17, 18, 20, 21, 23, 24, and 8 when a domain is bought.
7. **B13** — settle whether collections own the per-country link swaps, then align the UI copy.
8. Only after LandR is done: `eleven-smg/chatterdesk`.
