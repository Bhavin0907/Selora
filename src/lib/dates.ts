export function toDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function getWeekStart(d: Date = new Date()): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toDateString(date)
}

export function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart)
  date.setDate(date.getDate() + 6)
  return toDateString(date)
}

export function isInRange(
  dateStr: string,
  start: string,
  end: string,
): boolean {
  return dateStr >= start && dateStr <= end
}

export function getMonthStart(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function getMonthEnd(d: Date = new Date()): string {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return toDateString(last)
}

export function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateString(d)
}

export function getWeekdayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(dateStr).getDay()]
}
