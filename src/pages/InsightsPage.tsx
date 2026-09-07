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

const COLORS = ['#9b5de5', '#f5c518', '#3ddc97', '#ff6b6b', '#6bcbff', '#ff9f43', '#a29bfe']

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
          <h1 className="text-2xl font-bold text-white">Insights</h1>
          <p className="text-sm text-white/50">Where your money goes</p>
        </div>
        <div className="flex rounded-lg bg-vault-indigo-light p-0.5">
          {(['week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                range === r ? 'bg-soul-violet text-white' : 'text-white/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <Card>
        <h2 className="text-sm font-semibold text-coin-gold mb-3">Spending by Location</h2>
        {locationData.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">No spending data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={locationData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: '#ffffff80', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#252550', border: '1px solid #ffffff20', borderRadius: 8 }}
                labelStyle={{ color: '#f5c518' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {locationData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-soul-violet mb-3">Spending by Reason</h2>
        {reasonData.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">No spending data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reasonData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: '#ffffff80', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#252550', border: '1px solid #ffffff20', borderRadius: 8 }}
                labelStyle={{ color: '#9b5de5' }}
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
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
