import { supabaseAdmin } from "@/lib/supabaseAdmin"

export type LinkStatus = "pending" | "active" | "release_requested" | "revoked"

/**
 * Who is actually building the page.
 *
 * "requested" is a claim the creator made when he accepted; it is not binding
 * until the model approves it, which is what turns it into "approved". Only an
 * approved claim changes what she is allowed to do.
 */
export type WorkClaim = "none" | "requested" | "approved" | "declined"

export type TeamLink = {
  id: string
  creatorAccountId: string
  modelAccountId: string
  status: LinkStatus
  invitedBy: "model" | "creator"
  createdAt: string
  releaseNote: string | null
  workClaim: WorkClaim
  workClaimedBy: "model" | "creator" | null
  workClaimNote: string | null
}

export type PersonSummary = {
  id: string
  label: string
  email: string | null
  username: string | null
  role: string
}

const LINK_COLUMNS =
  "id, creator_account_id, model_account_id, status, invited_by, created_at, release_note, work_claim, work_claimed_by, work_claim_note"

function toWorkClaim(value: unknown): WorkClaim {
  const text = String(value || "none")
  return text === "requested" || text === "approved" || text === "declined" ? text : "none"
}

function toLink(row: Record<string, unknown>): TeamLink {
  const claimedBy = String(row.work_claimed_by || "")
  return {
    id: String(row.id),
    creatorAccountId: String(row.creator_account_id),
    modelAccountId: String(row.model_account_id),
    status: String(row.status) as LinkStatus,
    invitedBy: String(row.invited_by) === "creator" ? "creator" : "model",
    createdAt: String(row.created_at || ""),
    releaseNote: row.release_note ? String(row.release_note) : null,
    workClaim: toWorkClaim(row.work_claim),
    workClaimedBy: claimedBy === "creator" ? "creator" : claimedBy === "model" ? "model" : null,
    workClaimNote: row.work_claim_note ? String(row.work_claim_note) : null,
  }
}

/**
 * A release needs the creator's agreement in two cases: he created the account
 * and page himself, or the model approved his claim that he is the one putting
 * in the work. Anything else and she can walk away on her own.
 */
export function needsReleaseApproval(link: Pick<TeamLink, "invitedBy" | "workClaim">): boolean {
  return link.invitedBy === "creator" || link.workClaim === "approved"
}

/** Links where this account is the creator (what he manages, plus requests to him). */
export async function linksAsCreator(accountId: string): Promise<TeamLink[]> {
  const { data } = await supabaseAdmin
    .from("creator_clients")
    .select(LINK_COLUMNS)
    .eq("creator_account_id", accountId)
    .neq("status", "revoked")
    .order("created_at", { ascending: true })

  return (data || []).map(toLink)
}

/** Links where this account is the model (who manages her). */
export async function linksAsModel(accountId: string): Promise<TeamLink[]> {
  const { data } = await supabaseAdmin
    .from("creator_clients")
    .select(LINK_COLUMNS)
    .eq("model_account_id", accountId)
    .neq("status", "revoked")
    .order("created_at", { ascending: true })

  return (data || []).map(toLink)
}

/**
 * Looks up several accounts at once and returns a map by id. Two separate
 * queries are used instead of a Supabase embed because creator_clients has two
 * foreign keys to accounts, and an ambiguous embed fails at runtime rather
 * than at compile time.
 */
export async function peopleByIds(ids: string[]): Promise<Record<string, PersonSummary>> {
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return {}

  const { data } = await supabaseAdmin.from("accounts").select("id, email, username, name, role").in("id", unique)

  const map: Record<string, PersonSummary> = {}
  for (const row of data || []) {
    const person = row as Record<string, unknown>
    const id = String(person.id)
    map[id] = {
      id,
      label: String(person.name || person.email || person.username || "Unknown"),
      email: person.email ? String(person.email) : null,
      username: person.username ? String(person.username) : null,
      role: String(person.role || "model"),
    }
  }
  return map
}

export type PageTotals = { views: number; clicks: number }

/**
 * Views and clicks per page over a window, counted in one pass instead of two
 * queries per page. `limit` is raised because Supabase caps a select at 1000
 * rows by default and a silent cap would understate the numbers.
 */
export async function totalsByCreator(creatorIds: string[], sinceIso: string): Promise<Record<string, PageTotals>> {
  const totals: Record<string, PageTotals> = {}
  for (const id of creatorIds) totals[id] = { views: 0, clicks: 0 }

  if (creatorIds.length === 0) return totals

  const [views, clicks] = await Promise.all([
    supabaseAdmin
      .from("page_views")
      .select("creator_id")
      .in("creator_id", creatorIds)
      .gte("created_at", sinceIso)
      .limit(100000),
    supabaseAdmin
      .from("link_clicks")
      .select("creator_id")
      .in("creator_id", creatorIds)
      .gte("created_at", sinceIso)
      .limit(100000),
  ])

  for (const row of views.data || []) {
    const id = String((row as Record<string, unknown>).creator_id || "")
    if (totals[id]) totals[id].views += 1
  }
  for (const row of clicks.data || []) {
    const id = String((row as Record<string, unknown>).creator_id || "")
    if (totals[id]) totals[id].clicks += 1
  }

  return totals
}
