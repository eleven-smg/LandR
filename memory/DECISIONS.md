# LandR — decisions

## Settled. Do not re-ask.

| Decision | Answer | When |
| --- | --- | --- |
| Password storage | **Plaintext, deliberately**, while testing ("up to 5 users before we integrate it to SaaS"); the agency asked for retrievable passwords | 22 Aug |
| Rotating the leaked Supabase keys / dashboard password (Step 12) | **Never** — client refused outright. The archive and handoff PDF still contain live values | 22 Aug, restated |
| NSFW / 18+ warning | **Dropped.** Would kill the fans' mood. Never raise again | 25 Aug |
| Creating ten model accounts/pages | **Not our job.** The platform only has to *allow* ~10 | 25 Aug |
| "Template" | The **whole page look**, not just the background | 25 Aug |
| "Visual builder" | Drag to reorder **and resize** every page element, not just link buttons | 25 Aug |
| Number of templates | **4** — Classic photo, Spotlight (rachelfit style), Mosaic, Glass sheet | 25 Aug |
| Visitor tracking | **Yes** — build it (asked three times, then approved) | 25 Aug |
| Smart deep linking | **Yes**, default on | 25 Aug |
| Ava's subscribe box | **On** | 22 Aug |
| Ava's blank position-7 link | Fill with placeholder data | 22 Aug |
| Where the tracking checklist lives | **In the repo** (`memory/`), so it travels with the code and any new chat can read it | 26 Sep |
| Stale `restore/…` branch | Delete it | 22 Aug (still not done — A30) |
| QR codes (Step 21) | Generate **locally**; do not depend on a free third-party image service | 22 Aug |
| Vercel MCP | Do not use — read-only and its OAuth auto-registration fails | 3 Sep |
| chatterdesk | Untouched until LandR is finished | throughout |
| **What a collection is** | The page owner's **own campaign folder**: it groups *your own pages*, never visitors. A page joins one only from the Collections tab. Not admin-only, not other people's pages | 26 Sep |
| **What a collection can do** | All three, each with **its own switch**, because the client asked for "all and an option to disable each": (1) grouping + "Filter on collection" on Analytics, always on; (2) a **country destination set** — per-platform URLs (Telegram, Instagram, …) that flagged-country visitors get instead of the link's normal destination, matched on `links.collection_key` or, with no tagging at all, on the platform of the link's own destination host; (3) a **campaign takeover** — one URL that sends every visitor to the group's pages straight out, logged first so traffic is still counted, and never under `?preview=1`. A per-link country rule still beats the collection, and a page's own `blocked_redirect_url` beats the group default | 26 Sep |
| **Who may see a collection** | It is listed to the account that **owns** it (`collections.owner_account_id`) or that manages at least one page inside it; admins see all; legacy rows with no owner stay admin-only. Whatever is shown, the figures and the CSVs only ever cover the pages that viewer manages, and a collection with no readable pages totals **zero** rather than falling back to the page in the address bar. One helper, `lib/collectionScope.ts`, answers this for every screen | 26 Sep |
| **Who does the work on a page** | The **creator declares it when he accepts her invite** (tick box + optional note). It reaches her as a **request she must approve** — he cannot bind her by himself. Once approved, her instant Disconnect is replaced by Request release, which he approves, exactly as in the creator-created case. If she declines or never answers, the link still goes active and she keeps instant disconnect — so **he learns his standing before putting in the work**, which was the protection asked for. Declining does not remove his access | 26 Sep |
| **One dashboard = one model** | `/dashboard/ava` is Ava and her team only. You cannot add another model from inside a model dashboard | 26 Sep |
| **Managing several models** | Needs a **creator account**. Creator home lists his models → tap one → her full dashboard → back to home. Never all models on one dashboard | 26 Sep |
| **Where the creator home lives** | `/dashboard` itself. A model with one page and no team links is redirected straight into her own dashboard, so nothing changes for her | 26 Sep |
| **Who owns a page** | **Always the model's account** (`creators.account_id`), even when the creator created her. A creator's reach is a `creator_clients` row, never ownership | 26 Sep |
| **Model invited the creator** | She can **disconnect at any time**; access ends immediately — unless she has approved his work claim | 26 Sep |
| **Creator created the model** | She **cannot** disconnect unilaterally. She can only *request release*, which the creator must approve — so she can pay for release of his work, or start afresh on her own account. No work claim is written in this case; building the page is implied by having created it | 26 Sep |
| **Compare models** | Build it: pick any subset of the creator's models and compare them statistically and graphically | 26 Sep |
| **What the Team tab shows** | Two different screens behind one label: an **admin** gets the workspace-wide account management (accounts, roles, ownership, remove an account, delete a page), and a **model or creator** gets pending work claims, the creators connected to this page with the right release control, an invite box and her own login card. "Delete a page" stays inside the admin branch rather than moving to a separate route | 26 Sep |
| **Typecheck** | Added as a GitHub Actions workflow (B14). Vercel is no longer the only compiler | 26 Sep |
| **Supabase plan (B8)** | **Stay on the free tier.** Instead of paying, one Vercel cron (`vercel.json`, `0 6 * * *` → `/api/keepalive`) touches the database daily so it never reaches the ~1 week idle pause. The route is head-only, needs no secret to work, and enforces `Bearer CRON_SECRET` only if that variable exists — so it required nothing from the client. **This closes the open "pay or accept breakage" question** | 27 Sep |
| **All database work through MCP** | The client will **not** log into Supabase. Every schema change and every count is done with the Supabase MCP server from here. **Never paste SQL to him** | 27 Sep |
| **Mailing lives inside LandR** | The subscriber mail (once called "LandaMail") is part of this product and this repo, not a second app | 27 Sep |
| **How the site sends mail** | A provider key (Resend) sits in a server environment variable and the site posts to the provider's HTTPS API as the creator's own address. It needs **no email login from her**, cannot read her inbox, and replies land in her normal mail app. Until the key exists every attempt is logged as `skipped` in `email_sends` and nothing is sent | 27 Sep |
| **Welcome email default** | **Off on every page.** A ticked switch with no provider key still sends nothing, and the editor says so in plain words. Placeholders `{name}` `{handle}` `{email}` are supported in the welcome mail (the older auto-draft still does not support them) | 27 Sep |
| **Unsubscribe** | Every sent mail gets a footer line and a `List-Unsubscribe` header, but **no `List-Unsubscribe-Post`**: one-click headers promise the mail client that no confirmation screen follows, and `/unsubscribe` deliberately asks with a button. Tokens are HMACs keyed on `SUPABASE_SERVICE_ROLE_KEY` with **no expiry**, because a link printed in an old mail must keep working | 27 Sep |
| **Where subscribe sends people** | Default is the **prefilled draft** to the creator (`whitelist_redirect_mode = 'compose'`), with the subscriber's own mailbox or the walkthrough page as the alternatives. Tapping subscribe is itself the yes: the address is saved first, then the browser is sent on | 27 Sep |
| **Link schedules** | One seam, `lib/schedule.ts`, answers "is this live now" for both the public page and `/go/[id]`, and `/go/[id]` enforces it even though the button is already hidden, because that URL outlives the button. Dates are typed in **the creator's own clock** and sent with a `tz_offset` the server converts, never read with `new Date()` on the server (which is UTC on Vercel) | 27 Sep |
| **Campaign tags (Step 18)** | Applied **after** country rules, collections and rotation have chosen the destination, so a tag can never change where a click lands. A parameter the pasted link already carries is left alone. Values are stored lower-cased and hyphenated, because reporting tools treat "Summer Drop" and "summer-drop" as different. Off until switched on | 27 Sep |
| **The product name** | Written **LandR** everywhere in code today. The client has said it is moving off "Lander"; choosing the new name is his and is parked with the domain | 27 Sep |

## Open — these block work

1. **A24 resize semantics.** For the profile photo, does "resize" mean small/medium/large diameter,
   or also a full-width banner? (The email collector half is answered: fixed centred card with
   First Name + Email pill fields, from the rachelfit reference.)
2. **A24 canvas model.** Free-form (elements side by side) or single-column (blocks stack, only
   order and height change)? *Recommendation: single-column — free-form breaks on narrow screens.*
3. **Session/password hardening now or later** (B3/B4/A25)? *Recommendation: now, before ten real logins exist.*
4. **Can models edit their own page, or only view analytics?** Today a model gets the full editor.
5. Snapchat's pill colour — client's own pick, still outstanding.
6. A placeholder profile photo for Ava.
7. Is the saved flagged-country list intentional (Nigeria, Ghana, Kenya … India, Pakistan,
   Bangladesh), or left over from testing?
8. Is "crop reads 0" still happening? Not reproducing here.
