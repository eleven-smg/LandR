/**
 * Phone keyboards capitalise the first letter of anything typed into the
 * address bar, so /Ava was arriving as a different handle from /ava and the
 * page genuinely could not be found. Handles are matched without case now, and
 * the wildcard characters LIKE treats specially are escaped so a handle can
 * never turn into a pattern.
 */
export function likeSafeHandle(raw: string): string {
  return String(raw || "").replace(/[\\%_]/g, (character) => "\\" + character)
}

/**
 * Routes that would be shadowed by a page handle at the root of the site.
 * A model called "signin" would make the sign-in page unreachable.
 */
export const RESERVED_HANDLES = [
  "dashboard",
  "signin",
  "signout",
  "register",
  "api",
  "go",
  "admin",
  "compare",
  "creator",
  "favicon.ico",
  "_next",
]

/** Lowercases, trims and drops a leading @ so "@Ava " and "ava" agree. */
export function normalizeHandle(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
}

/**
 * Returns an error message, or "" when the handle is usable. Kept as a message
 * rather than a boolean so the form can say what is wrong.
 */
export function handleProblem(raw: string): string {
  const handle = normalizeHandle(raw)
  if (!handle) return "Pick a page address."
  if (handle.length < 2) return "That page address is too short."
  if (handle.length > 32) return "That page address is too long."
  if (!/^[a-z0-9._-]+$/.test(handle)) return "Use only letters, numbers, dots, dashes and underscores."
  if (RESERVED_HANDLES.includes(handle)) return "That page address is reserved."
  return ""
}

/** Same rules as a handle, minus the reserved-route list. */
export function usernameProblem(raw: string): string {
  const username = normalizeHandle(raw)
  if (!username) return "Pick a username."
  if (username.length < 3) return "That username is too short."
  if (username.length > 32) return "That username is too long."
  if (username.includes("@")) return "A username cannot contain @."
  if (!/^[a-z0-9._-]+$/.test(username)) return "Use only letters, numbers, dots, dashes and underscores."
  return ""
}
