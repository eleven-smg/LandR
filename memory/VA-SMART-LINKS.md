# A31 — Manager / VA smart-link dashboards

Status: NOT STARTED; Proof: NONE. This specification belongs to PROGRESS.md Part 2; it does not replace the 24-step plan or current queue.

## User's reference
One manager has about 200 VAs. Each has a separate dashboard with 11 short/smart links routed to their assigned Telegram destination. Screenshot RECEIVED: Screenshot (118).png, Delphora Resources at delphoranetwork.portal.delphbot.com/va/resources. The visible page confirms 11 VA-specific branded links following the VA’s current Telegram assignment, plus a separate Telegram-account-specific link section. No original software vendor or internal implementation is established.

## Feasible explanation, not a finding about that platform
A single multi-tenant app/short domain can issue many database-backed link records without buying a separate subscription or domain for each VA. An existing agency/team product could also provide the same appearance. The screenshot identifies Delphora branding but does not distinguish custom software from a hosted/white-labelled product or prove domain ownership. Several shared domains can serve all VAs with different paths: 11 hosts do not imply 11 new domains per VA. Custom-domain registration/renewal and ownership/DNS access still matter; LandR can start with its existing domain.

## Proposed scope
- Manager can provision VA access and assign allowed models/campaigns/Telegram destinations. Preserve model ownership and current creator_clients semantics; VA access is a scoped assignment, never a page-ownership transfer.
- VA sees only their own assigned links and permitted analytics; manager sees the roster and aggregate performance.
- Default template has 11 link slots, configurable, with source/campaign labels, copy/share controls, status, destination and click counts. Bulk provisioning uses templates and idempotent assignment, not repeated third-party account purchases.
- Support two explicit scopes: VA-owned stable links follow reassignment, while Telegram-account-specific links stay pinned to that destination. Do not silently repoint historical account-specific links. Pause/unavailable behavior must be defined.
- Use standard compliant assignment routing; do not copy ban-evasion/geographic exclusion marketing from the reference.
- Reuse audited /go routing where compatible. Destination updates should not break already shared short URLs. Pause/reassign/archive must be explicit and audited.
- Attribute clicks to a VA/campaign without storing private visitor data unnecessarily. A click is not a Telegram join or purchase: conversion claims require an authorised bot/invite-link/API signal and a defined attribution policy.
- Every action/export gates itself; server-side reads/writes derive allowed assignments from session, not submitted VA IDs. Cross-VA and cross-agency access tests are mandatory.
- Do not bundle implementation with ChatterDesk's current settings fix.

## Before implementation
Screenshot review complete. Validate current LandR schema and session model, decide how VA permissions fit existing account roles, identify which 11 slots are meaningful, and check cost/abuse limits. No new paid service, domain or external API key is required just to write this plan.

## Acceptance
Manager provisions/reassigns a VA; VA can copy/use each assigned link; unauthorised VA cannot inspect or change another's links; redirects survive destination changes; count duplicates/bots honestly; no Telegram join count fabricated from clicks; bulk/template actions are scoped, logged and idempotent.
