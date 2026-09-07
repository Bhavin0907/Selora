import type { LeaderboardEntry } from '../types'

const FAKE_USERS: Omit<LeaderboardEntry, 'isUser'>[] = [
  { id: 'f1', name: 'Priya S.', verifiedSavings: 12500, avatar: '🌟' },
  { id: 'f2', name: 'Arjun M.', verifiedSavings: 9800, avatar: '🔥' },
  { id: 'f3', name: 'Sneha K.', verifiedSavings: 8200, avatar: '💎' },
  { id: 'f4', name: 'Rahul D.', verifiedSavings: 6500, avatar: '⚡' },
  { id: 'f5', name: 'Ananya R.', verifiedSavings: 5400, avatar: '🎯' },
  { id: 'f6', name: 'Vikram P.', verifiedSavings: 4200, avatar: '🚀' },
  { id: 'f7', name: 'Meera J.', verifiedSavings: 3100, avatar: '🌸' },
  { id: 'f8', name: 'Karan T.', verifiedSavings: 2800, avatar: '💪' },
]

export function buildLeaderboard(
  userSavings: number,
  userName: string = 'You',
): LeaderboardEntry[] {
  const userEntry: LeaderboardEntry = {
    id: 'user',
    name: userName,
    verifiedSavings: userSavings,
    isUser: true,
    avatar: '👤',
  }

  const all: LeaderboardEntry[] = [
    ...FAKE_USERS.map((u) => ({ ...u, isUser: false })),
    userEntry,
  ]

  return all.sort((a, b) => b.verifiedSavings - a.verifiedSavings)
}
