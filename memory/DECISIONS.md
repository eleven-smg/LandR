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
| **What a collection is** | The page owner's **own campaign folder**: group your own pages, one *optional* redirect for flagged-country visitors across the group, and "Filter on collection" on Analytics. Not admin-only, not other people's pages. Per-country destination swaps stay **per link** | 26 Sep |
| **One dashboard = one model** | `/dashboard/ava` is Ava and her team only. You cannot add another model from inside a model dashboard | 26 Sep |
| **Managing several models** | Needs a **creator account**. Creator home lists his models → tap one → her full dashboard → back to home. Never all models on one dashboard | 26 Sep |
| **Where the creator home lives** | `/dashboard` itself. A model with one page and no team links is redirected straight into her own dashboard, so nothing changes for her | 26 Sep |
| **Who owns a page** | **Always the model's account** (`creators.account_id`), even when the creator created her. A creator's reach is a `creator_clients` row, never ownership | 26 Sep |
| **Model invited the creator** | She can **disconnect at any time**; access ends immediately | 26 Sep |
| **Creator created the model** | She **cannot** disconnect unilaterally. She can only *request release*, which the creator must approve — so she can pay for release of his work, or start afresh on her own account | 26 Sep |
| **Compare models** | Build it: pick any subset of the creator's models and compare them statistically and graphically | 26 Sep |
| **Typecheck** | Added as a GitHub Actions workflow (B14). Vercel is no longer the only compiler | 26 Sep |

## Open — these block work

1. **A24 resize semantics.** For the profile photo, does "resize" mean small/medium/large diameter,
   or also a full-width banner? (The email collector half is answered: fixed centred card with
   First Name + Email pill fields, from the rachelfit reference.)
2. **A24 canvas model.** Free-form (elements side by side) or single-column (blocks stack, only
   order and height change)? *Recommendation: single-column — free-form breaks on narrow screens.*
3. **Session/password hardening now or later** (B3/B4/A25)? *Recommendation: now, before ten real logins exist.*
4. **Can models edit their own page, or only view analytics?** Today a model gets the full editor.
5. **What the Team tab shows a model.** It is now labelled "Team" but still holds the old admin-only
   user management. *Recommendation: her own team logins plus her creator connections; move
   "Delete a page" out to an admin-only screen.*
6. **Supabase plan** (B8) — pay, or accept the page breaking after ~1 week of no traffic?
7. Snapchat's pill colour — client's own pick, still outstanding.
8. A placeholder profile photo for Ava.
