# LandR engineering memory

Persistent, chat-independent memory for this project. If you are an AI agent or a new
developer picking LandR up in a fresh session, **read these five files before touching anything.**

| File | What it holds |
| --- | --- |
| `PROGRESS.md` | The benchmark. The 24 planned steps + all added scope, with status and proof. **Single source of truth for what is done.** |
| `BUGS.md` | Open defects, retracted false reports, and fixed history. |
| `DECISIONS.md` | Client decisions already made (do not re-ask) and the open ones that block work. |
| `STATE.md` | Infrastructure facts: repo head, Vercel, Supabase, tables, row counts, migrations. |
| `SESSION-LOG.md` | Append-only log of what each work session actually shipped, with commit SHAs. |

## The plan of record

The **24-step pack** (`project landr.zip`: `Step 1.pdf` … `Step 24.pdf`, each with a matching
`TEST` checklist, plus `LANDER-Guide.md`, `notion-playbook.md`, `LANDER-HANDOFF.pdf`) is the
plan. Anything agreed later in chat is tracked in `PROGRESS.md` Part 2 as an `A-` item.
No other roadmap exists. Do not invent one.

## Maintenance protocol — follow this after **every** task

1. **Before starting:** read `PROGRESS.md` and `BUGS.md`. Pick work from the queue in
   `PROGRESS.md` Part 3, not from memory or assumption.
2. **After shipping:** in the same session, update
   - `PROGRESS.md` — status, proof, and the commit SHA in the notes column;
   - `BUGS.md` — add anything discovered, move anything fixed to the fixed table with its SHA;
   - `SESSION-LOG.md` — one entry: date, what shipped, commit SHAs, what broke;
   - `STATE.md` — only if infra changed (new table, migration, head SHA, plan change).
3. **Status vocabulary — use exactly these:**
   - Status: `DONE` · `PARTIAL` · `NOT STARTED` · `CANCELLED`
   - Proof: `LIVE` (verified on alandr.vercel.app or in the database) · `CODE` (exists in the
     repo but no real user has exercised it) · `NONE`
4. **Never mark something `DONE`/`LIVE` from intention.** Verify against the repo at the current
   `main`, or against the live database, and record the evidence. Past false reports are listed
   in `BUGS.md` so they are never repeated.
5. **Never commit secrets here.** Keys and passwords live in Vercel/Supabase env only. See `STATE.md`.
6. Update the `Last verified` date at the top of `PROGRESS.md` whenever a full re-audit is done.
