"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

type DayPoint = { day: string; views: number; clicks: number }
type NameValue = { name: string; value: number }

const PALETTE = ["#5E9FE8", "#EAC26B", "#72BC8F", "#BF8EDA", "#DE9255", "#DF84A8", "#4FB9C9", "#E97366"]

export default function Charts({
  daily,
  byLink,
  bySource,
  byDevice,
}: {
  daily: DayPoint[]
  byLink: NameValue[]
  bySource: NameValue[]
  byDevice: NameValue[]
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Views and clicks (last 14 days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="day" stroke="#7D7A75" fontSize={12} />
            <YAxis stroke="#7D7A75" fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#5E9FE8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="clicks" stroke="#72BC8F" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="mb-4 text-sm font-medium text-neutral-300">Clicks by link</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byLink}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="name" stroke="#7D7A75" fontSize={12} />
            <YAxis stroke="#7D7A75" fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#5E9FE8" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">Traffic sources</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={90} label>
                {bySource.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-4 text-sm font-medium text-neutral-300">Devices</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byDevice} dataKey="value" nameKey="name" outerRadius={90} label>
                {byDevice.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  )
}
