# LandR — session log

Append one entry per working session, newest first. Always record commit SHAs.

---

## 2026-09-27 — two failed builds before breakfast, then the mailing groundwork, Step 19 and Step 18

Longest session so far. Head was `1ec009c4` once the morning's breakage was repaired. The client's
standing instruction all day was to keep building and stop asking process questions; everything that
needs his money, his DNS or his logins was deferred by him to Wednesday, so every item below was
chosen because it needs none of those.

### Block 8 — the whitelist / compose work, and two production builds broken sixteen minutes apart

| SHA | What |
| --- | --- |
| `3208900` | subscribe redirect — **failed the build** (F31) |
| `b39b9977` | fix-forward: `SubscribeState` gains `redirect` and `ask`; `subscribe()` resolves a destination |
| `eba7d3d` | `buttonNote` on `SubscribeForm` — **failed the build** (F32) |
| `4e8fa533` | fix-forward: `app/[handle]/page.tsx` passes `buttonNote` |
| `1ec009c4` | head after the repairs; all five fields the form reads re-verified as declared |

**Both failures were one mistake pushed twice.** `3208900` shipped a component reading
`state.redirect` from an action that did not return it; `eba7d3d` shipped a **required** prop in a
commit that touched only the component, so its single caller never passed it. Either half alone
fails the type check, the deploy dies, and the live site keeps serving the previous build while the
work reads as shipped in the log. Both surfaced only because the client forwarded the Vercel failure
emails — 60 and 76 minutes after the pushes — which is the real lesson: **no tool available here can
read a build result**, so his inbox is the only failure signal, and every push is proof CODE.

The rule now at the bottom of `BUGS.md`: **never split a caller and its callee across commits.** The
file list in `get_commit` is the tell — a commit touching only a component, with no caller in it, is
the shape of both failures. It was honoured for the rest of the day, including deliberately ordering
the Step 19 pair so that each commit compiled on its own.

**What the feature is.** Subscribers can be pointed at a whitelist screen (`/{handle}/whitelist`,
plus a `contact.vcf` download) that walks them through adding the sender to their contacts; both
pages are set to `compose` mode, which opens a pre-filled draft. The honest limit was stated to the
client outright: **no provider API can whitelist a third-party sender.** Only two things are real —
compose a draft, and land the person on the right screen. Anything else would be theatre.

### Block 9 — the Supabase MCP was working all along

The claim carried through blocks 5–7 and told to the client — "the Supabase MCP server is not
connected, so no database work is possible" — was **wrong**, and he had to push back on it before it
was re-tested. The server answers on the key `mcpServer_supabase`; the earlier attempts used the
wrong one. `execute_sql` and `apply_migration` were both exercised today. The retraction is in
`BUGS.md`, along with the rule: check the connection inventory before reporting a tool as missing,
and never tell the client a whole class of work is blocked on the strength of one failed call.

**What the first reads since 3 Sep found** (project `xwutsycngvrbgoxoarth`, eu-west-1, PG17):

- `creators` holds **exactly two rows**: `ava` (8 links, 229 views) and `jaero_yt` ("John the first",
  0 links, 3 views). **There is no duplicate page.** "Delete the duplicate `/jaero_yt`" had been in
  the queue since 26 Sep describing work that does not exist — written from a screenshot and never
  re-checked. Retracted in `BUGS.md`, F13 closed with nothing to do.
- `accounts` is `(id, email, name, password, role, created_at, username)` — **no `creator_id`**, and
  there is no `account_pages` table. Ownership is resolved entirely in `lib/session.ts`
  (`requireDashboardAccess` / `getManagedPages`). Worth knowing before anyone writes a query that
  assumes a foreign key.
- `links` already carries `starts_at` / `ends_at` (null on every row), `geo_rules`, `rotate`,
  `rotation_urls`, `rotation_index`, `collection_key`, `layout`, size/shape/colour,
  `preview_image_url`, `media_url`.
- subscribers 0, `email_sends` 0, collections 1 ("ava main"). Ava's `whitelist_from_email` is
  `balogundivinee@gmail.com`; both pages are `whitelist_redirect_mode='compose'` with the prompt off.

### Block 10 — the unsubscribe path (D1, closes B26 → F33)

| SHA | What |
| --- | --- |
| `4245acb8` | `memory/BUGS.md` only |
| `38ffe4cd` | **new** `lib/unsubscribe.ts`, `app/unsubscribe/page.tsx`, `app/unsubscribe/actions.ts` |

`subscribers.unsubscribed_at` had existed with **no writer** and no link anywhere in the product, so
every exported row read "subscribed" forever. The token is an HMAC over `handle:email` keyed on
`SUPABASE_SERVICE_ROLE_KEY` — no new secret, no new table, nothing to store. **No expiry**, on
purpose: an unsubscribe link in a year-old email must still work, and an expired one would be worse
than none. A missing or tampered token says so plainly rather than showing a false success; an
already-unsubscribed address reports success, because the visitor's intent is satisfied either way.
This had to land before anything could be sent, which is why it went first.

### Block 11 — the welcome email (D2)

| SHA / migration | What |
| --- | --- |
| migration `welcome_email_settings_and_send_log` | `creators` += five `welcome_email_*` columns; new `email_sends` table (RLS on, **no policies** — service role only); index `(creator_id, created_at desc)` |
| `79c02f18` | **new** `lib/welcomeCopy.ts`, `lib/welcomeEmail.ts` |
| `8a5043ef` | `subscribe()` sends only on a successful insert; `saveProfile` guarded on `welcome_email_subject` |
| `e260217a` | `ProfileForm.tsx` welcome-email section; `edit/page.tsx` passes `emailReady` |

**Off by default on every page**, and the editor says outright that nothing can send until
`RESEND_API_KEY` exists. The send is tied to the **insert actually succeeding**, so a repeat
subscribe of the same address never mails twice — the duplicate is silently the same success to the
visitor and a no-op to the mailer. `List-Unsubscribe` is sent as a header only: one-click POST would
need an endpoint that trusts an unauthenticated request from a mail provider, which is not worth it
before a single subscriber exists. Every send is logged to `email_sends`, so a failure is visible in
the database even though no inbox can be read from here.

The migration was applied and then **re-verified by querying the columns back**, per the rule that a
migration tool reporting success is not the same as a column existing.

### Block 12 — keep-alive instead of a paid plan (D3, closes B8 → F34)

| SHA | What |
| --- | --- |
| `c9fedb48` | **new** `app/api/keepalive/route.ts`; `vercel.json` cron `0 6 * * *` |

The free tier is a settled client decision, so the fix for the auto-pause that took `/ava` down for
about three weeks is a cheap daily query, not an upgrade he has said he will not buy. Daily is what
Hobby allows. **Proof is CODE:** the cron is configured, not observed firing — no Vercel execution
log is readable from here, so the real proof is the project still being awake after a quiet week.
If it pauses again, F34 reopens.

### Block 13 — Step 19's missing half: the schedule editor

| SHA | What |
| --- | --- |
| `d27a2897` (+226/−11) | **new** `edit/ScheduleFields.tsx`; `edit/actions.ts` gains `isoFromLocalInput` and a guarded `patch` in `updateLink` |
| `533ce01a` (+13) | `edit/page.tsx` renders the fields inside the existing per-link form and prints a `scheduled` / `expired` tag |

The enforcement half shipped 26 Sep, but nothing could **set** the dates, so the feature was inert.
Two commits, component first, caller second — each compiles alone, which is the F31/F32 rule applied
deliberately rather than tripped over.

Two hazards worth remembering. A `datetime-local` filled on the server renders a different string
than the browser produces, so the inputs render empty and fill in a `useEffect`; and a wall-clock
time is meaningless without an offset, so the form posts `getTimezoneOffset()` in a hidden field and
the action converts — a time typed in Lagos means Lagos. The write is guarded on
`formData.has("starts_at")`, so every other save path leaves the dates alone instead of blanking
them. Both bounds stay optional, every existing row still has neither, and the state sentence is
plain words rather than a date range the client has to decode.

**Step 19 is now DONE (CODE).**

### Block 14 — Step 18 campaign tags, redesigned

| SHA / migration | What |
| --- | --- |
| migration `utm_tagging_settings` | `creators` += `utm_enabled` (bool, default false), `utm_source`, `utm_medium`, `utm_campaign`; column existence re-verified by query |
| `882ffea9` (+181/−9, 4 files) | **new** `lib/utm.ts`; `/go/[id]` tags outgoing destinations; `saveUtm` in `edit/actions.ts`; editor card |

The pack asked for a `/dashboard/[handle]/utm` builder that hands back a string to copy. That is a
tool for links you keep somewhere else — and the client's links already live in LandR, so tagging is
a **setting**: one switch plus source / medium / campaign, and `/go/[id]` tags every destination
itself.

The rules it enforces are the interesting part. Tagging runs **last**, after the schedule check,
country rule, collection destination and rotation have already chosen a destination, so a tag can
never change where somebody lands. It **never overwrites a parameter the destination already
carries** — if the client has his own tracking on a link, his wins. A URL that cannot be parsed, or
is not http(s), comes back untouched, because a broken link is worse than a missing tag. Source
falls back to the handle, medium to `link`, and `utm_content` is the button label. The click is
logged with the tagged URL, and `/go/[id]` now fetches the creator row once for handle, deep-links
and the four columns, which the deep-link branch reuses.

**It does not close B12.** These tags feed the *destination's* analytics, not ours; our Mediums tile
needs incoming `utm_*` captured onto `page_views`. That distinction is now written into B12 so it is
not mistaken for done.

### Block 15 — the memory pass

| SHA | What |
| --- | --- |
| `ce0d75a4` | `STATE.md` + `DECISIONS.md` rewritten to 27 Sep (+126/−57) |
| `98d7a2aa` | `PROGRESS.md`: Steps 18 and 19 close, new Part 2c for the mailing work, queue rebuilt (+79/−62) |
| `7f5539ec` | `BUGS.md`: B26 → F33, B8 → F34, B12 explained, duplicate-page claim retracted, two new rules (+24/−10) |
| this commit | `SESSION-LOG.md` — blocks 8–15 |

Every commit today was verified with `get_commit` for its file list and diff stats, which is the only
proof available that a whole-file resend changed what it claimed to and nothing else.

**Where it leaves the project.** Pack totals are **14 DONE · 2 PARTIAL · 7 NOT STARTED · 1
CANCELLED**. Everything shipped today is proof CODE. The largest remaining items are unchanged: A24
the visual page builder, A25/B3/B4 session and password hardening, and the deploy walk-through that
only the client's browser can do. Wednesday unblocks the domain, DNS, `RESEND_API_KEY` and the env
vars, and with them Step 24 and any proof that the mailing work actually sends.

---

## 2026-09-26 (afternoon) — first code session since 25 Aug: the tap bug, an authorization sweep, then the reference-driven UI work

Client approved code changes ("lets start"). Head was `917494bf` before the session.

> **Correction, 27 Sep:** blocks 5–7 below each say the Supabase MCP server was unreachable. It was
> not — the calls used the wrong connection key. See Block 9 above. The work in those blocks stands;
> only the stated reason for avoiding migrations was wrong.

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
| `bdda4002` | Analytics **"Filter on collection"** dropdown, admin-gated — **the gate was removed again in `00a43883`, see Block 3**; `collections/page.tsx` sub copy rewritten (closes **B13** → F14) |
| `3a1620f5` | `CollectionsUI.tsx` — redirect labelled optional, "blocked"/"block screen" copy gone, note that Analytics can add the group together |
| `2171e5fd` | Users → **Delete a page**: new admin-only `deletePage` action with typed-handle confirm and child-first cleanup (closes **B17** → F15) |

**Country rules.** `CountryRules.tsx` serialises its rules back into the existing `NG,GH = url` line
format through a hidden `geo_rules` input, so `saveGeoRules` and the `links.geo_rules` shape are
untouched and **no migration was needed**.

**Analytics collection filter.** `?collection=<id>` swaps the five `.eq("creator_id", creator.id)`
filters for `.in("creator_id", ids)` over the collection's pages. It was first shipped **admin-gated**
on the assumption that a collection spans pages owned by other people; the client corrected that
assumption in Block 3, so the gate is gone. An empty collection resolves to a sentinel uuid so every
figure reads zero instead of silently falling back to one page's traffic. CSV export still has no
collection parameter — logged as **B20**.

**Delete a page.** Admin-only, the typed handle must match the target row, and the page named in the
address bar refuses to delete itself (it would pull the dashboard out from under the click). Children
are removed child-first — `link_clicks`, `page_views`, `subscribers`, `links`, then `creators` —
because `sql/schema.sql` declares `on delete cascade` but this database has been hand-patched more
than once. Uploaded media is deliberately left in the bucket. This was written to unblock removing
the `/jaero_yt` page; **27 Sep found there is no duplicate to remove.**

**Proof status: CODE only.** There is no readable typecheck result (B14) and the Vercel result for
these commits has not been inspected. Nothing in this session is LIVE-verified.

Also settled this session, from the client's four reference screenshots (read as chat attachments):

- **B13 closed.** The reference "New collection" dialog is just **Name + Redirect url**, with
  "When someone from a blocked country visits your page, you can redirect them here." Nothing
  per-platform. Reference Analytics has a **"Filter on collection"** dropdown. So a collection is a
  group of pages + one optional redirect + an analytics filter; per-country destination swaps stay
  **per link**. Both halves are now built.
- FanplaceFinder is gone from the reference (moved to aicreatormarketplace.com) — nothing to build.
- Reference Analytics confirms Mediums + Events tiles are expected (B12 stands).
- Reference Users table: ID, Name, Email (verified tick), Role, Created At; no delete control visible
  — ours now has one anyway.
- The rachelfit email collector is a **fixed centred card** with First Name + Email pill fields —
  answers half of the A24 sizing question.
- Client's own editor screenshot shows crop reading real values (50% / 18% / 100%), so "crop reads 0"
  is not reproducing here; awaiting confirmation.

### Block 3 — collections re-scoped, and the creator/model architecture change

| SHA | What |
| --- | --- |
| `00a43883` | Admin gate removed from the Analytics collection filter (now open to anyone with dashboard access; the creator ids are scoped to the pages the viewer manages, `role === "admin"` still sees all); `collections/page.tsx` page list scoped by `account_id`; sub copy rewritten |
| `7ae2484e` | **Build fix** — `00a43883` shipped `collections/page.tsx` with a stray extra `}` after the final closing brace. Removed. |

**What the client corrected (10:42).** My reading of Collections was wrong on two counts: it is
**not** an admin-only tab, and it is **not** for inspecting pages owned by other models. A collection
is the page owner's **own campaign folder** — group your own landing pages, attach one optional
redirect URL that applies to every page in the group for flagged-country visitors, and filter
Analytics by the group. Confirmed against the client's research on onyoursocials / UseClick /
Postly-style products; treat that research as the spec. `00a43883` brings the code in line.

**The stray-brace lesson.** `push_files` resends a whole file, so a mis-assembled tail ships
silently. Re-read the tail of every file written with `push_files` before moving on.

**New architecture direction (client, 10:42).** Supersedes the multi-model-dashboard assumption:

- **One dashboard = one model.** `/dashboard/ava` is Ava and her team only. You must not be able to
  add another model from inside a model dashboard; another model registers their own account.
- **Managing several models requires a "creator" account.** Signing into a creator account shows a
  home/overview of all of that creator's model accounts → tap one → land in that model's full
  dashboard (all five or six tabs, fully editable) → go back "home" → tap the next. Never all models
  on one dashboard.
- **New feature: compare models.** Select two, five, or any chosen subset of the creator's model
  accounts and get a statistical / graphical / quantitative comparison of what is and is not
  performing.

### Block 4 — favicon, the sign-in autofill scare, collections that actually do something, and the work claim

Four things raised at 12:15.

| SHA / migration | What |
| --- | --- |
| `eb31f2d0` | **new** `app/icon.svg` (blue tile, white L, green active dot) — closes **F20**; sign-in password field → `autoComplete="new-password"` — closes **F19**; a leftover "Users tab" hint relabelled "Team tab" |
| `b33785e8` | Stock `app/favicon.ico` deleted (the untouched create-next-app default, 25,931 bytes) so no browser can prefer it over the SVG |
| migration `collection_destinations_takeover_and_owner` | `collections` gains `owner_account_id` (backfilled from the pages inside each collection), `country_redirect_enabled`, `destinations jsonb`, `takeover_url`, `takeover_enabled`; `links` gains `collection_key`; two indexes |
| `62c8463d` | **new** `lib/collections.ts`; `/go/[id]` resolution order is now **per-link country rule → collection destination → rotation → link default** |
| `e24c44c2` | Public page honours the group country default (the page's own `blocked_redirect_url` still wins) and the campaign takeover, both after `logPageView` so traffic is counted, and neither under `?preview=1` |
| `960b1c5c` | Collections tab edits all three behaviours, each with its own switch, and prints a plain-English `describe()` line; create modal is name-only; list scoped by `owner_account_id` — closes **F18** and **F21** |
| migration `creator_clients_work_claim` | `work_claim` ('none'\|'requested'\|'approved'\|'declined', default 'none'), `work_claimed_by` ('model'\|'creator'), `work_claim_note`, `work_claimed_at`, `work_decided_at`, with both check constraints |
| `ca2a6915` | `memory/BUGS.md` rewritten with F18–F21 and new B21–B24 |
| `af3d3fba` | `lib/creatorTeam.ts` carries the work-claim columns and exports the single `needsReleaseApproval()` rule used by both the action and the UI |
| `78af4f8b` | The work-claim flow — closes **B24** → F22 |
| `9bef3009`, `944d6a0a` | `BUGS.md` B24→F22; `DECISIONS.md` collection behaviours + the work-claim rule |

**The collection redirect was dead (F18).** `collections.redirect_url` was written by the tab and read
by **nothing**. It had been described to the client as a flagged-country destination since
`3a1620f5`, so the product was claiming behaviour it did not have — which is exactly why he could not
work out "how that one works". He answered "idk maybe add all and an option to disable each", so all
three readings are built with independent switches, and existing `redirect_url` values were left
**disabled** so no live visitor behaviour changed silently.

**Destinations need no tagging.** A collection destination matches on `links.collection_key` when it
is set, and otherwise on the platform derived from the link's own destination host — chosen
specifically to avoid shipping another field nobody fills in, which is the F18 mistake again.

**The sign-in autofill was never a leak (F19).** `signOut()` deletes the cookie and the form renders
empty; Chrome's own password manager was filling it because the field asked for
`autoComplete="current-password"`. Saved credentials live in the visitor's own browser profile.

**Who does the work (F22).** Settled on: **the creator declares at accept, she approves.** The model
would never volunteer the flag, the creator is the one who knows, and her approval is what makes it
binding. An unanswered claim deliberately does not restrain her; if she disconnects anyway it is
recorded as declined, so he always learns his standing before doing the work.

### Block 5 — the Team tab, the placeholder sweep, and the collection scope leak

| SHA | What |
| --- | --- |
| `07156abc` | `/register` and `/signin` copy: no more `Ava` sample values |
| `b6491197` | **Team tab rebuilt** — `users/page.tsx` splits into `TeamForAdmin` and `TeamForOwner`; new `updateOwnLogin`; `cleanRole` accepts `creator` — closes **B22** → F23 |
| `f836cbfa`, `f8179966` | Add-a-model form placeholders made generic; `f8179966` repairs an em-dash escape the first push shipped doubled |
| `29171619` | Editor social row placeholders reworded |
| `a4cb67ea` | **new** `lib/collectionScope.ts`; `export/route.ts` reads `?collection=`, queries `.in("creator_id", creatorIds)`, prepends a page-name column, adds `-collection` to the filename |
| `341c4192` | The analytics page derives options, selection, page count and creator ids from that helper; export links carry `&collection=` — closes **B21** → F24 and **B20** → F25 |
| `ef1d6386` | Fix: `341c4192` shipped the stat-change arrow escape doubled. Replaced with `&uarr;`/`&darr;` entities |

**The Team tab is the first thing with LIVE proof.** The client saved `/dashboard/ava/users` as MHTML
while signed in as an Admin; extracting the text shows `TeamForAdmin` rendering without error. The
owner/model branch has still never been opened — it needs Jethro's login.

**One helper for two screens (F24/F25).** The filter and the export had each grown their own idea of
which collection a viewer may read, and they disagreed. Both now call `resolveCollectionScope`.
Membership is narrowed with `.in("id", managedIds)`, which also fixes a **creator** — who manages
pages he does not own — reading zero when filtering by collection.

**The half-landed commit.** `a4cb67ea` shipped the helper and the export route but not the page that
leaked, so for about three minutes the repo held a helper nothing called. The same shape as F31/F32
the next morning, which is when it finally became a hard rule.

### Block 6 — the three small ones: `.nav-current`, the Team-tab redirect, and the public copy sweep

| SHA | What |
| --- | --- |
| `82a2f365` | `.nav-current` styled — closes **B23** → F26 |
| `d65323d7` | `back(message, to)` + `currentDashboardPath()`; `users/page.tsx` renders `searchParams.msg` — closes **B25** → F27 |
| `5b7a6694` | `memory/BUGS.md` — F26/F27, the cached-fetch rule, a new Retracted row |
| `3efb889a` | `app/page.tsx` reworded — closes **B19** → F28 |
| `52c8eecb` | `memory/BUGS.md` — B19 → F28 with the full sweep list |

**`.nav-current` was filed as the wrong element.** The active tab *is* styled, by `.nav-item.active`.
`.nav-current` is the current-model label above the tabs, which only renders for an account managing
more than one page — which is why it was never noticed on the single-page admin view.

**The copy sweep's one real survivor was the most public page in the product (F28)** — the signed-out
marketing home was still selling "geoblocking" and promising visitors could be blocked, plus two
other stale claims (Collections "a whole roster shares one redirect", and "three page templates"
when four had shipped). The brand was also inconsistent: the home page said **Lander**, everything
else **LandR**. Unified on LandR on the evidence — still an open question for the client.

**A false P0 nearly filed.** `web.loadPage` returned "This page does not exist." for `/ava`. The same
fetcher returned the create-next-app starter for `/`, which the repo has not contained since its
first commits — both were cached crawls. Nothing was filed; the rule is in `BUGS.md`.

### Block 7 — the signup rate limit, and the memory files brought back in line

| SHA | What |
| --- | --- |
| `3a7d88d3` | `memory/PROGRESS.md` refreshed to `3efb889a` |
| `e40f6ca2` | `memory/SESSION-LOG.md` — Block 6 |
| `d721982b` | **new** `lib/signupLimit.ts`; `/register` enforces and explains the limit — closes **B9** → F29 |
| `50bd4c0d` | `memory/BUGS.md` B9 → F29; `memory/PROGRESS.md` Step 22 → DONE |

**`/register` had no ceiling of any kind** — one request created one account **and one public page**,
unlimited, on a free-tier database that auto-pauses (B8). The plumbing had been there since August:
`signup_log` and its index existed with **nothing writing to them**, so no migration was needed.
**3 per IP per hour, 8 per day**, checked after the cheap validation and before any other query, and
only completed signups are logged so a bounced attempt never counts against a real person. A read
error **allows** the signup and logs loudly — a database blip must not lock everyone out of
registering.

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
- Created this `memory/` system. No application code changed in this block.

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
