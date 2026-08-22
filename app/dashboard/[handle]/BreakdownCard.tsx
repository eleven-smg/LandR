"use client"

import { useState } from "react"

export type Row = { name: string; value: number }
export type Tab = { label: string; rows?: Row[]; note?: string }

// Tabs whose data the schema cannot produce yet carry a `note` instead of rows,
// so the card explains the gap rather than showing a misleading empty list.
export default function BreakdownCard({ tabs }: { tabs: Tab[] }) {
  const [i, setI] = useState(0)
  const tab = tabs[i] || tabs[0]
  const rows = tab.rows || []
  const max = rows.reduce((m, r) => (r.value > m ? r.value : m), 0)

  return (
    <div className="breakdown-card">
      <div className="breakdown-header">
        <div className="breakdown-tabs">
          {tabs.map((t, idx) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setI(idx)}
              className={idx === i ? "breakdown-tab active" : "breakdown-tab"}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab.note ? (
        <div className="breakdown-empty">{tab.note}</div>
      ) : rows.length === 0 ? (
        <div className="breakdown-empty">No data in this range yet.</div>
      ) : (
        <div>
          {rows.map((r) => (
            <div key={r.name} className="breakdown-row">
              <span className="breakdown-name" title={r.name}>
                {r.name}
              </span>
              <span className="breakdown-bar-wrap">
                <span
                  className="breakdown-bar"
                  style={{ width: (max > 0 ? Math.round((r.value / max) * 100) : 0) + "%", display: "block" }}
                />
              </span>
              <span>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
