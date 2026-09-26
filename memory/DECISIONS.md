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

## Open — these block work

1. **A24 resize semantics.** For the profile photo, does "resize" mean small/medium/large diameter,
   or also a full-width banner? Same question for the email collector: fixed card or full-width bar?
2. **A24 canvas model.** Free-form (elements side by side) or single-column (blocks stack, only
   order and height change)? *Recommendation: single-column — free-form breaks on narrow screens.*
3. **Session/password hardening now or later** (B3/B4/A25)? *Recommendation: now, before ten real logins exist.*
4. **Can models edit their own page, or only view analytics?** Today a model gets the full editor.
5. **B13 collections vs per-link country rules** — which one owns the per-country link destinations?
6. **Supabase plan** (B8) — pay, or accept the page breaking after ~1 week of no traffic?
7. Snapchat's pill colour — client's own pick, still outstanding.
8. A placeholder profile photo for Ava.
