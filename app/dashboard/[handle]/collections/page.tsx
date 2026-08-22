import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"

// Collections group several creator pages under one label so a single operator
// can filter analytics across them. There is no `collections` table yet, so
// this lists the pages that exist and states plainly what is missing rather
// than pretending to save something.
export default async function CollectionsPage() {
  const { data } = await supabaseAdmin
    .from("creators")
    .select("handle, display_name")
    .order("created_at", { ascending: true })
    .limit(200)

  const rows = (data || []) as unknown as Array<{ handle: string; display_name: string | null }>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Collections</div>
        <div className="page-sub">Group pages together so analytics can be filtered across them.</div>
      </div>

      <div className="collections-header">
        <div className="page-sub">
          {rows.length} page{rows.length === 1 ? "" : "s"} available to group
        </div>
      </div>

      <div className="breakdown-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Handle</th>
              <th>Collection</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.handle}>
                <td>{r.display_name || r.handle}</td>
                <td>/{r.handle}</td>
                <td>
                  <span className="badge">Ungrouped</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="empty-state">
        Creating collections needs a `collections` table and a column on `creators` to point at it.
        <br />
        Nothing here saves yet, so the button is deliberately absent.
      </div>
    </div>
  )
}
