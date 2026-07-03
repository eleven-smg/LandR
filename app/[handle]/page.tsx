import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { logPageView } from "@/lib/analytics"

export const dynamic = "force-dynamic"

type Destination = { url: string; disabled?: boolean }
type LinkRow = {
  id: string
  label: string
  icon: string | null
  destinations: Destination[]
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("*")
    .eq("handle", handle)
    .single()

  if (!creator) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-300">
        <p>This page does not exist.</p>
      </main>
    )
  }

  await logPageView(creator.id, "/" + handle)

  const { data: links } = await supabaseAdmin
    .from("links")
    .select("*")
    .eq("creator_id", creator.id)
    .eq("is_active", true)
    .order("position", { ascending: true })

  const initial = (creator.display_name || creator.handle || "?")
    .charAt(0)
    .toUpperCase()

  const linkRows = (links || []) as LinkRow[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-5 py-14 text-neutral-100">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 to-rose-400 text-3xl font-semibold text-white shadow-lg">
          {initial}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {creator.display_name || creator.handle}
        </h1>
        {creator.bio ? (
          <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-neutral-400">
            {creator.bio}
          </p>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3">
          {linkRows.map((link) => (
            <a
              key={link.id}
              href={"/go/" + link.id}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[56px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-center text-base font-medium backdrop-blur transition hover:scale-[1.02] hover:bg-white/10 active:scale-100"
            >
              {link.icon ? <span className="mr-2">{link.icon}</span> : null}
              {link.label}
            </a>
          ))}
          {linkRows.length === 0 ? (
            <p className="mt-4 text-center text-sm text-neutral-500">No links yet.</p>
          ) : null}
        </div>

        <p className="mt-12 text-xs text-neutral-600">powered by LandR</p>
      </div>
    </main>
  )
}
