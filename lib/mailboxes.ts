/**
 * Nobody can whitelist a sender on the subscriber's behalf -- no mail provider
 * exposes an API or a URL for "trust this address", and anything claiming to is
 * lying. Two things can be done from a link, and both are real:
 *
 *   compose  Open a prefilled draft addressed to the creator. Sending it is the
 *            strongest trust signal there is: Gmail and most providers add the
 *            people you email to your contacts, and mail from a contact is not
 *            filed as spam. This is the default.
 *   inbox    Drop the subscriber on their own mailbox, searched for the
 *            sender where the provider allows it, or on the safe-senders screen
 *            where one exists (Outlook, Proton), so "Not spam" is one tap away.
 *
 * On phones both modes prefer mailto:, because the OS then offers whichever
 * mail app is installed and no web login can get in the way. On desktop the
 * provider's own web compose URL is used instead, which arrives already signed
 * in.
 */

export type MailboxId =
  | "gmail"
  | "outlook"
  | "yahoo"
  | "icloud"
  | "proton"
  | "aol"
  | "zoho"
  | "gmx"
  | "yandex"
  | "other"

export type Mailbox = {
  id: MailboxId
  label: string
  /** Opens the mailbox itself, for "go and look for it now". */
  inboxUrl: string | null
  /** The screen where the sender is trusted, when the provider has one. */
  actionUrl: string | null
  actionLabel: string | null
  /** Web compose, already signed in. Null where no stable URL exists. */
  composeUrl: string | null
  steps: string[]
}

export type RedirectMode = "compose" | "inbox" | "page" | "off"

export const REDIRECT_MODES: RedirectMode[] = ["compose", "inbox", "page", "off"]

export const WHITELIST_DEFAULTS = {
  title: "Want every update?",
  note: "Say yes and I will show you the one tap that keeps my emails in your main inbox instead of spam.",
  yes: "Yes, keep me updated",
  no: "No thanks",
  composeSubject: "Add me to your updates",
  composeBody:
    "Just subscribed. Sending this so your emails land in my inbox instead of spam -- no reply needed.",
}

export function normalizeRedirectMode(raw: unknown): RedirectMode {
  const clean = String(raw || "").trim().toLowerCase()
  return (REDIRECT_MODES as string[]).includes(clean) ? (clean as RedirectMode) : "compose"
}

const DOMAIN_MAP: Array<{ id: MailboxId; domains: string[] }> = [
  { id: "gmail", domains: ["gmail.com", "googlemail.com"] },
  {
    id: "outlook",
    domains: ["outlook.com", "hotmail.com", "live.com", "msn.com", "outlook.co.uk", "hotmail.co.uk"],
  },
  { id: "yahoo", domains: ["yahoo.com", "ymail.com", "rocketmail.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de"] },
  { id: "icloud", domains: ["icloud.com", "me.com", "mac.com"] },
  { id: "proton", domains: ["proton.me", "protonmail.com", "pm.me"] },
  { id: "aol", domains: ["aol.com"] },
  { id: "zoho", domains: ["zoho.com", "zohomail.com"] },
  { id: "gmx", domains: ["gmx.com", "gmx.de", "gmx.net", "mail.com"] },
  { id: "yandex", domains: ["yandex.com", "yandex.ru", "ya.ru"] },
]

/** "someone@Gmail.com " and a bare "gmail.com" both resolve. */
export function mailboxDomain(raw: string | null | undefined): string {
  const clean = String(raw || "").trim().toLowerCase()
  if (!clean) return ""
  const at = clean.lastIndexOf("@")
  const domain = at === -1 ? clean : clean.slice(at + 1)
  return domain.replace(/[^a-z0-9.-]/g, "")
}

export function mailboxIdFor(raw: string | null | undefined): MailboxId {
  const domain = mailboxDomain(raw)
  if (!domain) return "other"
  for (const entry of DOMAIN_MAP) {
    if (entry.domains.some((known) => domain === known || domain.endsWith("." + known))) return entry.id
  }
  return "other"
}

/**
 * The steps are written for a person, not an admin: what to tap, in order, with
 * the sender's real address in the sentence. "Add to contacts" is in every
 * list because it is the one signal every provider respects.
 */
export function mailboxFor(raw: string | null | undefined, fromEmail: string): Mailbox {
  const id = mailboxIdFor(raw)
  const from = String(fromEmail || "").trim()
  const sender = from || "my email address"
  const search = encodeURIComponent("from:" + from)

  if (id === "gmail") {
    return {
      id,
      label: "Gmail",
      inboxUrl: "https://mail.google.com/mail/u/0/#inbox",
      actionUrl: from ? "https://mail.google.com/mail/u/0/#search/" + search + "+in%3Aanywhere" : null,
      actionLabel: from ? "Find my email in Gmail" : null,
      composeUrl: "https://mail.google.com/mail/?view=cm&fs=1",
      steps: [
        "Open my email. If it is not in your inbox, look in the Spam folder and the Promotions tab.",
        "If it landed in Spam, press Not spam. If it landed in Promotions, drag it to Primary and choose Yes when Gmail offers to do that every time.",
        "Tap my name at the top of the mail, then Add to contacts. Gmail almost never sends mail from a contact to spam.",
        "Strongest option: Settings, then Filters and blocked addresses, then Create a new filter. Put " +
          sender +
          " in From and tick Never send it to Spam.",
      ],
    }
  }

  if (id === "outlook") {
    return {
      id,
      label: "Outlook",
      inboxUrl: "https://outlook.live.com/mail/0/",
      actionUrl: "https://outlook.live.com/mail/0/options/mail/junkEmail",
      actionLabel: "Open safe senders",
      composeUrl: "https://outlook.live.com/mail/0/deeplink/compose",
      steps: [
        "On the Junk email settings screen, under Safe senders and domains, press Add and type " + sender + ".",
        "Press Save.",
        "Go back to Junk Email, open my mail if it is sitting there and press Not junk.",
        "Optional: add me to your contacts as well.",
      ],
    }
  }

  if (id === "yahoo" || id === "aol") {
    const aol = id === "aol"
    return {
      id,
      label: aol ? "AOL Mail" : "Yahoo Mail",
      inboxUrl: aol ? "https://mail.aol.com/" : "https://mail.yahoo.com/",
      actionUrl: null,
      actionLabel: null,
      composeUrl: aol ? null : "https://compose.mail.yahoo.com/",
      steps: [
        "Open the Spam folder. If my mail is there, open it and press Not spam.",
        "Add " + sender + " to your contacts.",
        "For good: Settings, then More settings, then Filters. Add a filter where From contains " +
          sender +
          " and the folder is Inbox.",
      ],
    }
  }

  if (id === "icloud") {
    return {
      id,
      label: "iCloud Mail",
      inboxUrl: "https://www.icloud.com/mail",
      actionUrl: null,
      actionLabel: null,
      composeUrl: null,
      steps: [
        "Open the Junk folder. If my mail is there, move it to your Inbox and press Not Junk.",
        "Save " + sender + " to your Contacts. On iPhone the card below does it in one tap.",
        "Optional: open the mail, tap my name and choose Add to VIP so you get a notification every time.",
      ],
    }
  }

  if (id === "proton") {
    return {
      id,
      label: "Proton Mail",
      inboxUrl: "https://mail.proton.me/u/0/inbox",
      actionUrl: "https://mail.proton.me/u/0/allow-block-list",
      actionLabel: "Open allow list",
      composeUrl: null,
      steps: [
        "On the allow list screen, add " + sender + ".",
        "If my mail is in Spam, open it and press Move to inbox.",
        "Optional: add me to your contacts too.",
      ],
    }
  }

  const named: Record<string, { label: string; inbox: string }> = {
    zoho: { label: "Zoho Mail", inbox: "https://mail.zoho.com/" },
    gmx: { label: "GMX / Mail.com", inbox: "https://www.gmx.com/" },
    yandex: { label: "Yandex Mail", inbox: "https://mail.yandex.com/" },
  }
  const fallback = named[id]

  return {
    id: fallback ? id : "other",
    label: fallback ? fallback.label : "your email app",
    inboxUrl: fallback ? fallback.inbox : null,
    actionUrl: null,
    actionLabel: null,
    composeUrl: null,
    steps: [
      "Open your Spam or Junk folder and find my mail.",
      "Open it and press Not spam, or move it to your inbox.",
      "Add " + sender + " to your contacts or address book. Every mail provider trusts a contact.",
      "If your provider has a safe senders, allow list or filter setting, add " + sender + " there too.",
    ],
  }
}

/** Works in every mail app on every device, and lets the OS pick the app. */
export function mailtoUrl(to: string, subject: string, body: string): string {
  return (
    "mailto:" +
    encodeURIComponent(to) +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body)
  )
}

/**
 * A prefilled draft to the creator. Empty string when there is no address to
 * write to yet, so the caller can fall back instead of opening a blank draft.
 */
export function composeTarget(args: {
  mailbox: Mailbox
  to: string
  subject: string
  body: string
  mobile: boolean
}): string {
  const to = String(args.to || "").trim()
  if (!to) return ""
  if (args.mobile || !args.mailbox.composeUrl) return mailtoUrl(to, args.subject, args.body)

  const joiner = args.mailbox.composeUrl.includes("?") ? "&" : "?"
  const subjectKey = args.mailbox.id === "gmail" ? "su" : "subject"
  return (
    args.mailbox.composeUrl +
    joiner +
    "to=" +
    encodeURIComponent(to) +
    "&" +
    subjectKey +
    "=" +
    encodeURIComponent(args.subject) +
    "&body=" +
    encodeURIComponent(args.body)
  )
}

/** The sender's mail, the safe-sender screen, or failing both the mailbox. */
export function inboxTarget(mailbox: Mailbox): string {
  return mailbox.actionUrl || mailbox.inboxUrl || ""
}

/**
 * One decision in one place: given the page's chosen mode and the address that
 * was just typed in, where does the browser go next. Falls back rather than
 * failing -- compose without a sending address becomes inbox, and a provider
 * with no usable URL becomes the walkthrough page, so the subscriber always
 * lands somewhere useful.
 */
export function resolveRedirect(args: {
  mode: unknown
  address: string
  handle: string
  fromEmail: string
  subject: string
  body: string
  mobile: boolean
}): { url: string; kind: RedirectMode } {
  const mode = normalizeRedirectMode(args.mode)
  const page = "/" + args.handle + "/whitelist?mb=" + encodeURIComponent(mailboxDomain(args.address))

  if (mode === "off") return { url: "", kind: "off" }
  if (mode === "page") return { url: page, kind: "page" }

  const mailbox = mailboxFor(args.address, args.fromEmail)

  if (mode === "compose") {
    const compose = composeTarget({
      mailbox,
      to: args.fromEmail,
      subject: args.subject,
      body: args.body,
      mobile: args.mobile,
    })
    if (compose) return { url: compose, kind: "compose" }
  }

  const inbox = inboxTarget(mailbox)
  if (inbox) return { url: inbox, kind: "inbox" }
  return { url: page, kind: "page" }
}
