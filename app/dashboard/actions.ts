"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSession } from "@/lib/session"
import { likeSafeHandle, normalizeHandle, handleProblem, usernameProblem } from "@/lib/handles"

/**
 * Where to send the caller when an action is finished. These actions are used
 * from the creator home screen and from the Team tab of a page, so a fixed
 * "/dashboard" threw anyone acting from the tab off the screen they were
 * working on. The referer is accepted only as an internal dashboard path, so a
 * crafted one cannot redirect a signed-in user somewhere else.
 */
async function currentDashboardPath(): Promise<string> {
  try {
    const referer = (await headers()).get("referer") || ""
    if (!referer) return "/dashboard"
    const path = new URL(referer).pathname
    return path === "/dashboard" || path.startsWith("/dashboard/") ? path : "/dashboard"
  } catch {
    return "/dashboard"
  }
}

function back(message: string, to = "/dashboard"): never {
  revalidatePath(to)
  redirect(to + "?msg=" + encodeURIComponent(message))
}

/**
 * Model side: add a creator to my team by email. This only creates a request --
 * the creator has to accept it before he can see anything.
 */
export async function inviteCreator(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase()
  if (!email || !email.includes("@")) back("Enter the creator's email address.", to)

  const { data } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .ilike("email", likeSafeHandle(email))
    .limit(2)

  const rows = data || []
  if (rows.length !== 1) back("No single account matches that email.", to)

  const creatorAccountId = String(rows[0].id)
  if (creatorAccountId === account.id) back("You cannot add yourself.", to)

  const { data: existing } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("creator_account_id", creatorAccountId)
    .eq("model_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (existing) {
    const status = String((existing as Record<string, unknown>).status)
    if (status === "active") back("That creator already manages your page.", to)
    if (status === "pending") back("That request is already waiting to be accepted.", to)

    // A previously revoked link is re-opened as a fresh request rather than
    // resurrected as active, so the creator has to accept again. The old work
    // claim is cleared with it -- he declares again on the new acceptance.
    await supabaseAdmin
      .from("creator_clients")
      .update({
        status: "pending",
        invited_by: "model",
        responded_at: null,
        release_requested_at: null,
        work_claim: "none",
        work_claimed_by: null,
        work_claim_note: null,
        work_claimed_at: null,
        work_decided_at: null,
      })
      .eq("id", String((existing as Record<string, unknown>).id))

    back("Request sent again.", to)
  }

  await supabaseAdmin.from("creator_clients").insert({
    creator_account_id: creatorAccountId,
    model_account_id: account.id,
    status: "pending",
    invited_by: "model",
  })

  back("Request sent. The creator has to accept it.", to)
}

/**
 * Creator side: accept or decline a model's request.
 *
 * On accept he also says whether he is the one who will build and edit the
 * page. That is only a claim: it is written as "requested" and goes to her for
 * approval, because he must not be able to lock her in by himself. Either way
 * the link goes active immediately, so he learns where he stands before he
 * starts working.
 */
export async function respondToRequest(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  const accept = String(formData.get("decision") || "") === "accept"
  const claimsWork = String(formData.get("claimWork") || "") === "on"
  const claimNote = String(formData.get("claimNote") || "").trim()
  if (!linkId) back("Nothing to respond to.", to)

  // Scoped to this creator so a guessed id cannot be answered on someone
  // else's behalf.
  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link || String((link as Record<string, unknown>).status) !== "pending")
    back("That request is no longer open.", to)

  if (!accept) {
    await supabaseAdmin
      .from("creator_clients")
      .update({ status: "revoked", responded_at: new Date().toISOString() })
      .eq("id", linkId)
      .eq("creator_account_id", account.id)

    back("Request declined.", to)
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status: "active", responded_at: now }

  if (claimsWork) {
    update.work_claim = "requested"
    update.work_claimed_by = "creator"
    update.work_claim_note = claimNote || null
    update.work_claimed_at = now
    update.work_decided_at = null
  }

  await supabaseAdmin.from("creator_clients").update(update).eq("id", linkId).eq("creator_account_id", account.id)

  back(
    claimsWork
      ? "Accepted. She has been asked to confirm that you are the one building the page -- until she approves, she can still disconnect you at any time."
      : "Accepted. The model is now one of your clients.",
    to,
  )
}

/**
 * Model side: approve or decline the creator's claim that he is the one doing
 * the work. Approving is what makes it binding: from then on she cannot end the
 * arrangement on her own, she has to ask him. Declining changes nothing about
 * his access -- he simply keeps no hold over her.
 */
export async function respondToWorkClaim(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  const approve = String(formData.get("decision") || "") === "approve"
  if (!linkId) back("Nothing to respond to.", to)

  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, work_claim")
    .eq("id", linkId)
    .eq("model_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link || String((link as Record<string, unknown>).work_claim) !== "requested") {
    back("There is no open work claim on that connection.", to)
  }

  await supabaseAdmin
    .from("creator_clients")
    .update({ work_claim: approve ? "approved" : "declined", work_decided_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("model_account_id", account.id)
    .eq("work_claim", "requested")

  back(
    approve
      ? "Approved. This creator is building your page, so ending it now needs his agreement."
      : "Declined. He keeps access, and you can still disconnect him at any time.",
    to,
  )
}

/**
 * Creator side: take back a claim she has not answered yet. Only an unanswered
 * claim can be withdrawn -- an approved one is the agreement itself, and
 * dropping it belongs in a release.
 */
export async function withdrawWorkClaim(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  if (!linkId) back("Nothing to withdraw.", to)

  await supabaseAdmin
    .from("creator_clients")
    .update({ work_claim: "none", work_claimed_by: null, work_claim_note: null, work_claimed_at: null })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .eq("work_claim", "requested")

  back("Claim withdrawn.", to)
}

/**
 * Model side: end the arrangement.
 *
 * She can leave immediately when nothing ties her to the creator. Two things
 * tie her: he created her account and page, or she approved his claim that he
 * is the one putting in the work. In those cases she can only *ask* to be
 * released -- he has to agree, so the work can be paid for or she can start
 * afresh on her own account.
 */
export async function disconnectCreator(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  const note = String(formData.get("note") || "").trim()
  if (!linkId) back("Nothing to disconnect.", to)

  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status, invited_by, work_claim")
    .eq("id", linkId)
    .eq("model_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link) back("That connection no longer exists.", to)

  const row = link as Record<string, unknown>
  const invitedBy = String(row.invited_by)
  const status = String(row.status)
  const workClaim = String(row.work_claim || "none")

  if (status === "pending") {
    await supabaseAdmin.from("creator_clients").update({ status: "revoked" }).eq("id", linkId).eq("model_account_id", account.id)
    back("Request withdrawn.", to)
  }

  // An approved work claim removes the instant disconnect even though she was
  // the one who invited him. An unanswered claim does not -- she never agreed
  // to it, and walking away is her answer.
  const owesApproval = invitedBy === "creator" || workClaim === "approved"

  if (!owesApproval) {
    await supabaseAdmin
      .from("creator_clients")
      .update({
        status: "revoked",
        responded_at: new Date().toISOString(),
        work_claim: workClaim === "requested" ? "declined" : workClaim,
        work_decided_at: workClaim === "requested" ? new Date().toISOString() : null,
      })
      .eq("id", linkId)
      .eq("model_account_id", account.id)

    back("Creator disconnected. They no longer have access.", to)
  }

  if (status === "release_requested") back("Your release request is already with the creator.", to)

  await supabaseAdmin
    .from("creator_clients")
    .update({
      status: "release_requested",
      release_requested_at: new Date().toISOString(),
      release_note: note || null,
    })
    .eq("id", linkId)
    .eq("model_account_id", account.id)

  back(
    workClaim === "approved" && invitedBy === "model"
      ? "Release requested. You approved that this creator does the work, so he has to approve it."
      : "Release requested. This creator set up your page, so he has to approve it.",
    to,
  )
}

/** Creator side: grant a release that was asked for. */
export async function approveRelease(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  if (!linkId) back("Nothing to release.", to)

  const { data: link } = await supabaseAdmin
    .from("creator_clients")
    .select("id, status")
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .limit(1)
    .maybeSingle()

  if (!link || String((link as Record<string, unknown>).status) !== "release_requested") {
    back("There is no open release request on that client.", to)
  }

  await supabaseAdmin
    .from("creator_clients")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)

  back("Released. The model now runs her page alone.", to)
}

/** Creator side: refuse a release request, which puts the link back to active. */
export async function refuseRelease(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const linkId = String(formData.get("linkId") || "")
  if (!linkId) back("Nothing to refuse.", to)

  await supabaseAdmin
    .from("creator_clients")
    .update({ status: "active", release_requested_at: null })
    .eq("id", linkId)
    .eq("creator_account_id", account.id)
    .eq("status", "release_requested")

  back("Release refused. The arrangement continues.", to)
}

/**
 * Creator side: create a model from scratch.
 *
 * The new account owns its page -- ownership is never held by the creator --
 * and the link is written as active with invited_by = "creator", which is what
 * later stops her from disconnecting without his agreement. No work claim is
 * written: building the page is implied by having created it, and a claim only
 * exists to be approved by someone who did not ask for the arrangement.
 */
export async function createModelAccount(formData: FormData) {
  const account = await getSession()
  if (!account) redirect("/signin?next=/dashboard")
  const to = await currentDashboardPath()

  const displayName = String(formData.get("displayName") || "").trim()
  const username = normalizeHandle(String(formData.get("username") || ""))
  const password = String(formData.get("password") || "")
  const handle = normalizeHandle(String(formData.get("handle") || ""))

  const usernameIssue = usernameProblem(username)
  if (usernameIssue) back(usernameIssue, to)

  const handleIssue = handleProblem(handle)
  if (handleIssue) back(handleIssue, to)

  if (password.length < 6) back("Give her a password of at least 6 characters.", to)

  const { data: takenUser } = await supabaseAdmin
    .from("accounts")
    .select("id")
    .ilike("username", likeSafeHandle(username))
    .limit(1)
    .maybeSingle()
  if (takenUser) back("That username is already taken.", to)

  const { data: takenHandle } = await supabaseAdmin
    .from("creators")
    .select("id")
    .ilike("handle", likeSafeHandle(handle))
    .limit(1)
    .maybeSingle()
  if (takenHandle) back("That page address is already taken.", to)

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

  if (error || !created) back("Could not create that account.", to)

  const modelAccountId = String((created as Record<string, unknown>).id)

  const { error: pageError } = await supabaseAdmin.from("creators").insert({
    handle,
    display_name: displayName || username,
    account_id: modelAccountId,
  })

  if (pageError) {
    // Do not leave a login with no page behind.
    await supabaseAdmin.from("accounts").delete().eq("id", modelAccountId)
    back("Could not create that page.", to)
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
