import { TIERS, nameFor } from "@/lib/countryGroups"

export type TierId = "first" | "second" | "third"

export const TIER_IDS: TierId[] = ["first", "second", "third"]

/**
 * Which world tier a two letter country code belongs to, read from the same
 * TIERS table the country rules picker already shows. Reusing that taxonomy is
 * deliberate: a subscriber bucket and a geo rule can never disagree about
 * which tier a country is in, because there is only one list.
 *
 * An unknown or missing code returns null instead of guessing a tier, so a
 * visitor behind a proxy is never quietly filed as first world.
 */
export function tierForCountry(code: string | null | undefined): TierId | null {
  const clean = String(code || "").trim().toUpperCase()
  if (clean.length !== 2) return null
  for (const tier of TIERS) {
    if (tier.countries.some((entry) => entry.code === clean)) return tier.id as TierId
  }
  return null
}

export function isTierId(value: string): value is TierId {
  return TIER_IDS.indexOf(value as TierId) !== -1
}

export function tierLabel(id: string | null | undefined): string {
  const hit = TIERS.find((tier) => tier.id === String(id || ""))
  return hit ? hit.label : "Unknown"
}

export function countryLabel(code: string | null | undefined): string {
  const clean = String(code || "").trim().toUpperCase()
  return clean.length === 2 ? nameFor(clean) : "Unknown"
}
