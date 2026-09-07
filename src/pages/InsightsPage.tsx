import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card } from '../components/Card'
import { filterByRange, groupByField } from '../lib/stats'
import type { TimeRange } from '../types'
import { useStore } from '../store/useStore'

const COLORS = ['#7a5bd0', '#e0a11a', '#2e9e4f', '#d64545', '#3a7bd5', '#e07a2f', '#5fbf3f']
const AXIS_TICK = { fill: '#43301acc', fontSize: 10 }
const AXIS_TICK_SOFT = { fill: '#43301a99', fontSize: 10 }
const TOOLTIP_STYLE = { background: '#f7e6bd', border: '2px solid #8a5a2b', borderRadius: 0 }

export function InsightsPage() {
  const [range, setRange] = useState<TimeRange>('week')
  const spends = useStore((s) => s.spends)

  const filtered = useMemo(() => filterByRange(spends, range), [spends, range])

  const locationData = useMemo(() => {
    const groups = groupByField(filtered, 'location')
    return Object.entries(groups)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered])

  const reasonData = useMemo(() => {
    const groups = groupByField(filtered, 'reason')
    return Object.entries(groups)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Insights</h1>
          <p className="text-sm text-ink/70">Where your money goes</p>
        </div>
        <div className="flex bg-vault-indigo-light p-0.5 shadow-[0_0_0_2px_#3a2410]">
          {(['week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                range === r ? 'bg-soul-violet text-[#fff7e0]' : 'text-ink/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <Card glow="gold">
        <h2 className="text-sm font-semibold text-coin-gold-deep mb-3">Spending by Location</h2>
        {locationData.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-8">No spending data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={locationData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK_SOFT} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#b5860b' }}
                itemStyle={{ color: '#43301a' }}
                cursor={{ fill: '#8a5a2b22' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
              />
              <Bar dataKey="amount">
                {locationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card glow="violet">
        <h2 className="text-sm font-semibold text-soul-violet mb-3">Spending by Reason</h2>
        {reasonData.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-8">No spending data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reasonData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK_SOFT} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#7a5bd0' }}
                itemStyle={{ color: '#43301a' }}
                cursor={{ fill: '#8a5a2b22' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
              />
              <Bar dataKey="amount">
                {reasonData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
