import type { ReactNode } from "react"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { likeSafeHandle } from "@/lib/handles"
import ConsentBanner from "./ConsentBanner"

export const dynamic = "force-dynamic"

/**
 * Wraps every public page under /<handle> -- the profile itself and
 * /<handle>/whitelist. Route handlers such as contact.vcf do not pass through
 * a layout, so they are unaffected.
 *
 * This exists only to hang the consent banner outside page.tsx, which is 24 KB
 * and expensive to rewrite. One extra creators read per view, on a route that
 * is already force-dynamic.
 */
export default async function HandleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("consent_banner_enabled, consent_banner_text, consent_privacy_url")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()

  const enabled = !!creator && creator.consent_banner_enabled === true

  return (
    <>
      {children}
      {enabled ? (
        <ConsentBanner
          text={String(creator.consent_banner_text || "")}
          privacyUrl={String(creator.consent_privacy_url || "")}
        />
      ) : null}
    </>
  )
}
