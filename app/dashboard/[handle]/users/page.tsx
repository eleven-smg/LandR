import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function fmt(raw: string | null) {
  if (!raw) return ""
  const d = new Date(raw)
  if (isNaN(d.getTime())) return ""
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear()
}

// Every creator row is currently one operator of the platform. There is no
// separate accounts table and no email column, so handle stands in for login
// identity until sign-up exists.
export default async function UsersPage() {
  const { data } = await supabaseAdmin
    .from("creators")
    .select("id, handle, display_name, created_at, dashboard_password")
    .order("created_at", { ascending: true })
    .limit(200)

  const rows = (data || []) as unknown as Array<{
    id: string
    handle: string
    display_name: string | null
    created_at: string | null
    dashboard_password: string | null
  }>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Manage Users</div>
        <div className="page-sub">One row per creator page. Sign-up and per-user login are not built yet.</div>
      </div>

      <div className="breakdown-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Handle</th>
              <th>Own password</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id.slice(0, 8)}</td>
                <td>{r.display_name || r.handle}</td>
                <td>/{r.handle}</td>
                <td>{r.dashboard_password ? "Set" : "Not set"}</td>
                <td>
                  <span className="badge">Admin</span>
                </td>
                <td>{fmt(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-foot">
          Showing {rows.length} of {rows.length}
        </div>
      </div>

      <div className="empty-state">
        Everyone signs in with the single shared dashboard password from the environment variables.
        <br />
        The per-page password column exists but nothing checks it yet.
      </div>
    </div>
  )
}
