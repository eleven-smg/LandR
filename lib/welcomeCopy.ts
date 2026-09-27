const NL = String.fromCharCode(10)

/**
 * The wording and the placeholder filler, kept in a file of their own with no
 * server imports, because the editor is a client component and the sender is
 * not. Both need the same defaults; only the sender may touch the network.
 */

export const WELCOME_DEFAULTS = {
  subject: "Thanks for subscribing",
  body: [
    "Hi {name},",
    "",
    "Thanks for subscribing -- you are on the list, and you will hear it here first.",
    "",
    "You can reply straight to this message. It comes to me, not to a robot.",
  ].join(NL),
}

/**
 * {name}, {handle} and {email} anywhere in the subject or the body. Somebody
 * who subscribed without giving a name becomes "there", so "Hi {name}," can
 * never go out reading "Hi ,".
 */
export function fillTemplate(
  template: string,
  vars: { name?: string | null; handle?: string | null; email?: string | null },
): string {
  return String(template || "")
    .split("{name}")
    .join(String(vars.name || "").trim() || "there")
    .split("{handle}")
    .join(String(vars.handle || ""))
    .split("{email}")
    .join(String(vars.email || ""))
}
