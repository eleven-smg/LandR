# LandaMail — email program plan

Written 26 Sep 2026. Covers what the collected addresses are for, how they are
stored and segmented, what sends them, and what can honestly be done about
spam. Nothing here has been built except the storage layer marked DONE.

## 1. Storage and segmentation (DONE, live)

`subscribers` now carries `country`, `region`, `city` and `tier`, written at
signup from the Vercel geo headers (`x-vercel-ip-country`,
`x-vercel-ip-country-region`, `x-vercel-ip-city`) — the same source analytics
has always used for `page_views` and `link_clicks`.

- `tier` is `first` / `second` / `third`, resolved from `lib/countryGroups.ts`
  TIERS, the same list the country rules picker shows. One taxonomy, so a
  mailing bucket and a geo rule cannot disagree.
- The tier is frozen at signup. Re-filing a country later must never silently
  move people who were already mailed.
- Unknown country (proxy, VPN, missing header) stores `null`, never a guessed
  tier. Treat `null` as its own bucket when sending.
- Indexes: `(creator_id, country)` and `(creator_id, tier)`, so "everyone in
  the US" and "everyone in the third world bucket" are both one cheap query.
- Export: `/dashboard/<handle>/export?what=subscribers` carries Country,
  Region, City and Tier, and accepts `&country=US` or `&tier=first` to hand
  over a single-country or single-tier list.

So "save the mail by first / second / third world, and by country inside that"
is satisfied by two columns rather than separate files: any file you want is a
filter over the same table, and one address can never drift out of sync between
two copies of the list.

## 2. What the list is for

Ranked by how much money each use is worth against how likely it is to burn the
domain. The first three are the reason to have a list at all.

1. **Platform-move insurance.** The real asset. If an account is banned or a
   platform dies, email is the only channel that still reaches the fans. One
   "she is now here" mail recovers an audience that would otherwise be gone.
2. **New-drop and restock announcements.** Per model, sent from her page's
   list, not the whole platform's.
3. **Back-catalogue and win-back.** People who subscribed and never clicked:
   one re-engagement mail every few months, then stop mailing them. Dead weight
   on a list is what pushes live mail into spam.
4. **Geo-priced offers.** The tier columns exist for this. Same offer, three
   price points, or an offer only sent where the payment method works.
5. **Country-timed sends.** Send at 8pm local, not 8pm Lagos. `region` and
   `city` are already stored, so this needs no new capture.
6. **Platform announcements** (LandR itself): new templates, new features, to
   models rather than fans. Keep this on a different sending identity from fan
   mail — different audience, different complaint profile.

Rule to keep: fan mail is sent per model page. A fan who subscribed on `/ava`
never gets mail about another model unless she opted in on that page too. That
is both the law in most of these countries and the difference between a list
that lasts and a list that gets reported.

## 3. Where LandaMail lives

**Recommendation: one app, one database, a Mail tab in the dashboard.** Not a
second product.

The list, the pages, the countries and the click history are all in this
Supabase project. Splitting the sender into a separate app at `landamail.com`
means copying subscribers between two databases and keeping them in sync
forever — the exact class of bug that makes someone get mailed after they
unsubscribed. Nothing about a separate app improves deliverability either; what
actually decides that is the **sending domain**, and a separate sending domain
can be used from inside this app.

So:

- Feature lives at `/dashboard/<handle>/mail`, beside Analytics and Team.
- Mail is sent from a dedicated subdomain, e.g. `mail.<brand>.com` or
  `send.<brand>.com`, never from the root domain the pages are served on. If
  the list ever gets burned, the root domain and the pages survive it.
- `landamail.com` can still be bought as the sending identity and the brand on
  the mail footer. That is a DNS decision, not a second codebase.

## 4. Sending system

Three tables, one route, one cron. No mailing-list SaaS.

- `campaigns` — id, creator_id, subject, body, audience filter (country / tier
  / all / unclicked), status (draft, sending, sent, paused), created_at,
  sent_at, counts.
- `campaign_recipients` — campaign_id, subscriber_id, status (queued, sent,
  bounced, complained, skipped), sent_at, error. The audience is **frozen into
  rows when the campaign is queued**, so a send cannot change shape halfway
  through, and a retry cannot mail anyone twice.
- `email_events` — subscriber_id, campaign_id, type (delivered, open, click,
  bounce, complaint), created_at. Fed by the provider webhook.

Flow: compose in the Mail tab → preview against a real subscriber row → queue
(writes recipients) → a Vercel cron route drains a few hundred at a time,
marking each row as it goes → webhook writes events back. Batching through a
cron rather than one long request is what keeps a 10,000-address send from
dying at the serverless timeout.

Provider: **Resend** (Step 24) for the actual SMTP. It needs your API key and
must not ship before the unsubscribe path exists (B26). Everything above is
provider-agnostic — swapping Resend for SES later touches one file.

## 5. Spam — what is actually possible

Honest answer first: **there is no way to programmatically whitelist yourself.**
No redirect, no script, no flag on subscribe can reach into Gmail and mark your
address as trusted. Anyone who claims otherwise is selling something. What you
can do is stop looking like spam, and ask the subscriber to do the one thing
only they can do.

What we control, in order of effect:

1. **Authenticate the sending subdomain.** SPF, DKIM and DMARC records on
   `mail.<brand>.com`. Unauthenticated mail from a new domain goes to spam
   essentially every time. This is the single biggest lever.
2. **Double opt-in.** The subscribe form sends a "confirm your email" mail; the
   address is only mailable after the click. It costs perhaps 20% of signups
   and it is worth it: a confirmed list has almost no bounces or complaints,
   and bounce rate is what providers judge you on.
3. **One-click unsubscribe** in the header and the footer of every mail
   (List-Unsubscribe). A signed HMAC link, no table needed. People who cannot
   find the unsubscribe press "report spam" instead, and that is the thing that
   kills a domain.
4. **Warm up.** Do not send 5,000 mails on day one from a fresh domain. Tens,
   then hundreds, then thousands over two to three weeks.
5. **Suppress hard bounces and complaints permanently**, automatically, from
   `email_events`. Never mail them again even if they resubscribe.
6. **Plain content.** Real sentences, one clear link, no all-image mails, no
   URL shorteners, no link-shortener domains in the body, a plain-text part
   alongside the HTML. Adult-adjacent copy is already scrutinised more; do not
   add spam-filter triggers on top.

What the subscriber does, and how we ask (this is the "redirect to remove us
from spam" step, done the way that actually works):

- After subscribing, the page shows a short screen, not a redirect off-site:
  "Check your inbox for a mail from `<name> <hello@mail.brand.com>`. If it is
  not there, look in Spam or Promotions, open it, and press **Not spam** — then
  reply or add the address to your contacts."
- Name the exact from-address on that screen, and repeat it in the confirmation
  mail. "Move it to Primary" and "add to contacts" are instructions the fan can
  act on; a whitelist API does not exist.
- Gmail-specific nicety: a "drag this to your Primary tab" line. Small, free,
  measurably effective.

## 6. Build order

1. ~~`subscribers.country` / `region` / `city` / `tier` + segmented export~~ —
   DONE, live.
2. B26 unsubscribe path: signed HMAC link, `unsubscribed_at` already exists.
   Blocks everything that sends.
3. Double opt-in (`confirmed_at` column + confirm route) and the post-subscribe
   instruction screen.
4. DNS: sending subdomain, SPF, DKIM, DMARC. Needs the domain purchase.
5. Step 24 Resend wiring. Needs the API key.
6. `campaigns` / `campaign_recipients` / `email_events` + the Mail tab and the
   cron drain.
7. Webhook, suppression list, per-campaign stats in the dashboard.

Steps 2 and 3 need nothing from you and can be built now. Steps 4 and 5 are
waiting on the domain and the key.
