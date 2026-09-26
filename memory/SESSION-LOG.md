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
| `bdda4002` | Analytics **"Filter on collection"** dropdown, admin-gated — **the gate was removed again in `00a43883`, see Block 3**; `collections/page.tsx` sub copy rewritten (closes **B13** → F14) |
| `3a1620f5` | `CollectionsUI.tsx` — redirect labelled optional, "blocked"/"block screen" copy gone, note that Analytics can add the group together |
| `2171e5fd` | Users → **Delete a page**: new admin-only `deletePage` action with typed-handle confirm and child-first cleanup (closes **B17** → F15) |

**Country rules.** `CountryRules.tsx` serialises its rules back into the existing `NG,GH = url` line
format through a hidden `geo_rules` input, so `saveGeoRules` and the `links.geo_rules` shape are
untouched and **no migration was needed** — which mattered, because the Supabase MCP server is not
connected this session. Unticking the box and saving clears the rules.

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
silently. There is no typecheck and no CI (**B14**), so nothing catches it before Vercel. Re-read the
tail of every file written with `push_files` before moving on — or finally close B14.

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

**Blocking the creator build (asked, not yet answered):**

1. Does each model keep their own login to their own dashboard while the creator also manages it? If
   yes, ownership becomes many-to-many and needs a second column or a join table — and the
   **Supabase MCP server is not connected**, so no migration is possible this session. If instead a
   creator account simply owns several `creators` rows, the existing `creators.account_id` is enough
   and **no migration is needed**.
2. What the Users tab becomes inside a model dashboard — removed, or kept only for that model's own
   team logins.
3. Where the creator home lives (`/creator`, a `/dashboard` index, …).

`PROGRESS.md` and `DECISIONS.md` entries for this architecture change are **deliberately deferred**
until those three are answered; the scope is not yet numbered.

### Block 4 — favicon, the sign-in autofill scare, collections that actually do something, and the work claim

Four things raised at 12:15. Supabase MCP **is** connected in this block, so migrations were possible.

| SHA / migration | What |
| --- | --- |
| `eb31f2d0` | **new** `app/icon.svg` (blue tile, white L, green active dot) — closes **F20**; sign-in password field → `autoComplete="new-password"` — closes **F19**; a leftover "Users tab" hint relabelled "Team tab" |
| `b33785e8` | Stock `app/favicon.ico` deleted (the untouched create-next-app default, 25,931 bytes) so no browser can prefer it over the SVG |
| migration `collection_destinations_takeover_and_owner` | `collections` gains `owner_account_id` (backfilled from the pages inside each collection), `country_redirect_enabled`, `destinations jsonb`, `takeover_url`, `takeover_enabled`; `links` gains `collection_key`; two indexes |
| `62c8463d` | **new** `lib/collections.ts` (`safeExternalUrl`, `normalizeDestinations`, `platformKeyFor`, `loadCollectionSettings`, `collectionDestinationFor`, `DESTINATION_KEYS`); `/go/[id]` resolution order is now **per-link country rule → collection destination → rotation → link default** |
| `e24c44c2` | Public page honours the group country default (the page's own `blocked_redirect_url` still wins) and the campaign takeover, both after `logPageView` so traffic is counted, and neither under `?preview=1` |
| `960b1c5c` | Collections tab edits all three behaviours, each with its own switch, and prints a plain-English `describe()` line; create modal is name-only; list scoped by `owner_account_id`, edit/delete owner-or-admin, null-owner legacy rows admin-only — closes **F18** and **F21** |
| migration `creator_clients_work_claim` | `work_claim` ('none'\|'requested'\|'approved'\|'declined', default 'none'), `work_claimed_by` ('model'\|'creator'), `work_claim_note`, `work_claimed_at`, `work_decided_at`, with both check constraints |
| `ca2a6915` | `memory/BUGS.md` rewritten with F18–F21 and new B21–B24 |
| `af3d3fba` | `lib/creatorTeam.ts` carries the work-claim columns and exports the single `needsReleaseApproval()` rule used by both the action and the UI |
| `78af4f8b` | The work-claim flow — closes **B24** → F22 |
| `9bef3009`, `944d6a0a` | `BUGS.md` B24→F22; `DECISIONS.md` collection behaviours + the work-claim rule |

**The collection redirect was dead (F18).** `collections.redirect_url` was written by the tab and read
by **nothing**: the public page reads `creators.blocked_redirect_url`, `/go/[id]` reads per-link
`geo_rules`, and neither ever loaded a collection. It had been described to the client as a
flagged-country destination since `3a1620f5`, so the product was claiming behaviour it did not have —
which is exactly why he could not work out "how that one works". Asked which of the three readings he
meant and he answered "idk maybe add all and an option to disable each", so all three are built with
independent switches. Existing `redirect_url` values were deliberately left **disabled** so no live
visitor behaviour changed silently.

**Destinations need no tagging.** A collection destination matches on `links.collection_key` when it
is set, and otherwise on the platform derived from the link's own destination host, so a Telegram
link is recognised as Telegram with zero setup. That was chosen specifically to avoid shipping
another field nobody fills in — the F18 mistake again.

**Collections group your pages, not your visitors.** That conflation was the root of the client's
confusion ("how do I add a group of people to that collection"). There is no audience concept
anywhere in it; the Collections tab is the only place a page joins one.

**The sign-in autofill was never a leak (F19).** `signOut()` deletes the cookie and the form renders
empty; Chrome's own password manager was filling it because the field asked for
`autoComplete="current-password"`. Saved credentials live in the visitor's own browser profile, so it
could never appear on anybody else's phone. Told him so, and switched the field to `new-password`
anyway — the email is still suggested through `autoComplete="username"`.

**Who does the work (F22).** He could not decide whether the model or the creator declares it. Settled
on: **the creator declares at accept, she approves**. Reasons — the model would never volunteer the
flag; the creator is the one who knows; and her approval is what makes it binding, so he cannot lock
her in by himself. An *unanswered* claim deliberately does not restrain her: if she disconnects
anyway the claim is recorded as declined, which means he always learns his standing before doing the
work. `disconnectCreator` routes to the release path when `invited_by = 'creator'` **or**
`work_claim = 'approved'`, and both the action and the button label read that from the same helper, so
the UI cannot disagree with the rule.

**Proof status.** Migrations are DB-verified (`information_schema`). All code is **CODE** proof only —
B14 still means no typecheck result is readable from here.

### Block 5 — the Team tab, the placeholder sweep, and the collection scope leak

| SHA | What |
| --- | --- |
| `07156abc` | `/register` and `/signin` copy: no more `Ava` sample values |
| `b6491197` | **Team tab rebuilt** — `users/page.tsx` splits into `TeamForAdmin` and `TeamForOwner`; new `updateOwnLogin` in `users/actions.ts`; `cleanRole` accepts `creator` — closes **B22** → F23 |
| `f836cbfa`, `f8179966` | Add-a-model form placeholders made generic ("the name shown on her page", "her page name, short and lowercase", "the name she signs in with"), invite box → "their email address". `f8179966` repairs an em-dash escape the first push shipped doubled |
| `29171619` | Editor social row: `https://instagram.com/ava` → "paste the full link to your profile"; platform box → "platform name" |
| `a4cb67ea` | **new** `lib/collectionScope.ts` (`NO_COLLECTION_MATCH`, `resolveCollectionScope`, `handlesByCreatorId`); `export/route.ts` rewritten to read `?collection=`, query `.in("creator_id", creatorIds)`, prepend a page-name column and add `-collection` to the filename |
| `341c4192` | The analytics page derives its options, selection, page count and creator ids from that helper; export links carry `&collection=`; the footnote now says the CSVs follow the filter — closes **B21** → F24 and **B20** → F25 |
| `ef1d6386` | Fix: `341c4192` shipped the stat-change arrow escape doubled. Replaced with `&uarr;`/`&darr;` entities |

**The Team tab is the first thing this session with LIVE proof.** The client saved
`/dashboard/ava/users` as MHTML while signed in as an Admin and attached it; extracting the text
(python3 in the sandbox — no `tesseract` available, so text extraction rather than OCR) shows the
rewritten `TeamForAdmin` rendering without error: the accounts list with Admin/Model/Creator role
selects, "Who owns which page", "Remove an account" and "Delete a page" with handle confirmation. The
owner/model branch has still never been opened — it needs Jethro's login. The same capture
reconfirms the workspace holds only two accounts (`balogundivinee@gmail.com` admin,
`jethrokhale@gmail.com` model) and two pages, `/ava` and the duplicate `/jaero_yt`.

**One helper for two screens (F24/F25).** The filter and the export had each grown their own idea of
which collection a viewer may read, and they disagreed: the dropdown listed the whole `collections`
table by name, while the export ignored the parameter entirely. Both now call
`resolveCollectionScope`, which returns the visible options, the selected collection, the readable
creator ids and the page count in one shot. Two side effects worth noting: membership is now narrowed
with `.in("id", managedIds)` instead of `.eq("account_id", …)`, which also fixes a **creator** — who
manages pages he does not own — reading zero when filtering by collection; and `NO_MATCH` moved out
of the page into the helper as `NO_COLLECTION_MATCH`.

**The half-landed commit.** `a4cb67ea` shipped the helper and the export route but not the page that
leaked, so for about three minutes the repo held a helper nothing called and an export parameter
nothing sent. Push the caller in the same commit as the helper, or the bug is still live while the
log says fixed.

**Escapes get mangled on a whole-file resend — twice today.** `f8179966` repaired a doubled em-dash
escape and `ef1d6386` a doubled `\u2191`/`\u2193`; in both cases the source held two backslashes and
the page would have printed the escape literally. Neither would have been caught by a typecheck.
Rules now in `BUGS.md`: prefer HTML entities such as `&uarr;` in JSX, and re-read every file after
pushing it — the same discipline that caught the stray brace in `7ae2484e`.

**Residual, filed not fixed.** `TeamForOwner`'s relationship buttons import their actions from
`app/dashboard/actions.ts`, which redirects to `/dashboard?msg=…`, so acting from the tab throws the
user out to the creator home — logged as **B25** (P2).

### Block 6 — the three small ones: `.nav-current`, the Team-tab redirect, and the public copy sweep

The client asked for the three remaining small bugs to be taken together.

| SHA | What |
| --- | --- |
| `82a2f365` | `app/dashboard/dashboard.css` — `.nav-current` styled as a small uppercase label with the nav's 20px padding, a matching transparent 3px left border, `text-overflow: ellipsis`, and hidden with `.nav-item span` / `.user-info` in the `max-width: 900px` query — closes **B23** → F26 |
| `d65323d7` | `app/dashboard/actions.ts` — `back(message, to)` plus `currentDashboardPath()` read from the referer; `users/page.tsx` renders `searchParams.msg` in a notice card in both branches — closes **B25** → F27 |
| `5b7a6694` | `memory/BUGS.md` — F26/F27, the `.nav-current` correction, the cached-fetch rule and a new Retracted row |
| `3efb889a` | `app/page.tsx` — the public marketing home reworded — closes **B19** → F28 |
| `52c8eecb` | `memory/BUGS.md` — B19 → F28 with the full sweep list, plus the signed-out-surface rule |

**`.nav-current` was filed as the wrong element.** The active tab *is* styled, by `.nav-item.active`.
`.nav-current` is the separate label `Sidebar.tsx` prints above the tabs with the current model's
name, and it only renders when `showHome` is true — i.e. only for an account that manages more than
one page, which is why it was never noticed on the single-page admin view. Lesson in `BUGS.md`: read
what the class is for before filing the symptom.

**A redirect written for one screen is a bug on the second (F27).** Every action in
`app/dashboard/actions.ts` ended in `back()`, which hardcoded `redirect("/dashboard?msg=…")` because
it was written for the creator home, so a model who approved or declined a work claim from
`/dashboard/<handle>/users` landed on a different screen. Found while fixing: the Team tab never read
`?msg` at all, so simply returning to it would have swallowed every confirmation and error —
including `inviteCreator`'s "No single account matches that email", the only feedback that form has.
The referer is accepted only when the path is `/dashboard` or starts with `/dashboard/`, so a crafted
referer cannot bounce a signed-in user off-site. The creator home is unaffected: from there the
referer *is* `/dashboard`.

**The copy sweep's one real survivor was the most public page in the product (F28).** Read and
confirmed clean: dashboard `layout.tsx`, `Sidebar.tsx`, the public page `app/[handle]/page.tsx`,
`edit/page.tsx`, `edit/CountryRules.tsx`, `geoblocking/page.tsx`, `geoblocking/CountryPicker.tsx`,
`RotationGroups.tsx`, `collections/CollectionsUI.tsx`, `app/dashboard/page.tsx`, `/signin` and
`/register`. The only survivors there are deliberate: the `blocked_countries` /
`blocked_redirect_url` columns, the form field names that match them, and the `geoblocking` route
slug. `app/page.tsx` — the signed-out marketing home, the surface no rewording pass ever touched —
was still selling "geoblocking" in its metadata and promising you could "block them and redirect the
whole group at once". Two further stale claims surfaced in the same read: Collections was described
as "a whole roster shares one redirect", which is the pages-versus-visitors conflation behind the F18
confusion, and the feature list said "three page templates" when four have shipped since 25 Aug. All
fixed in one commit, and a comment above `FEATURES` now records that no copy there may promise a
visitor is blocked.

**The brand was inconsistent and I picked one.** The home page said **Lander** in its title, nav and
footer while the tab title, `/signin`, `/register`, the creator home, the sidebar, the public page
footer and `alandr.vercel.app` all say **LandR**. Unified on LandR. That call was made on the
evidence, not by the client — it is an open question for him.

**A false P0 nearly filed.** `web.loadPage` returned "This page does not exist." for `/ava`, which
would have been a production outage. The same fetcher returned the **create-next-app starter** for
`/`, which this repo has not contained since its first commits — so both responses were cached
crawls, not live requests. Nothing was filed; the near-miss is in the Retracted table and the rule is
now in `BUGS.md`: cached fetches are not evidence of production state in either direction, and the
tell is an artefact the repo no longer contains.

**Supabase has been unreachable since Block 4** (`connections.supabase` errors "not available in
script mode"), so there has been no row count, read or migration in Blocks 5–6, and the duplicate
`/jaero_yt` page still cannot be deleted from here.

### Block 7 — the signup rate limit, and the memory files brought back in line

| SHA | What |
| --- | --- |
| `3a7d88d3` | `memory/PROGRESS.md` refreshed to `3efb889a`: the home-page copy lag, C7's residual closed as F27, Part 3 rewritten to six blocks, queue renumbered |
| `e40f6ca2` | `memory/SESSION-LOG.md` — Block 6 |
| `d721982b` | **new** `lib/signupLimit.ts`; `app/register/actions.ts` enforces the limit; `app/register/page.tsx` explains the refusal — closes **B9** → F29 |
| `50bd4c0d` | `memory/BUGS.md` B9 → F29; `memory/PROGRESS.md` Step 22 → DONE, pack totals now **13 DONE · 4 PARTIAL · 6 NOT STARTED · 1 CANCELLED** |

**`/register` had no ceiling of any kind.** One request created one account **and one public page**,
unlimited, on a free-tier database that auto-pauses when it is hammered or idle (B8) — the cheapest
way to take the client's live page down, and the last P1 reachable without a database connection.
The striking part is that the plumbing had been there since August: `signup_log(id, ip, handle,
created_at)` and `signup_log_ip_created_at_idx` existed with **nothing writing to them** (0 rows on
3 Sep, and the index still appears in the live unused-index advisory list, which is how its name was
confirmed while Supabase is unreachable). So **no migration was needed** — which mattered, because
there has been no database access since Block 4.

**What shipped.** `lib/signupLimit.ts`: `clientIp()` takes the first `x-forwarded-for` entry, with a
comment saying out loud that it is a rate-limit bucket key and **never** authorization, because a
proxy header is caller-controlled. `checkSignupLimit()` does one day-window read and checks both
ceilings against it — **3 per IP per hour, 8 per day**. `recordSignup()` writes the row.
`register/actions.ts` checks the limit *after* the cheap field validation and *before* any other
query, so a bot cannot make the database work before it is refused, and it logs **only completed
signups**, so a bounced attempt never counts against a real person. `register/page.tsx` renders an
`error=limit` message. Helper and caller shipped in the same commit, per the Block 5 lesson.

**The deliberate trade-off.** A read error **allows** the signup and logs loudly: a database blip
must not lock every new user out of registering. That is a choice, not an oversight, and it is why
the log line matters — silently failing open is the same as no limit at all.

**Two rules added to `BUGS.md`.** A whole *table* can sit unused just like a column (the F22 lesson,
one level up): `signup_log` and its index read as done in the schema while `/register` stayed
unlimited for a month. And every refusal needs a message — a rate limit that bounces to an empty
form reads as a broken button.

**Memory housekeeping.** `STATE.md` had drifted furthest of the four files and was corrected in this
block: it still said `main @ 38c44b42`, claimed "Supabase MCP reconnected" (it has been unreachable
since Block 4), described `users/` as "still old UI, B22" — wrong since F23 — and listed
`signup_log` as "table unused", which F29 has just changed. `lib/collectionScope.ts` and
`lib/signupLimit.ts` were also missing from its file tree.

**Proof: CODE only.** Verifying F29 needs one real `/register` signup leaving a `signup_log` row,
which needs the client's browser — and confirming the row needs Supabase back.

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
