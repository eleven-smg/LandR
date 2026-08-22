"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type Point = { label: string; views: number; clicks: number }

export default function TrafficChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b7fff" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#5b7fff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232940" vertical={false} />
        <XAxis dataKey="label" stroke="#8892a4" tick={{ fontSize: 11 }} tickLine={false} minTickGap={18} />
        <YAxis stroke="#8892a4" tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} width={44} />
        <Tooltip
          contentStyle={{ background: "#181c27", border: "1px solid #232940", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#8892a4" }}
        />
        <Area type="monotone" dataKey="views" stroke="#5b7fff" strokeWidth={2} fill="url(#gViews)" name="Views" />
        <Area type="monotone" dataKey="clicks" stroke="#4ade80" strokeWidth={2} fill="url(#gClicks)" name="Clicks" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
