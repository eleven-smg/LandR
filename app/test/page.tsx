import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"

export default async function TestPage() {
  const { data, error } = await supabaseAdmin.from("creators").select("*")
  if (error) {
    return <pre>Error: {error.message}</pre>
  }
  return (
    <pre>
Connected! Creators in your database:

{JSON.stringify(data, null, 2)}
    </pre>
  )
}
