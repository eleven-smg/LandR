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
