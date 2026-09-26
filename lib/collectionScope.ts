import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getManagedPages } from "@/lib/session"
import type { Account } from "@/lib/session"

/**
 * One place that answers "which collections may this account see, and which
 * pages does the chosen one cover?".
 *
 * Two screens need the same answer -- the analytics filter and the CSV export
 * route -- and they used to disagree: the filter listed every collection in the
 * workspace (so a model read other agencies' campaign names), and the export
 * ignored the filter completely (so a CSV downloaded from a collection view
 * held one page). Keeping the rule here means a route handler and a page cannot
 * drift apart again.
 *
 * A collection is somebody's own grouping of their own pages, so it is listed
 * when this account owns it, or when it groups at least one page this account
 * manages. Admins see all of them. Page membership is then narrowed to the
 * pages the viewer is allowed to read, never to the raw collection.
 */

/** A collection with no readable pages must total zero, not silently fall back
 *  to the page the viewer happens to be standing on. */
export const NO_COLLECTION_MATCH = "00000000-0000-0000-0000-000000000000"

export type CollectionOption = { id: string; name: string }

export type CollectionScope = {
  /** Collections safe to show this account, oldest first. */
  options: CollectionOption[]
  /** The chosen collection, or null when the request named none or named one it may not read. */
  selected: CollectionOption | null
  /** creator ids to query: the collection's readable pages, or just this page. */
  creatorIds: string[]
  /** How many readable pages the chosen collection holds. */
  pageCount: number
}

export async function resolveCollectionScope(args: {
  account: Account
  fallbackCreatorId: string
  wanted?: string | null
}): Promise<CollectionScope> {
  const { account, fallbackCreatorId } = args
  const isAdminAccount = account.role === "admin"

  const managed = await getManagedPages(account)
  const managedIds = managed.map((p) => p.id)

  const { data } = await supabaseAdmin
    .from("collections")
    .select("id, name, owner_account_id")
    .order("created_at", { ascending: true })

  const all = (data || []) as Array<Record<string, unknown>>
  let visible = all

  if (!isAdminAccount) {
    const linked = new Set<string>()
    if (managedIds.length > 0) {
      const { data: grouped } = await supabaseAdmin.from("creators").select("collection_id").in("id", managedIds)
      for (const row of (grouped || []) as Array<Record<string, unknown>>) {
        const id = row.collection_id ? String(row.collection_id) : ""
        if (id) linked.add(id)
      }
    }
    visible = all.filter((c) => {
      const owner = c.owner_account_id ? String(c.owner_account_id) : ""
      return (owner !== "" && owner === account.id) || linked.has(String(c.id))
    })
  }

  const options = visible.map((c) => ({
    id: String(c.id),
    name: String(c.name || "Untitled collection"),
  }))

  // Taken from the query string, so it is only honoured when it matches a
  // collection this account may already see.
  const wanted = String(args.wanted || "")
  const selected = options.find((c) => c.id === wanted) || null

  if (!selected) {
    return { options, selected: null, creatorIds: [fallbackCreatorId], pageCount: 0 }
  }

  let grouped = supabaseAdmin.from("creators").select("id").eq("collection_id", selected.id)
  if (!isAdminAccount) grouped = grouped.in("id", managedIds.length > 0 ? managedIds : [NO_COLLECTION_MATCH])
  const { data: groupedData } = await grouped

  const ids = ((groupedData || []) as Array<Record<string, unknown>>).map((c) => String(c.id))

  return {
    options,
    selected,
    creatorIds: ids.length > 0 ? ids : [NO_COLLECTION_MATCH],
    pageCount: ids.length,
  }
}

/** handle per creator id, so a CSV covering several pages can name each row. */
export async function handlesByCreatorId(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {}

  const { data } = await supabaseAdmin.from("creators").select("id, handle").in("id", ids)

  const map: Record<string, string> = {}
  for (const row of (data || []) as Array<Record<string, unknown>>) {
    map[String(row.id)] = String(row.handle || "")
  }
  return map
}
