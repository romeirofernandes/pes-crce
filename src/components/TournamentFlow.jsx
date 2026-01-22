'use client';

import { useMemo } from 'react'
import { useTournamentStore } from '../store/tournamentStore'
import { calculateStats } from '../utils/stats'

const TournamentFlow = () => {
  const data = useTournamentStore((state) => state.data)

  const matchesWithStats = useMemo(() => {
    return data.matches.map((match) => {
      const homeName =
        data.format === '1v1'
          ? data.players.find((p) => p.id === match.home)?.name
          : data.teams.find((t) => t.id === match.home)?.id
      const awayName =
        data.format === '1v1'
          ? data.players.find((p) => p.id === match.away)?.name
          : data.teams.find((t) => t.id === match.away)?.id

      return {
        ...match,
        homeName: homeName || 'TBD',
        awayName: awayName || 'TBD',
      }
    })
  }, [data])

  return (
    <div className="w-full bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-sm font-semibold mb-4 text-zinc-100">Matches</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {matchesWithStats.length === 0 ? (
          <p className="text-xs text-zinc-400">No matches scheduled yet</p>
        ) : (
          matchesWithStats.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between p-3 bg-zinc-800 rounded border border-zinc-700 text-xs"
            >
              <div className="flex-1 text-right pr-3">
                <div className="font-medium text-zinc-100">{match.homeName}</div>
              </div>
              <div className="px-3 py-1 bg-zinc-900 rounded font-semibold text-zinc-200">
                {match.homeScore}-{match.awayScore}
              </div>
              <div className="flex-1 text-left pl-3">
                <div className="font-medium text-zinc-100">{match.awayName}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TournamentFlow
