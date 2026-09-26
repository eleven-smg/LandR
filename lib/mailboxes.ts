/**
 * Nobody can whitelist a sender on the subscriber's behalf -- no API exists for
 * it in any mail provider. What can be done is land the subscriber on the exact
 * screen where they do it themselves, with the steps written for their own
 * provider rather than generic advice.
 *
 * Provider is guessed from the address domain. Only stable, long-lived URLs are
 * used as deep links; where a provider has no reliable settings URL the link is
 * null and the steps carry the whole job, because a dead link in this flow is
 * worse than no link.
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
  steps: string[]
}

export const WHITELIST_DEFAULTS = {
  title: "Want every update?",
  note: "Say yes and I will show you the one tap that keeps my emails in your main inbox instead of spam.",
  yes: "Yes, keep me updated",
  no: "No thanks",
}

const DOMAIN_MAP: Array<{ id: MailboxId; domains: string[] }> = [
  { id: "gmail", domains: ["gmail.com", "googlemail.com"] },
  {
    id: "outlook",
    domains: ["outlook.com", "hotmail.com", "live.com", "msn.com", "outlook.co.uk", "hotmail.co.uk"],
  },
  { id: "yahoo", domains: ["yahoo.com", "ymail.com", "rocketmail", "yahoo.co.uk", "yahoo.fr", "yahoo.de"] },
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
      steps: [
        "On the Junk email settings screen, under Safe senders and domains, press Add and type " + sender + ".",
        "Press Save.",
        "Go back to Junk Email, open my mail if it is sitting there and press Not junk.",
        "Optional: add me to your contacts as well.",
      ],
    }
  }

  if (id === "yahoo" || id === "aol") {
    return {
      id,
      label: id === "aol" ? "AOL Mail" : "Yahoo Mail",
      inboxUrl: id === "aol" ? "https://mail.aol.com/" : "https://mail.yahoo.com/",
      actionUrl: null,
      actionLabel: null,
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
    steps: [
      "Open your Spam or Junk folder and find my mail.",
      "Open it and press Not spam, or move it to your inbox.",
      "Add " + sender + " to your contacts or address book. Every mail provider trusts a contact.",
      "If your provider has a safe senders, allow list or filter setting, add " + sender + " there too.",
    ],
  }
}
