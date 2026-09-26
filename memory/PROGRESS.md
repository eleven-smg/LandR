# LandR — Progress Benchmark

**Plan of record:** the 24-step pack from `project landr.zip`. Added scope from the chat sessions
is Part 2. No other roadmap.

**Last verified:** 2026-09-26 against `main @ ef1d6386` (last application-code commit of the 26 Sep
session; memory commits landed after it). Schema facts in `STATE.md` are live-verified as of 26 Sep;
row counts still date from 3 Sep.

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
| 7 | Geoblocking & Smart Routing | DONE | CODE | Rewritten three times. Flagged countries see the normal page, only per-link destinations change; redirect demoted to an option. Rotation uses the atomic `next_rotation_index()`. The free-text rule box was replaced 26 Sep by `edit/CountryRules.tsx` (F16) and the tab renamed **Country rules** (F17). Since `62c8463d` the resolution order in `/go/[id]` is **per-link rule → collection destination → rotation → link default** (see C4). CODE only. |
| 8 | Custom Domain (+ per-creator subdomains) | NOT STARTED | NONE | Still on `alandr.vercel.app`. Pack flags subdomains may need a paid Vercel plan; Hobby is non-commercial. |
| 9 | Multi-Client (scoped client logins + Clients overview) | DONE | CODE | **Re-architected twice.** An `accounts` table with `role` (`admin`/`model`/`creator`) replaced the pack's shared env password; then the 26 Sep creator work added a creator home, `creator_clients`, compare-models, the work claim and the rebuilt Team tab (C1–C7, the last of them F23). Gate lives in `app/dashboard/[handle]/layout.tsx`; every server action and the export route gate themselves too (F10–F12). Never tested with a second real account. |
| 10 | Deeper Analytics (top countries + richer dashboard) | DONE | LIVE | Rebuilt on real visitor data: unique visitors, sessions, clicked-nothing, time on page, entry/exit, languages, screens, countries, "which link earns". "Filter on collection" added 26 Sep (F14, CODE) and scoped to the viewer the same day (F24). |
| 11 | Public Self-Serve Sign-Up | DONE | LIVE | **Deviation:** route is `/register`, not `/signup`; writes `accounts` + a `creators` page. One extra page `/jaero_yt` exists from a test (F13) and can now be deleted from Team. |
| 12 | Rotate Your Secret Keys | CANCELLED | — | Client declined outright (22 Aug, restated later). Keys leaked into the chat archive and the handoff PDF remain live. Do not raise again; recorded in `DECISIONS.md`. |
| 13 | Analytics Date-Range Picker | DONE | LIVE | **Deviation:** Day / Week / Month / Year tabs instead of 7 / 30 / 90 / All time. |
| 14 | Best-Time-to-Post Heatmap (7×24) | NOT STARTED | NONE | No heatmap in `app/dashboard/[handle]/page.tsx`. |
| 15 | Traffic Sources Table (views, clicks & CTR) | PARTIAL | LIVE | Referrer/source breakdowns and per-link click rate shipped; the **Mediums** and **Events** tiles still render "not built yet" because UTM capture and an events table do not exist (blocks on A18/Step 18). The reference dashboard shows both tiles, so B12 stands. |
| 16 | CSV Export | PARTIAL | CODE | **Deviation:** shipped 3 exports (views, clicks, per-link) via `dashboard/[handle]/export/route.ts`, 20k row cap. The pack's **subscribers CSV is still missing**; the collection filter is now carried into the download and each row names its page (F25). The route was unauthenticated (B1) — fixed 26 Sep by `d56f5952`, logged as F10. |
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
| A6 | Geoblocking by world tiers (1st/2nd/3rd) with select/deselect | DONE | CODE | 22 Aug 10:55 PM → `lib/countryGroups.ts`. The tiers were unused by the per-link UI until `ca011598` wired `TIERS` into the new scope dropdown (F16). |
| A7 | Link Rotation UI (rotation groups, dropdown) | DONE | LIVE | 22 Aug 10:55 PM |
| A8 | Remove the duplicated geoblocking section from the editor | DONE | CODE | 22 Aug 10:55 PM |
| A9 | Collections concept corrected (group pages) | DONE | CODE | 22 Aug 10:55 PM — settled twice: 26 Sep morning (a collection groups **your own** pages + an analytics filter, F14) and 26 Sep afternoon (what the group can actually *do* — see C4/C5, F18). |
| A10 | Embed arrangement templates, ~5 layouts, Instagram-picker style | DONE | LIVE | 25 Aug 3:39 AM → 6 layouts shipped |
| A11 | Section ordering — drag whole sections (header, socials, buttons, subscribe, videos, embeds) | DONE | LIVE | 25 Aug 3:39 AM |
| A12 | "Template" means the **whole page look**, not the background; 4 templates total | DONE | LIVE | 25 Aug 4:18 PM / 4:58 PM → Classic photo, Spotlight, Mosaic, Glass sheet |
| A13 | Background photo crop/zoom/placement; zoom below 100%; desktop-shaped preview; Recentre | DONE | LIVE | 25 Aug 3:39 AM → 6:57 PM |
| A14 | Replacing a background/icon must delete the old file (stale image bug) | DONE | LIVE | 25 Aug 4:18 PM → unique filenames + old-file deletion |
| A15 | Profile photo tap-to-crop, parity with background | DONE | CODE | 25 Aug 4:58 PM → `saveAvatarFocus` |
| A16 | Editable email-subscribe style | DONE | CODE | 25 Aug 4:18 PM → `landr_templates_focal_point_subscribe_styles` migration |
| A17 | Tidier, more compact page editor (collapse the embeds area) | PARTIAL | CODE | 25 Aug 3:39 AM / 4:18 PM — some compaction done, never signed off by the client |
| A18 | Site-wide tap feedback: tapped control dims and locks; progress bar; hover/focus states | DONE | LIVE | 25 Aug 4:18 PM / 4:58 PM — the first implementation (`0630e185`) broke clicks site-wide; fixed 26 Sep by `923ca5d3` (F9) |
| A19 | Save button must show unsaved → saving → saved, and values must stop reverting | DONE | LIVE | 25 Aug 4:18 PM (3b) → controlled fields + 4-state button |
| A20 | Live drag reorder instead of up/down arrows (overshoot bug) | DONE | LIVE | 25 Aug 4:58 PM |
| A21 | Smart deep linking, default on | DONE | LIVE | 25 Aug 4:18 PM → `lib/deeplink.ts`. Per-link overrides still missing (B7) |
| A22 | Rename "Bounce Rate" → "visits that clicked nothing", measured per session | DONE | LIVE | 25 Aug 6:57 PM |
| A23 | Case-insensitive handles (`/Ava` broke on Android auto-capitalise) | DONE | LIVE | 25 Aug — all four lookups now `ilike` |
| **A24** | **Visual page builder — whole-page WYSIWYG canvas: drag *and resize* profile photo, email collector, every element; sizes saved per page** | **NOT STARTED** | NONE | 25 Aug 6:57 PM. **Biggest remaining item.** Supersedes Step 6's scope. Reference answers the email collector (fixed centred card); profile-photo and canvas semantics still open. |
| A25 | Session hardening (random token, rotation, revocation, `secure` flag) | NOT STARTED | NONE | 25 Aug 6:57 PM → now bugs B3/B4 |
| A26 | This tracking checklist / persistent memory | DONE | LIVE | Promised 22 Aug 10:01 PM, delivered 26 Sep 2026 |
| A27 | Local dev on Windows (`C:\\Users\\Devine\\Documents\\landr`) | CANCELLED | — | That machine is gone; Vercel is the only compiler |
| A28 | NSFW / 18+ warning | CANCELLED | — | Client dropped it (25 Aug 3:39 AM). Never raise again |
| A29 | Create ten model pages/accounts for the agency | CANCELLED | — | Client: not our job, the platform only has to *allow* ~10 (25 Aug 4:58 PM) |
| A30 | Delete the stale `restore/editor-embeds-and-schema` branch | NOT STARTED | NONE | Client agreed 22 Aug 10:01 PM; branch still exists at `549239c7` |

**Reference products the client is benchmarking against:** `tapforallmylinks.com`,
`lander.launchyoursocials.com/signin`, and the "rachelfit" bio-page style (now the Spotlight template).
FanplaceFinder no longer exists in the reference product — nothing to build for it.

---

## Part 2b — creator / model architecture (agreed 26 Sep, after Part 2 was written)

| ID | Item | Status | Proof | Notes |
| --- | --- | --- | --- | --- |
| C1 | **Creator account role + creator home at `/dashboard`** listing every model he manages; one dashboard still = one model. A model with one page and no team links is redirected straight to her own dashboard | DONE | CODE | `dc8abf22`, `app/dashboard/page.tsx`. Migration `creator_accounts_and_client_links` |
| C2 | **`creator_clients` management link** — the model always owns her page; a creator's reach is a row, never ownership. Model-invited → she disconnects instantly; creator-created → release request he approves | DONE | CODE | `app/dashboard/actions.ts` |
| C3 | **Compare models** — pick any subset and compare them | DONE | CODE | `b372ead1`, `/dashboard/compare` |
| C4 | **Collection country destinations** — per-platform URLs for flagged-country visitors, matched on `links.collection_key` or the link's own destination host; own switch | DONE | CODE | `62c8463d` + `e24c44c2`. Closes F18 |
| C5 | **Campaign takeover** — one URL that sends every visitor to the group's pages straight out, logged first, never under `?preview=1`; own switch | DONE | CODE | `e24c44c2` + `960b1c5c` |
| C6 | **Who does the work (work claim)** — creator declares at accept, model approves, approved claim replaces her instant Disconnect with Request release | DONE | CODE | Migration `creator_clients_work_claim` + `af3d3fba` + `78af4f8b`. Closes B24 → F22 |
| C7 | **Team tab rebuilt** — admin keeps workspace account management; a model or creator gets pending work claims, her connected creators with the right release control, an invite box and her own login card | DONE | CODE | `b6491197`. Closes B22 → F23. The **admin branch is LIVE** (confirmed from the client's saved capture of `/dashboard/ava/users`); the owner/model branch needs a model login. "Delete a page" deliberately stayed inside the admin branch instead of moving to its own route. Residual: the relationship buttons redirect to `/dashboard` after acting (B25) |

---

## Part 3 — where we are and what is next

**26 Sep 2026 was the first code session since 25 Aug**, and it ran in five blocks: the site-wide
tap/click bug (F9) and the authorization sweep (F10–F12); the reference-driven UI work (F14–F17);
the creator/model architecture (C1–C3); the client's 12:15 list — favicon (F20), the sign-in autofill
scare (F19, never a leak), collections that actually do something (F18/F21, C4–C5) and the work claim
(F22, C6); then the Team tab (F23, C7), the placeholder sweep and the collection scope leak
(F24/F25). Migrations are DB-verified and the Team tab's admin view was seen rendering live; **every
other line of code is CODE proof only** — there is a typecheck workflow but no tool here can read its
result (B14), and the deploy has not been walked.

**Queue, in order:**

1. ~~P0 security fixes, tap bug, country rules, collections filter, delete-a-page~~ — **done** 26 Sep
   (F9–F17).
2. ~~Creator accounts, creator home, compare models~~ — **done** 26 Sep (C1–C3).
3. ~~Collections: make the destination real; favicon; sign-in autofill; work claim~~ — **done**
   26 Sep (F18–F22, C4–C6).
4. ~~C7 / B22 — rebuild the Team tab~~ — **done** 26 Sep (F23, `b6491197`); admin half LIVE.
5. ~~B21 + B20 — scope the collection dropdown, teach the CSV export the filter~~ — **done** 26 Sep
   (F24/F25, `a4cb67ea` + `341c4192`), both now behind one helper.
6. **Verify on the deploy.** Nothing except the Team tab's admin view has been clicked: favicon,
   empty password field, a country rule, the collection filter **and a collection CSV**, one page
   deletion, creator home, compare, the three collection behaviours, an accept-with-claim → approve
   → blocked disconnect, and the Team tab on a model login.
7. Delete the duplicate `/jaero_yt` page (possible in the product since F15, still not done).
8. **B23** `.nav-current` has no rule in `dashboard.css`; **B25** Team tab actions redirect off the
   tab; **B19** residual "blocked" copy sweep. Three small ones, best taken together.
9. **Infra** — move Supabase off the free tier (B8: the project auto-paused and the live page served
   database errors for ~3 weeks).
10. **A24 visual page builder** — the biggest item; still blocked on the profile-photo resize and
    canvas decisions in `DECISIONS.md`.
11. **A25 / B3 / B4 session + password hardening** — required before ten real model logins exist.
12. **Finish the partials:** Step 15 (needs Step 18 UTM), Step 16 (subscribers CSV), Step 19
    (filter on `starts_at`/`ends_at`), Step 22 (write `signup_log`, add rate limit), A17 editor
    compaction.
13. **Then the untouched steps:** 14, 17, 18, 20, 21, 23, 24, and 8 when a domain is bought.
14. Housekeeping: A30 delete the stale branch; B5 regenerate `sql/schema.sql` from the live database.
15. Only after LandR is done: `eleven-smg/chatterdesk`.
