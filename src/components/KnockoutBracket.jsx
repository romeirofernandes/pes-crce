'use client';

import { useState } from 'react'
import { useTournamentStore } from '../store/tournamentStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy, Award } from 'lucide-react'

const KnockoutBracket = ({ readOnly = false, formatOverride }) => {
  const data = useTournamentStore((state) => state.data)
  const updateMatch = useTournamentStore((state) => state.updateMatch)
  const [editingMatch, setEditingMatch] = useState(null)
  const [scores, setScores] = useState({ home: '', away: '' })
  
  const currentFormat = formatOverride || data.activeFormat
  const bracket = data.brackets?.[currentFormat]

  if (!bracket) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Bracket not generated yet for {currentFormat}</p>
        </CardContent>
      </Card>
    )
  }

  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD'
    
    if (currentFormat === '2v2') {
      const team = data.teams.find((t) => t.id === teamId)
      if (!team) return 'TBD'
      const playerNames = team.players
        .map((pId) => data.players.find((p) => p.id === pId)?.name)
        .filter(Boolean)
        .join(' & ')
      return playerNames || 'TBD'
    } else {
      const player = data.players.find((p) => p.id === teamId)
      return player?.name || 'TBD'
    }
  }

  const handleMatchClick = (roundIdx, matchIdx) => {
    if (readOnly) return
    const match = bracket.rounds[roundIdx][matchIdx]
    
    // Can only edit matches that have both competitors assigned
    if (!match.home || !match.away || match.bye) return
    
    setEditingMatch({ roundIdx, matchIdx })
    setScores({
      home: match.homeScore !== null ? match.homeScore.toString() : '',
      away: match.awayScore !== null ? match.awayScore.toString() : '',
    })
  }

  const handleSaveScore = () => {
    if (editingMatch && scores.home !== '' && scores.away !== '') {
      const homeScore = parseInt(scores.home) || 0
      const awayScore = parseInt(scores.away) || 0
      updateMatch(editingMatch.roundIdx, editingMatch.matchIdx, homeScore, awayScore)
      setEditingMatch(null)
      setScores({ home: '', away: '' })
    }
  }

  const handleCancel = () => {
    setEditingMatch(null)
    setScores({ home: '', away: '' })
  }

  const getRoundName = (roundIdx) => {
    const numRounds = bracket.rounds.length
    const matchCount = bracket.rounds[roundIdx].length

    if (roundIdx === numRounds - 1) return 'Final'
    if (roundIdx === numRounds - 2) return 'Semi-Finals'
    if (roundIdx === numRounds - 3 && matchCount === 4) return 'Quarter-Finals'

    const competitorsInRound = matchCount * 2
    return `Round of ${competitorsInRound}`
  }

  const getWinner = () => {
    const finalRound = bracket.rounds[bracket.rounds.length - 1]
    if (finalRound.length > 0 && finalRound[0].completed) {
      return getTeamName(finalRound[0].winner)
    }
    return null
  }

  const winner = getWinner()

  return (
    <div className="w-full space-y-6">
      {winner && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Trophy className="w-6 h-6" />
              Tournament Winner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{winner}</p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max px-2">
          {bracket.rounds.map((round, roundIdx) => (
            <div key={roundIdx} className="flex flex-col min-w-[280px]">
              <Badge variant="secondary" className="mb-6 text-center justify-center">
                {getRoundName(roundIdx)}
              </Badge>

              <div className="flex flex-col justify-around gap-6 h-full">
                {round.map((match, matchIdx) => {
                  const isEditing =
                    editingMatch?.roundIdx === roundIdx &&
                    editingMatch?.matchIdx === matchIdx
                  const isCompleted = match.completed && !match.bye
                  const isWinner = (teamId) => match.winner === teamId
                  const canEdit = !readOnly && match.home && match.away && !match.bye
                  
                  return (
                    <div key={match.id} className="relative flex items-center">
                    
                    <Card 
                      className={`min-w-[280px] z-10 transition-all ${
                        canEdit && !isEditing 
                          ? 'cursor-pointer hover:border-primary hover:shadow-md' 
                          : ''
                      } ${match.bye ? 'opacity-60' : ''}`}
                      onClick={() => canEdit && !isEditing && handleMatchClick(roundIdx, matchIdx)}
                    >
                      {match.bye ? (
                        <CardContent className="p-4">
                          <Badge variant="outline" className="mb-2">BYE</Badge>
                          <p className="text-sm font-semibold">{getTeamName(match.home)}</p>
                        </CardContent>
                      ) : isEditing ? (
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {getTeamName(match.home)}
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={scores.home}
                              onChange={(e) => setScores({ ...scores, home: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              placeholder="0"
                              className="mt-2"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                              {getTeamName(match.away)}
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={scores.away}
                              onChange={(e) => setScores({ ...scores, away: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="0"
                              className="mt-2"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveScore()
                              }}
                              disabled={scores.home === '' || scores.away === ''}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancel()
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      ) : (
                        <CardContent className="p-0">
                          <div className={`p-3 border-b flex items-center justify-between transition-colors ${
                            isWinner(match.home) 
                              ? 'bg-primary/10 font-semibold' 
                              : 'hover:bg-muted/50'
                          }`}>
                            <span className={`text-sm truncate flex items-center gap-2 ${
                              !match.home ? 'text-muted-foreground italic' : ''
                            }`}>
                              {getTeamName(match.home)}
                              {isWinner(match.home) && <Award className="w-4 h-4 text-primary" />}
                            </span>
                            {isCompleted && match.homeScore !== null && (
                              <Badge variant={isWinner(match.home) ? "default" : "secondary"}>
                                {match.homeScore}
                              </Badge>
                            )}
                          </div>
                          <div className={`p-3 flex items-center justify-between transition-colors ${
                            isWinner(match.away) 
                              ? 'bg-primary/10 font-semibold' 
                              : 'hover:bg-muted/50'
                          }`}>
                            <span className={`text-sm truncate flex items-center gap-2 ${
                              !match.away ? 'text-muted-foreground italic' : ''
                            }`}>
                              {getTeamName(match.away)}
                              {isWinner(match.away) && <Award className="w-4 h-4 text-primary" />}
                            </span>
                            {isCompleted && match.awayScore !== null && (
                              <Badge variant={isWinner(match.away) ? "default" : "secondary"}>
                                {match.awayScore}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default KnockoutBracket
