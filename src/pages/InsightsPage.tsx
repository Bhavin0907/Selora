import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/Card'
import { RetroTooltip } from '../components/RetroTooltip'
import {
  filterByRange,
  formatINR,
  getImpulseRatioTrendSeries,
  getNetFlowTrendSeries,
  getOrderedWeekdaySpending,
  getSpendCategoryShare,
  groupByField,
  SAMPLE_WEEK_NET_FLOW,
} from '../lib/stats'
import { getSavingsGrowthWithLevelMarkers } from '../lib/level'
import { getDepositCalendarGrid } from '../lib/streak'
import { useReducedMotion } from 'framer-motion'
import { useStore } from '../store/useStore'
import type { TimeRange } from '../types'

const THEME_COLORS = [
  '#7a5bd0', // soul violet
  '#f5c518', // coin gold
  '#2e9e4f', // heal green
  '#d64545', // danger red
  '#3a7bd5', // ocean blue
  '#8a5a2b', // cliff wood
  '#5fbf3f', // grass green
]

const AXIS_TICK = { fill: '#43301acc', fontSize: 10, fontFamily: 'var(--font-body)' }
const AXIS_TICK_SOFT = { fill: '#43301a99', fontSize: 10, fontFamily: 'var(--font-body)' }

export function InsightsPage() {
  const [range, setRange] = useState<TimeRange>('week')
  const [showSampleWeek, setShowSampleWeek] = useState(true)
  const reduced = useReducedMotion()
  const spends = useStore((s) => s.spends)
  const savings = useStore((s) => s.savings)

  // 1. Filtered spends for the active range
  const filteredSpends = useMemo(() => filterByRange(spends, range), [spends, range])

  // 2. Spending by Location (Bar chart)
  const locationData = useMemo(() => {
    const groups = groupByField(filteredSpends, 'location')
    return Object.entries(groups)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredSpends])

  // 3. Spending by Reason (Bar chart)
  const reasonData = useMemo(() => {
    const groups = groupByField(filteredSpends, 'reason')
    return Object.entries(groups)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredSpends])

  // 4. Net Flow Trend (Line chart: Savings, Spends, Net Flow)
  const netFlowTrendData = useMemo(
    () => getNetFlowTrendSeries(spends, savings, range),
    [spends, savings, range],
  )

  const isShowingSample = range === 'week' && showSampleWeek
  const activeNetFlowData = isShowingSample ? SAMPLE_WEEK_NET_FLOW : netFlowTrendData

  // 5. Category Share Donut data
  const categoryShareData = useMemo(
    () => getSpendCategoryShare(spends, range),
    [spends, range],
  )

  // 6. Impulse Ratio Trend (per bucket)
  const impulseTrendData = useMemo(
    () => getImpulseRatioTrendSeries(spends, range),
    [spends, range],
  )

  // 7. Weekday Spending Pattern (Historical all-time)
  const weekdayData = useMemo(
    () => getOrderedWeekdaySpending(spends),
    [spends],
  )
  const maxWeekdayAmount = useMemo(
    () => Math.max(...weekdayData.map((d) => d.amount), 1),
    [weekdayData],
  )

  // 8. 30-Day Deposit Consistency Heatmap Grid
  const depositGrid = useMemo(
    () => getDepositCalendarGrid(savings, 30),
    [savings],
  )

  // 9. Lifetime Savings Growth with Level Milestones (full history)
  const savingsGrowthData = useMemo(
    () => getSavingsGrowthWithLevelMarkers(savings),
    [savings],
  )

  // Level-up dot marker renderer for Savings Growth area chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLevelMarker = (props: any) => {
    const { cx, cy, payload } = props
    if (!payload?.level) return <g key={`dot-${payload?.date ?? 'init'}`} />
    return (
      <g key={`marker-${payload.date}-${payload.level}`}>
        <circle cx={cx} cy={cy} r={5} fill="#f5c518" stroke="#3a2410" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="font-pixel text-[0.45rem] font-bold fill-[#5e3c1a]"
        >
          {payload.levelLabel}
        </text>
      </g>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Shared Range Control */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Insights</h1>
          <p className="text-sm text-ink/70">Where your money goes & grows</p>
        </div>
        <div className="flex bg-vault-indigo-light p-0.5 shadow-[0_0_0_2px_#3a2410]">
          {(['week', 'month'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-all cursor-pointer ${
                range === r ? 'bg-soul-violet text-[#fff7e0]' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* 1. NET FLOW TREND (LINE CHART) */}
      <Card glow="green">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-heal-green">Net Flow Trend</h2>
            {isShowingSample && (
              <span className="font-pixel text-[0.4rem] bg-heal-green/20 text-heal-green px-1.5 py-0.5 border border-heal-green/40">
                SAMPLE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {range === 'week' && (
              <div className="flex bg-vault-indigo-light p-0.5 shadow-[0_0_0_1px_#3a2410]">
                <button
                  type="button"
                  onClick={() => setShowSampleWeek(true)}
                  className={`px-2 py-0.5 font-pixel text-[0.45rem] transition-all cursor-pointer ${
                    showSampleWeek
                      ? 'bg-soul-violet text-[#fff7e0]'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  SAMPLE
                </button>
                <button
                  type="button"
                  onClick={() => setShowSampleWeek(false)}
                  className={`px-2 py-0.5 font-pixel text-[0.45rem] transition-all cursor-pointer ${
                    !showSampleWeek
                      ? 'bg-soul-violet text-[#fff7e0]'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  LIVE
                </button>
              </div>
            )}
            <span className="font-pixel text-[0.45rem] text-ink/50 uppercase">{range} trajectory</span>
          </div>
        </div>
        <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">
          Cumulative savings vs spends and net result
        </p>

        {activeNetFlowData.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-pixel text-[0.55rem] text-coin-gold-deep mb-1">NO DATA RECORDED</p>
            <p className="font-body text-sm text-ink/60 mb-3">Log transactions to trace your net flow curve</p>
            {range === 'week' && (
              <button
                type="button"
                onClick={() => setShowSampleWeek(true)}
                className="font-pixel text-[0.5rem] px-3 py-1 bg-soul-violet text-[#fff7e0] shadow-[0_0_0_2px_#3a2410] hover:brightness-110 transition-all cursor-pointer"
              >
                SHOW SAMPLE WEEK
              </button>
            )}
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={activeNetFlowData} margin={{ top: 12, right: 10, bottom: 5, left: -10 }}>
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK_SOFT}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <ReferenceLine y={0} stroke="#8a5a2b55" strokeDasharray="2 2" />
                <Tooltip
                  content={
                    <RetroTooltip
                      formatter={(val, name) => [
                        formatINR(Number(val)),
                        name === 'savings' || name === 'Savings'
                          ? 'Savings'
                          : name === 'spends' || name === 'Spends'
                            ? 'Spends'
                            : 'Net Flow',
                      ]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Savings"
                  stroke="#2e9e4f"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2e9e4f' }}
                  isAnimationActive={!reduced}
                />
                <Line
                  type="monotone"
                  dataKey="spends"
                  name="Spends"
                  stroke="#d64545"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#d64545' }}
                  isAnimationActive={!reduced}
                />
                <Line
                  type="monotone"
                  dataKey="netFlow"
                  name="Net Flow"
                  stroke="#7a5bd0"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  dot={{ r: 4, fill: '#7a5bd0' }}
                  isAnimationActive={!reduced}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Custom Pixel Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5 font-body text-sm">
                <span className="w-2 h-2 bg-[#2e9e4f] shadow-[0_0_0_1px_#3a2410]" /> Savings
              </span>
              <span className="flex items-center gap-1.5 font-body text-sm">
                <span className="w-2 h-2 bg-[#d64545] shadow-[0_0_0_1px_#3a2410]" /> Spends
              </span>
              <span className="flex items-center gap-1.5 font-body text-sm">
                <span className="w-2 h-2 bg-[#7a5bd0] shadow-[0_0_0_1px_#3a2410]" /> Net Flow
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* 2. SPEND BY LOCATION & DONUT CATEGORY SHARE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Bar Chart */}
        <Card glow="gold">
          <h2 className="text-sm font-semibold text-coin-gold-deep mb-1">Spending by Location</h2>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">Total amount spent per realm</p>
          {locationData.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-pixel text-[0.55rem] text-coin-gold-deep mb-1">NO SPENDING</p>
              <p className="font-body text-sm text-ink/60">No expenses recorded for this {range}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={locationData} margin={{ top: 5, right: 5, bottom: 5, left: -12 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK_SOFT}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  content={
                    <RetroTooltip
                      formatter={(value, name) => [formatINR(Number(value)), name || 'Spent']}
                    />
                  }
                />
                <Bar dataKey="amount" isAnimationActive={!reduced}>
                  {locationData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={THEME_COLORS[i % THEME_COLORS.length]}
                      stroke="#3a2410"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Donut Chart: Category Share */}
        <Card glow="gold">
          <h2 className="text-sm font-semibold text-coin-gold-deep mb-1">Category Share</h2>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">Percentage distribution of spending</p>
          {categoryShareData.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-pixel text-[0.55rem] text-coin-gold-deep mb-1">NO EXPENSES</p>
              <p className="font-body text-sm text-ink/60">Pie chart unlocks after your first spend</p>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={145}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={categoryShareData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={58}
                    paddingAngle={2}
                    isAnimationActive={!reduced}
                  >
                    {categoryShareData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={THEME_COLORS[i % THEME_COLORS.length]}
                        stroke="#3a2410"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <RetroTooltip
                        formatter={(val, name) => [formatINR(Number(val)), name || 'Spent']}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Category percentage badges */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                {categoryShareData.slice(0, 4).map((c, i) => (
                  <span
                    key={i}
                    className="text-xs font-body px-1.5 py-0.5 bg-parchment-dark/70 shadow-[0_0_0_1px_#3a2410] flex items-center gap-1"
                  >
                    <span
                      className="w-2 h-2 shrink-0 shadow-[0_0_0_1px_#3a2410]"
                      style={{ background: THEME_COLORS[i % THEME_COLORS.length] }}
                    />
                    {c.name}: <strong className="font-pixel text-[0.5rem]">{c.percent}%</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. SPEND BY REASON & IMPULSE RATIO TREND */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reason Bar Chart */}
        <Card glow="violet">
          <h2 className="text-sm font-semibold text-soul-violet mb-1">Spending by Reason</h2>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">Categorical drain distribution</p>
          {reasonData.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-pixel text-[0.55rem] text-soul-violet mb-1">NO REASONS LOGGED</p>
              <p className="font-body text-sm text-ink/60">Log transactions to analyze reasons</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={reasonData} margin={{ top: 5, right: 5, bottom: 5, left: -12 }}>
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK_SOFT}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  content={
                    <RetroTooltip
                      formatter={(value, name) => [formatINR(Number(value)), name || 'Spent']}
                    />
                  }
                />
                <Bar dataKey="amount" isAnimationActive={!reduced}>
                  {reasonData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.name === 'Impulse' ? '#d64545' : THEME_COLORS[(i + 2) % THEME_COLORS.length]}
                      stroke="#3a2410"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Impulse Ratio Trend */}
        <Card glow="violet">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-soul-violet">Impulse Ratio Trend</h2>
            <span className="font-pixel text-[0.45rem] text-danger-red uppercase">30% Alert Level</span>
          </div>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">
            Impulse % over time ({range} buckets)
          </p>
          {impulseTrendData.length === 0 || impulseTrendData.every((d) => d.totalAmount === 0) ? (
            <div className="text-center py-8">
              <p className="font-pixel text-[0.55rem] text-heal-green mb-1">ZERO IMPULSES</p>
              <p className="font-body text-sm text-ink/60">Discipline is high! No impulse spending detected.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={impulseTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK_SOFT}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine y={30} stroke="#d64545" strokeDasharray="3 3" />
                <Tooltip
                  content={
                    <RetroTooltip
                      formatter={(val, name) => [
                        `${Math.round(Number(val))}%`,
                        name || 'Impulse Ratio',
                      ]}
                    />
                  }
                />
                <Bar dataKey="percentage" name="Impulse %" isAnimationActive={!reduced}>
                  {impulseTrendData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.percentage > 30 ? '#d64545' : entry.percentage > 15 ? '#f5c518' : '#2e9e4f'}
                      stroke="#3a2410"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* 4. WEEKDAY SPENDING PATTERN & DEPOSIT CONSISTENCY CALENDAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekday Spending Pattern */}
        <Card glow="gold">
          <h2 className="text-sm font-semibold text-coin-gold-deep mb-1">Weekday Spending</h2>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">
            Historical day-of-week spending habits (all-time)
          </p>
          {spends.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-pixel text-[0.55rem] text-coin-gold-deep mb-1">NO HISTORY</p>
              <p className="font-body text-sm text-ink/60">Weekday patterns build up over time</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={weekdayData} margin={{ top: 5, right: 5, bottom: 5, left: -12 }}>
                <XAxis dataKey="shortDay" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK_SOFT}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  content={
                    <RetroTooltip
                      formatter={(value, name) => [formatINR(Number(value)), name || 'Spent']}
                    />
                  }
                />
                <Bar dataKey="amount" name="Spent" isAnimationActive={!reduced}>
                  {weekdayData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.amount === maxWeekdayAmount && d.amount > 0 ? '#d64545' : '#7a5bd0'}
                      stroke="#3a2410"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Deposit Consistency Heatmap Grid */}
        <Card glow="green">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-heal-green">Deposit Consistency</h2>
            <span className="font-pixel text-[0.45rem] text-coin-gold-deep">
              {depositGrid.currentStreak}d STREAK
            </span>
          </div>
          <p className="font-pixel text-[0.45rem] text-ink/60 mb-2">
            30-day savings habit frequency ({depositGrid.activeDays}/30 active)
          </p>

          {/* 30-day grid: 10 columns × 3 rows */}
          <div className="grid grid-cols-10 gap-1.5 py-2 max-w-[300px] mx-auto">
            {depositGrid.cells.map((cell, i) => (
              <div
                key={i}
                title={`${cell.label}: ${
                  cell.hasDeposit
                    ? `+${formatINR(cell.totalAmount)} (${cell.depositCount} deposit${cell.depositCount > 1 ? 's' : ''})`
                    : 'No deposit'
                }`}
                className={`w-6 h-6 flex items-center justify-center transition-transform hover:scale-110 shadow-[0_0_0_1px_#3a2410] cursor-pointer ${
                  cell.hasDeposit
                    ? cell.depositCount > 1 || cell.totalAmount >= 1000
                      ? 'bg-[#1f9c6b] text-[#fff7e0] shadow-[0_0_0_1px_#3a2410,inset_0_0_0_1px_#f5c518]'
                      : 'bg-[#2e9e4f] text-[#fff7e0]'
                    : 'bg-[#ecd39b]/60'
                }`}
              >
                {cell.hasDeposit && <span className="font-pixel text-[0.45rem]">✦</span>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#8a5a2b]/20 text-xs text-ink/70">
            <span className="font-body text-sm">
              Total Saved: <strong className="font-pixel text-[0.55rem] text-heal-green">{formatINR(depositGrid.totalSaved)}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-body text-xs">
                <span className="w-2.5 h-2.5 bg-[#ecd39b]/60 shadow-[0_0_0_1px_#3a2410]" /> Rest
              </span>
              <span className="flex items-center gap-1 font-body text-xs">
                <span className="w-2.5 h-2.5 bg-[#2e9e4f] shadow-[0_0_0_1px_#3a2410]" /> Saved
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. SAVINGS GROWTH & LEVEL MILESTONES (AREA CHART) */}
      <Card glow="gold">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-coin-gold-deep">Lifetime Savings Growth</h2>
          <span className="font-pixel text-[0.45rem] text-soul-violet uppercase">Level Milestones</span>
        </div>
        <p className="font-pixel text-[0.45rem] text-ink/60 mb-3">
          Cumulative wealth accumulation with RPG level-up checkpoints (all-time)
        </p>

        {savingsGrowthData.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-pixel text-[0.55rem] text-coin-gold-deep mb-1">NO SAVINGS DEPOSITS</p>
            <p className="font-body text-sm text-ink/60">Log your first deposit to start your growth curve!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={savingsGrowthData} margin={{ top: 18, right: 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="savingsGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5c518" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#2e9e4f" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                tick={AXIS_TICK_SOFT}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                content={
                  <RetroTooltip
                    formatter={(val, name) => [
                      formatINR(Number(val)),
                      name || 'Cumulative Savings',
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                name="Total Savings"
                stroke="#b5860b"
                strokeWidth={2.5}
                fill="url(#savingsGrowthGrad)"
                dot={renderLevelMarker}
                isAnimationActive={!reduced}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
