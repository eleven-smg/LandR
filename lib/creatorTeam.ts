import { supabaseAdmin } from "@/lib/supabaseAdmin"

export type LinkStatus = "pending" | "active" | "release_requested" | "revoked"

export type TeamLink = {
  id: string
  creatorAccountId: string
  modelAccountId: string
  status: LinkStatus
  invitedBy: "model" | "creator"
  createdAt: string
  releaseNote: string | null
}

export type PersonSummary = {
  id: string
  label: string
  email: string | null
  username: string | null
  role: string
}

function toLink(row: Record<string, unknown>): TeamLink {
  return {
    id: String(row.id),
    creatorAccountId: String(row.creator_account_id),
    modelAccountId: String(row.model_account_id),
    status: String(row.status) as LinkStatus,
    invitedBy: String(row.invited_by) === "creator" ? "creator" : "model",
    createdAt: String(row.created_at || ""),
    releaseNote: row.release_note ? String(row.release_note) : null,
  }
}

/** Links where this account is the creator (what he manages, plus requests to him). */
export async function linksAsCreator(accountId: string): Promise<TeamLink[]> {
  const { data } = await supabaseAdmin
    .from("creator_clients")
    .select("id, creator_account_id, model_account_id, status, invited_by, created_at, release_note")
    .eq("creator_account_id", accountId)
    .neq("status", "revoked")
    .order("created_at", { ascending: true })

  return (data || []).map(toLink)
}

/** Links where this account is the model (who manages her). */
export async function linksAsModel(accountId: string): Promise<TeamLink[]> {
  const { data } = await supabaseAdmin
    .from("creator_clients")
    .select("id, creator_account_id, model_account_id, status, invited_by, created_at, release_note")
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
