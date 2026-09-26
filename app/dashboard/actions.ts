"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSession } from "@/lib/session"
import { likeSafeHandle, normalizeHandle, handleProblem, usernameProblem } from "@/lib/handles"

function back(message: string): never {
  revalidatePath("/dashboard")
  redirect("/dashboard?msg=" + encodeURIComponent(message))
}

/**
 * Model side: add a creator to my team by email. This only creates a request --
 * the creator has to accept it before he can see anything.
 */
export async function inviteCreator(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
  if (!email || !email.includes("@")) back("Enter the creator's email address.")

  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .ilike("email", likeSafeHandle(email))
    .limit(2)

  const rows = data || []
  if (rows.length !== 1) back("No single account matches that email.")

  const creatorAccountId = String(rows[0].id)
  if (creatorAccountId === account.id) back("You cannot add yourself.")

  const { data: existing } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("creator_account_id", creatorAccountId)
    .eq("model_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (existing) {
    const status = String((existing as Record<string, unknown>).status)
    if (status === "active") back("That creator already manages your page.")
    if (status === "pending") back("That request is already waiting to be accepted.")

    // A previously revoked link is re-opened as a fresh request rather than
    // resurrected as active, so the creator has to accept again.
    await supabaseAdmin
      .from("creator_clients")
      .update({ status: "pending", invited_by: "model", responded_at: null, release_requested_at: null })
      .eq("id", String((existing as Record<string, unknown>).id))

    back("Request sent again.")
  }

  await supabaseAdmin.from("creator_clients").insert({
    creator_account_id: creatorAccountId,
    model_account_id: account.id,
    status: "pending",
    invited_by: "model",
  })

  back("Request sent. The creator has to accept it.")
}

/** Creator side: accept or decline a model's request. */
export async function respondToRequest(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const linkId = String(formData.get("linkId") || "")
  const accept = String(formData.get("decision") || "") === "accept"
  if (!linkId) back("Nothing to respond to.")

  // Scoped to this creator so a guessed id cannot be answered on someone
  // else's behalf.
  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link || String((link as Record<string, unknown>).status) !== "pending") back("That request is no longer open.")

  await supabaseAdmin
    .from("creator_clients")
    .update({ status: accept ? "active" : "revoked", responded_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)

  back(accept ? "Accepted. The model is now one of your clients." : "Request declined.")
}

/**
 * Model side: end the arrangement.
 *
 * If she invited the creator herself she can leave at any time and access ends
 * immediately. If the creator created her account and built her page, she can
 * only *ask* to be released -- the creator has to agree, so the work can be
 * paid for or she can start afresh on her own account.
 */
export async function disconnectCreator(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const linkId = String(formData.get("linkId") || "")
  const note = String(formData.get("note") || "").trim()
  if (!linkId) back("Nothing to disconnect.")

  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status, invited_by")
    .eq("id", linkId)
    .eq("model_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link) back("That connection no longer exists.")

  const row = link as Record<string, unknown>
  const invitedBy = String(row.invited_by)
  const status = String(row.status)

  if (status === "pending") {
    await supabaseAdmin.from("creator_clients").update({ status: "revoked" }).eq("id", linkId).eq("model_account_id", account.id)
    back("Request withdrawn.")
  }

  if (invitedBy === "model") {
    await supabaseAdmin
      .from("creator_clients")
      .update({ status: "revoked", responded_at: new Date().toISOString() })
      .eq("id", linkId)
      .eq("model_account_id", account.id)

    back("Creator disconnected. They no longer have access.")
  }

  if (status === "release_requested") back("Your release request is already with the creator.")

  await supabaseAdmin
    .from("creator_clients")
    .update({
      status: "release_requested",
      release_requested_at: new Date().toISOString(),
      release_note: note || null,
    })
    .eq("id", linkId)
    .eq("model_account_id", account.id)

  back("Release requested. This creator set up your page, so he has to approve it.")
}

/** Creator side: grant a release that was asked for. */
export async function approveRelease(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const linkId = String(formData.get("linkId") || "")
  if (!linkId) back("Nothing to release.")

  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link || String((link as Record<string, unknown>).status) !== "release_requested") {
    back("There is no open release request on that client.")
  }

  await supabaseAdmin
    .from("creator_clients")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)

  back("Released. The model now runs her page alone.")
}

/** Creator side: refuse a release request, which puts the link back to active. */
export async function refuseRelease(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const linkId = String(formData.get("linkId") || "")
  if (!linkId) back("Nothing to refuse.")

  await supabaseAdmin
    .from("creator_clients")
    .update({ status: "active", release_requested_at: null })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .eq("status", "release_requested")

  back("Release refused. The arrangement continues.")
}

/**
 * Creator side: create a model from scratch.
 *
 * The new account owns its page -- ownership is never held by the creator --
 * and the link is written as active with invited_by = "creator", which is what
 * later stops her from disconnecting without his agreement. She signs in with
 * the username and password and can add an email herself later.
 */
export async function createModelAccount(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")

  const displayName = String(formData.get("displayName") || "").trim()
  const username = normalizeHandle(String(formData.get("username") || ""))
  const password = String(formData.get("password") || "")
  const handle = normalizeHandle(String(formData.get("handle") || ""))

  const usernameIssue = usernameProblem(username)
  if (usernameIssue) back(usernameIssue)

  const handleIssue = handleProblem(handle)
  if (handleIssue) back(handleIssue)

  if (password.length < 6) back("Give her a password of at least 6 characters.")

  const { data: takenUser } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .ilike("username", likeSafeHandle(username))
    .limit(1)
    .maybeSingle()
  if (takenUser) back("That username is already taken.")

  const { data: takenHandle } = await supabaseAdmin
    .from("creators")
    .select("id")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()
  if (takenHandle) back("That page address is already taken.")

  const { data: created, error } = await supabaseAdmin
    .from("accounts")
    .insert({
      username,
      email: null,
      name: displayName || username,
      password,
      role: "model",
    })
    .select("id")
    .single()

  if (error || !created) back("Could not create that account.")

  const modelAccountId = String((created as Record<string, unknown>).id)

  const { error: pageError } = await supabaseAdmin.from("creators").insert({
    handle,
    display_name: displayName || username,
    account_id: modelAccountId,
  })

  if (pageError) {
    // Do not leave a login with no page behind.
    await supabaseAdmin.from("accounts").delete().eq("id", modelAccountId)
    back("Could not create that page.")
  }

  await supabaseAdmin.from("creator_clients").insert({
    creator_account_id: account.id,
    model_account_id: modelAccountId,
    status: "active",
    invited_by: "creator",
    responded_at: new Date().toISOString(),
  })

  revalidatePath("/dashboard")
  redirect("/dashboard/" + handle)
}
