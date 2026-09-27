# LandR — Progress Benchmark

**Plan of record:** the 24-step pack from `project landr.zip`. Added scope from the chat sessions
is Part 2. No other roadmap.

**Last verified:** 2026-09-27 against `main @ 762b05a1` (Step 23 consent banner). Schema facts and
**row counts** in `STATE.md` were re-read live on 27 Sep — the Supabase MCP server is connected and
working (`execute_sql` and `apply_migration` both exercised today), which retires the "no database
reads since Block 4" limit that qualified every line of this file on 26 Sep.

**Status:** `DONE` · `PARTIAL` · `NOT STARTED` · `CANCELLED`
**Proof:** `LIVE` = verified in production or in the database · `CODE` = in the repo, never
exercised by a real user · `NONE`

---

## Part 1 — the 24 planned steps

| # | Step (pack title) | Status | Proof | Notes / deviation |
| --- | --- | --- | --- | --- |
| 1 | Reliable Embeds + Layout Options | DONE | LIVE | `app/[handle]/EmbedShowcase.tsx`. Shipped 6 layouts (Stack, Carousel, Deck, Deck vertical, Picker grid, Spotlight) vs the pack's smaller set. Open bug B6: the X/Twitter embed renders "Tweet not found". |
| 2 | Email Subscribe Capture | DONE | CODE | `app/[handle]/SubscribeForm.tsx`, `subscribers` table, Subscribers card in the editor, `show_subscribe` on for Ava. **0 subscribers ever** — never exercised by a real visitor. The missing unsubscribe path (B26) was closed 27 Sep by F33, and a new subscriber can now be sent a welcome email (D2, off by default). |
| 3 | Video Uploads | DONE | CODE | Upload-video control per link in the editor; `media` bucket. No real client upload confirmed. |
| 4 | Backgrounds (image/video picker + 4th theme) | DONE | LIVE | Exceeded: 4 themes (`noir`, `blush`, `aurora`, `gold`) **and** 4 whole-page templates. Background crop/zoom added later (A13). |
| 5 | Button Polish (preview image + size) | DONE | CODE | Per-link preview image, size (`md`), shape (`pill`), colour, subtitle in `edit/page.tsx`. |
| 6 | Visual Builder (drag reorder & resize) | PARTIAL | LIVE | `edit/Builder.tsx` does the **pack** scope (link buttons, phone-width preview, S/M/L). The client then redefined "visual builder" as a whole-page canvas — tracked separately as **A24, not started**. |
| 7 | Geoblocking & Smart Routing | DONE | CODE | Rewritten three times. Flagged countries see the normal page, only per-link destinations change; redirect demoted to an option. Rotation uses the atomic `next_rotation_index()`. The free-text rule box was replaced 26 Sep by `edit/CountryRules.tsx` (F16) and the tab renamed **Country rules** (F17). Since `62c8463d` the resolution order in `/go/[id]` is **per-link rule → collection destination → rotation → link default** (see C4); `dea5395b` put the schedule check ahead of all four, and `882ffea9` put UTM tagging after all of them, where it cannot change routing. CODE only. |
| 8 | Custom Domain (+ per-creator subdomains) | NOT STARTED | NONE | Still on `alandr.vercel.app`. Pack flags subdomains may need a paid Vercel plan; Hobby is non-commercial. |
| 9 | Multi-Client (scoped client logins + Clients overview) | DONE | CODE | **Re-architected twice.** An `accounts` table with `role` (`admin`/`model`/`creator`) replaced the pack's shared env password; then the 26 Sep creator work added a creator home, `creator_clients`, compare-models, the work claim and the rebuilt Team tab (C1–C7, the last of them F23). Gate lives in `app/dashboard/[handle]/layout.tsx`; every server action and the export route gate themselves too (F10–F12). Never tested with a second real account. |
| 10 | Deeper Analytics (top countries + richer dashboard) | DONE | LIVE | Rebuilt on real visitor data: unique visitors, sessions, clicked-nothing, time on page, entry/exit, languages, screens, countries, "which link earns". "Filter on collection" added 26 Sep (F14, CODE) and scoped to the viewer the same day (F24). |
| 11 | Public Self-Serve Sign-Up | DONE | LIVE | **Deviation:** route is `/register`, not `/signup`; writes `accounts` + a `creators` page. Rate-limited since `d721982b` (F29). The one test page `/jaero_yt` is a real registration, not a duplicate of `/ava` — re-checked 27 Sep, `creators` holds exactly two rows. |
| 12 | Rotate Your Secret Keys | CANCELLED | — | Client declined outright (22 Aug, restated later). Keys leaked into the chat archive and the handoff PDF remain live. Do not raise again; recorded in `DECISIONS.md`. |
| 13 | Analytics Date-Range Picker | DONE | LIVE | **Deviation:** Day / Week / Month / Year tabs instead of 7 / 30 / 90 / All time. |
| 14 | Best-Time-to-Post Heatmap (7×24) | DONE | CODE | Shipped 27 Sep, `0c09ec5f`. **Deviation: it has its own dashboard tab, "Best time"** (`app/dashboard/[handle]/heatmap/`), not a tile on the analytics page — that page is already 24 KB and a 7×24 grid needs the full width. `page.tsx` (server, `force-dynamic`) reads `created_at` from `page_views` and `link_clicks` for the last 90 days with a 5,000-row cap per table; `Heatmap.tsx` (client) draws the grid with a **Page views / Link clicks** toggle, names the three busiest slots in a plain sentence, and prints the tz and cap notes. **Hours are bucketed in the viewer's own browser clock**, so the answer means what a person reading it thinks it means; the grid therefore renders empty on the server and fills in a `useEffect`, which is the hydration-safe pattern from Step 19. No migration. Honest empty state when there is nothing to show — Ava's 229 views will make a thin grid, and it says so rather than implying a best hour. |
| 15 | Traffic Sources Table (views, clicks & CTR) | PARTIAL | LIVE | Referrer/source breakdowns and per-link click rate shipped; the **Mediums** and **Events** tiles still render "not built yet". Step 18 did **not** close this: today's tagging is applied to links leaving LandR, so it populates the client's own destination analytics, not ours. Our Mediums tile needs `utm_*` read from **incoming** visitor URLs into `page_views`, and Events needs an events table. B12 stands. |
| 16 | CSV Export | DONE | CODE | Four exports via `dashboard/[handle]/export/route.ts`, 20k row cap: views, clicks, per-link, and the pack's **subscribers list**, added 26 Sep by `5abd8b6f` (F30). All four follow the collection filter and name each row's page (F25). The subscribers CSV **ignores the date tabs on purpose** — a mailing list cut to seven days looks complete and is not — so it downloads the whole list, the screen says so, and its filename carries no range. Unsubscribes are exported and marked, which is how B26 was found; since F33 that column finally has a writer. The route was unauthenticated (B1) — fixed 26 Sep by `d56f5952`, logged as F10. |
| 17 | Live Visitor Counter ("N online now") | DONE | CODE | Shipped 27 Sep, `1ebde424`, on the same **Best time** tab as Step 14. `app/api/online/route.ts` (GET `?handle=`) is **gated by `requireDashboardAccess`** — a route handler runs no layout, so it gates itself (F12's rule) — reads the last 30 minutes of `page_views`, counts a session present when `created_at + duration_seconds` reaches within 5 minutes of now, dedupes on `session_id` then `visitor_id`, and sends `Cache-Control: no-store`. On a read error it returns `online: null`, never a zero that would read as a fact. `heatmap/OnlineNow.tsx` polls every 20 s, shows nothing until the first reply rather than a flash of "0", and uses plain wording when nobody is there. No migration. **Consent interacts with this since Step 23:** with the notice on, a visitor who has not accepted sends no duration ping, so they appear for the first five minutes only. |
| 18 | UTM Link Builder (`/dashboard/[handle]/utm`) | DONE | CODE | **Deviation, and it is the whole point of the step's redesign:** there is no `/utm` builder route that hands back a string to copy. The client's links already live in LandR, so tagging is a setting, not a tool — one switch plus source / medium / campaign in the editor ("Campaign tags on your links"), and `/go/[id]` tags every outgoing destination itself. Shipped 27 Sep: migration `utm_tagging_settings` (`creators` += `utm_enabled` bool default false, `utm_source`, `utm_medium`, `utm_campaign`) and `882ffea9` — `lib/utm.ts` (`utmValue` sanitiser, `applyUtm`), `saveUtm` in `edit/actions.ts`, the editor card, and `/go/[id]` fetching the creator row once for handle + deep-links + the four columns. Rules: tagging runs **after** the destination is decided so it can never change routing; it **never overwrites a parameter the destination already carries**; a URL it cannot parse, or one that is not http(s), is returned untouched; source falls back to the handle, medium to `link`, and `utm_content` is the button label. Off by default. The click is logged with the tagged URL. |
| 19 | Scheduled & Expiring Links | DONE | CODE | **Both halves now shipped.** Enforcement, 26 Sep: `lib/schedule.ts` (`scheduleState`, `isLinkLive`) is the single seam — `app/[handle]/page.tsx` filters buttons, videos and embeds through it (`c78d26d2`) and `/go/[id]` refuses an out-of-window link before any other rule and **does not log a click** (`dea5395b`), because the `/go` URL is shareable and crawlable, so hiding the button alone would make "expired" mean "harder to find". Editor, 27 Sep: `d27a2897` adds `edit/ScheduleFields.tsx` (two `datetime-local` inputs, a hidden `tz_offset` taken from the browser, a plain-words sentence saying what will happen, a Clear dates button and a warning when the end is not after the start) and teaches `updateLink` to write `starts_at` / `ends_at` **only when the form carries them**, so every other save path leaves the dates alone; `533ce01a` renders the fields in the per-link form and prints a `scheduled` / `expired` tag on the row. Both bounds stay optional, every existing row still has neither, and `?preview=1` shows everything. No migration — the columns have existed since August. |
| 20 | A/B Testing (variant performance) | DONE | CODE | Shipped 27 Sep, `3aa29a12`, as its own **A/B tests** tab. **No migration, because a test already exists in the data:** a variant set is a link with `rotate = true` and its `rotation_urls`, and every click is already in `link_clicks.destination_url`. `lib/abtest.ts` holds the judgement — `canonicalUrl` strips `utm_*`, a trailing slash and case before matching, so a click that Step 18 tagged still counts for the right variant; `buildReport` refuses to call anything under **30 clicks** on a link, then a two-way z-test (`gap / sqrt(n) >= 1.96`) separates "too early" and "no clear winner" from a named winner. `experiments/page.tsx` (server, `force-dynamic`, 90 days, 5,000-row cap) draws a bar per destination, counts separately the clicks a country rule or collection destination sent outside the rotation pool, and says outright that **clicks are not conversions** — LandR cannot see what happens after the visitor leaves. Nothing to look at yet: all 8 of Ava's links have `rotate = false`, so the tab shows an empty state that explains how to start a test. |
| 21 | QR Code | NOT STARTED | NONE | No `qr/` route. Pack's third-party QR service must be replaced with local generation (see `DECISIONS.md`), and adding an npm dependency is a blind build risk while no tool here can read a build result. |
| 22 | Signup Guardrails (rate-limit + reserved handles) | DONE | CODE | Reserved handles + handle sanitising + duplicate email/handle checks are in `app/register/actions.ts`. The missing half, **rate limiting**, shipped 26 Sep as F29 (`d721982b`): `lib/signupLimit.ts` allows 3 signups per IP per hour and 8 per day, writes the long-unused `signup_log` table, and the register page explains the refusal. Fails open on a read error, by design. |
| 23 | Cookie / Consent Banner | DONE | CODE | Shipped 27 Sep, `762b05a1`. Migration `consent_banner_settings` (`creators` += `consent_banner_enabled` bool default false, `consent_banner_text`, `consent_privacy_url`). **Off by default**, so no live page changed. New `app/[handle]/layout.tsx` hangs `ConsentBanner.tsx` beside the profile, which is how the banner was added **without rewriting the 24 KB `page.tsx`**. When the notice is on, `Tracker.tsx` writes no `landr_vid` / `landr_sid` and sends no `/api/track` ping until the visitor taps Accept; accepting mid-visit starts tracking from that moment, declining leaves only the anonymous server-side view. The banner renders a hidden marker into the server HTML because Tracker sits in another part of the tree and child effects run first, so a prop or a state-dependent element would arrive too late. **Deviation:** the switch is a new **Privacy** tab, not a card in the page editor — `ProfileForm.tsx` (29.7 KB) and `edit/actions.ts` (30.7 KB) are exactly the whole-file resends that broke two builds this morning. **Known gap, printed on the screen and filed as B27:** the `page_views` row is written while the HTML is built, before anybody can answer, so views keep counting after a decline. |
| 24 | Email Broadcast (Resend) | NOT STARTED | NONE | No `broadcast/` route. **Unblocked but not buildable to LIVE:** B26 is closed (F33), and D2 built the whole sending seam — `lib/welcomeEmail.ts`, the `email_sends` log, the `List-Unsubscribe` header — so a broadcast screen is now mostly a query plus that seam. It cannot send anything until `RESEND_API_KEY` and a verified domain exist, which is the client's Wednesday list. |

**Pack totals:** 18 DONE · 2 PARTIAL · 3 NOT STARTED · 1 CANCELLED.

The three not started are Step 8 (domain, his Wednesday list), Step 21 (QR, wants an npm dependency
and no build result is readable here) and Step 24 (broadcast, needs the provider key).

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
| A17 | Tidier, more compact page editor (collapse the embeds area) | PARTIAL | CODE | 25 Aug 3:39 AM / 4:18 PM — some compaction done, never signed off by the client. The editor has gained four cards since (country rules, schedule fields, welcome email, campaign tags), so this partial is now further from done than when it was filed. Step 23 deliberately did **not** add a fifth: the consent switch went to its own Privacy tab. |
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
| C7 | **Team tab rebuilt** — admin keeps workspace account management; a model or creator gets pending work claims, her connected creators with the right release control, an invite box and her own login card | DONE | CODE | `b6491197`. Closes B22 → F23. The **admin branch is LIVE** (confirmed from the client's saved capture of `/dashboard/ava/users`); the owner/model branch needs a model login. "Delete a page" deliberately stayed inside the admin branch instead of moving to its own route. The residual redirect-off-the-tab wart (B25) was closed the same day as F27 (`d65323d7`), which also taught the tab to render `?msg` |

---

## Part 2c — mailing, uptime and the tabs built 27 Sep without the client

Everything here was chosen to need nothing from him: no spend, no DNS, no logins. None of the mailing
work can be proved LIVE until he supplies `RESEND_API_KEY` and a verified sending domain on Wednesday.

| ID | Item | Status | Proof | Notes |
| --- | --- | --- | --- | --- |
| D1 | **Unsubscribe path** — closes B26, the column nothing could write | DONE | CODE | `38ffe4cd`: `lib/unsubscribe.ts` signs `handle:email` with an HMAC keyed on `SUPABASE_SERVICE_ROLE_KEY` (no expiry — an unsubscribe link in an old email must still work years later), `app/unsubscribe/page.tsx` + `actions.ts` stamp `unsubscribed_at`. A bad or tampered token says so plainly instead of pretending to succeed. Every future send must exclude stamped rows. |
| D2 | **Welcome email on subscribe** | DONE | CODE | Migration `welcome_email_settings_and_send_log`: `creators` += five `welcome_email_*` columns; new `email_sends` table (RLS on, no policies — service role only), index `(creator_id, created_at desc)`. Code: `79c02f18` (`lib/welcomeCopy.ts`, `lib/welcomeEmail.ts`), `8a5043ef` (`subscribe()` sends **only** when the insert actually succeeded, so a duplicate address is never mailed twice; `saveProfile` guarded on `welcome_email_subject`), `e260217a` (editor section + `emailReady` flag). **Off by default on every page**, and the editor says outright that nothing can send until the key exists. Carries `List-Unsubscribe` (header only — no one-click POST, which would need an endpoint that trusts an unauthenticated mail provider). |
| D3 | **Keep-alive cron** — the free-tier pause, B8 | DONE | CODE | `c9fedb48`: `app/api/keepalive/route.ts` runs one cheap count and `vercel.json` calls it daily at `0 6 * * *`, which is what Hobby allows. This is the agreed alternative to paying for Supabase (`DECISIONS.md`). Configured, **not yet observed running** — the first proof will be the project still being awake after a quiet week. |
| D4 | Campaign tags on outgoing links | DONE | CODE | Recorded as Step 18 above. |
| D5 | Best-time heatmap and live counter on a new **Best time** tab | DONE | CODE | Recorded as Steps 14 and 17 above. Both read existing tables only — no migration, no new column, nothing for the client to switch on. |
| D6 | A/B test report on a new **A/B tests** tab | DONE | CODE | Recorded as Step 20 above. Reads `links` and `link_clicks` only — no migration. Dormant until a link has `rotate = true`. |
| D7 | Cookie notice + a new **Privacy** tab | DONE | CODE | Recorded as Step 23 above. One migration, three `creators` columns, off by default, and the one honest gap is filed as B27. |

---

## Part 3 — where we are and what is next

**26 Sep 2026 was the first code session since 25 Aug**, and it ran in nine blocks: the site-wide
tap/click bug (F9) and the authorization sweep (F10–F12); the reference-driven UI work (F14–F17);
the creator/model architecture (C1–C3); the client's 12:15 list — favicon (F20), the sign-in autofill
scare (F19, never a leak), collections that actually do something (F18/F21, C4–C5) and the work claim
(F22, C6); then the Team tab (F23, C7), the placeholder sweep and the collection scope leak
(F24/F25); the three small ones — the unstyled `.nav-current` label (F26), the Team tab throwing you
off the tab when you acted on it (F27), and the residual "blocked" copy sweep, which found its one
real survivor on the **public marketing home** (F28); the signup rate limit that closed the only
remaining P1 reachable without a database connection (F29); the **subscribers CSV** (F30), which
retired the oldest partial in the pack and turned up B26 on the way; and last **Step 19's
enforcement half** (`dea5395b` + `c78d26d2`).

**27 Sep** opened badly and then ran long. Two production builds failed inside sixteen minutes
(F31, F32) — both the same mistake, a caller shipped without its callee — which produced the hardest
rule in this project: never split a caller and its callee across commits. After that: the Supabase
MCP was found to be working all along (the earlier "not connected" report is retracted in `BUGS.md`),
which made the first database reads since 3 Sep possible; **the schedule editor** finished Step 19;
**campaign tags** closed Step 18 with a deliberate redesign; the mailing groundwork — unsubscribe,
welcome email, keep-alive — went in as D1–D3; **Steps 14 and 17**, the heatmap and the live counter,
which share a new **Best time** dashboard tab; then **Step 20** on its own **A/B tests** tab and
**Step 23**, the cookie notice, with its switch on a new **Privacy** tab.

**Why all four went on their own tabs.** The analytics page is a single 24 KB file and the page
editor is three files of 30 KB each, and a whole-file resend of any of them is the exact shape of
the mistakes that broke two builds this morning. A 7×24 grid also wants the full page width, a
counter that polls every 20 seconds does not belong on a page that already reads the database five
times on load, and a privacy setting is not a page-design setting. New routes, no risk to what
already works — the sidebar is now seven tabs, which is the cost.

**Two facts corrected by today's reads.** There is **no duplicate `/jaero_yt` row**: `creators` holds
exactly two rows, `ava` (8 links, 229 views) and `jaero_yt` (0 links, 3 views), so the long-standing
"delete the duplicate page" queue item was deleting something that does not exist, and F13 is closed
with nothing to do. And the `accounts` table has **no `creator_id` column** and there is no
`account_pages` table — ownership is resolved entirely in `lib/session.ts`, which is worth knowing
before anyone writes a query that assumes otherwise.

**The one limit that has not moved:** no tool available here can read a build or deploy result, so
every commit is proof **CODE** and the client's forwarded Vercel emails are still the only failure
signal (B14). `web.loadPage` serves cached crawls and is not verification in either direction.

**One decision made without the client:** the home page said **Lander** in its title, nav and footer
while everything else says **LandR**. F28 unified it on LandR on that evidence. Still needs his yes,
along with the brand/domain question parked until Wednesday.

**Queue, in order:**

1. ~~P0 security fixes, tap bug, country rules, collections filter, delete-a-page~~ — **done** 26 Sep
   (F9–F17).
2. ~~Creator accounts, creator home, compare models~~ — **done** 26 Sep (C1–C3).
3. ~~Collections, favicon, sign-in autofill, work claim~~ — **done** 26 Sep (F18–F22, C4–C6).
4. ~~C7 / B22 Team tab; B21/B20 scoping; B23/B25/B19; B9 rate limit; Step 16 subscribers CSV~~ —
   **done** 26 Sep (F23–F30).
5. ~~Step 19 enforcement, then the editor half~~ — **done** 26–27 Sep. Step 19 is closed.
6. ~~Step 18 campaign tags~~ — **done** 27 Sep (`882ffea9`). Note it does **not** close B12.
7. ~~B26 unsubscribe; welcome email; B8 keep-alive~~ — **done** 27 Sep (D1–D3).
8. ~~Delete the duplicate `/jaero_yt` page~~ — **nothing to delete**, disproved 27 Sep.
9. ~~Step 14 heatmap, Step 17 live counter~~ — **done** 27 Sep (`0c09ec5f`, `1ebde424`).
10. ~~Step 20 A/B tests, Step 23 consent banner~~ — **done** 27 Sep (`3aa29a12`, `762b05a1`).
11. **Verify on the deploy.** Still the largest gap and it needs his browser: favicon, a country rule,
    the collection filter and a collection CSV, the subscribers CSV, one page deletion, creator home,
    compare, the three collection behaviours, an accept-with-claim → approve → blocked disconnect, the
    Team tab on a model login, the `.nav-current` label, the reworded home page, one `/register`
    signup (which should leave a `signup_log` row), **a date typed into a link schedule**,
    **one tagged `/go` click**, the new **Best time** tab (the grid should shade Ava's real hours,
    and "online now" should count him while he is on `/ava` in another window), **rotation switched on
    for one link so the A/B tab fills**, and **the cookie notice switched on** — on `/ava` in a
    private window it should appear once, Decline should leave views counting while visitors and
    time-on-page stay flat, and Accept should start them.
12. **Wednesday, needs him:** domain, DNS records, `RESEND_API_KEY`, the Vercel env vars, and the
    brand-name decision. Until then nothing in Part 2c's mailing half can be proved and Step 24
    cannot start.
13. **A24 visual page builder** — the biggest remaining item; still blocked on the profile-photo
    resize and canvas decisions in `DECISIONS.md`.
14. **A25 / B3 / B4 session + password hardening** — required before ten real model logins exist.
15. **Buildable without him, in rough order of worth:** double opt-in (`confirmed_at` + a confirm
    route reusing the D1 token pattern, which would also gate the welcome mail — it must ship
    switched off while no provider key exists, or the list becomes unusable); B4 `sessions` table;
    B5 regenerate `sql/schema.sql`; an `.env.example` note for `RESEND_API_KEY` and `CRON_SECRET`;
    B27, making the first page view wait for consent. Step 21 QR is buildable but wants an npm
    dependency, which is a blind risk while no build result can be read here.
16. **Finish the other partials:** Step 15 / B12 (needs `utm_*` captured on incoming views plus an
    events table) and A17 editor compaction, which today's four new cards made worse.
17. Housekeeping: A30 delete the stale branch; Step 8 `domains` table when a domain exists.
18. Only after LandR is done: `eleven-smg/chatterdesk`.
