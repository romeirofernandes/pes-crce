'use client';

import { useState } from 'react'
import { useTournamentStore } from '../store/tournamentStore'
import KnockoutBracket from '../components/KnockoutBracket'
import LeagueTable from '../components/LeagueTable'
import LeagueFixtures from '../components/LeagueFixtures'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
// Tabs replaced by inline buttons — no Tabs import needed
import { Trophy, TableProperties, Network } from 'lucide-react'

const Dashboard = () => {
  const data = useTournamentStore((state) => state.data)
  // Default to the active format set by admin, or 1v1
  const [viewFormat, setViewFormat] = useState(data.activeFormat || '1v1')
  // Local state for toggling view mode (league vs knockout) per format
  // Keep per-format override so switching formats preserves the user's choice
  const [userModeOverride, setUserModeOverride] = useState({ '1v1': null, '2v2': null })

  const competitors = viewFormat === '2v2' ? data.teams : data.players
  const bracket = data.brackets?.[viewFormat]
  const league = data.leagues?.[viewFormat]
  
  const adminMode = 'knockout'
  const activeMode = userModeOverride[viewFormat] || adminMode

  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD'
    
    if (viewFormat === '2v2') {
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

    const toggleMode = () => {
      const newMode = activeMode === 'knockout' ? 'league' : 'knockout'
      setUserModeOverride(prev => ({ ...prev, [viewFormat]: newMode }))
    }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary">
                Who's the best PES player in CRCE?
                </h1>
              
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-md bg-transparent p-0">
                <Button
                  size="sm"
                  variant={viewFormat === '1v1' ? 'default' : 'outline'}
                  onClick={() => { setViewFormat('1v1') }}
                  className={viewFormat === '1v1' ? 'rounded-r-none' : 'text-foreground rounded-r-none'}
                >
                  1v1
                </Button>
                <Button
                  size="sm"
                  variant={viewFormat === '2v2' ? 'default' : 'outline'}
                  onClick={() => { setViewFormat('2v2') }}
                  className={viewFormat === '2v2' ? 'rounded-l-none' : 'text-foreground rounded-l-none'}
                >
                  2v2
                </Button>
              </div>

              <Button 
                variant="default" 
                size="sm"
                className="h-10 rounded-full px-3 text-foreground text-md border border-accent bg-background hover:bg-accent hover:text-accent-foreground ml-2"
                onClick={toggleMode}
              >
                {activeMode === 'league' ? (
                   <div className="flex items-center gap-2">
                    <TableProperties className="w-6 h-6 text-primary" />
                    <span>League</span>
                   </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-primary" />
                    <span>Knockout</span>
                   </div>
                )}
              </Button>
            </div>
            </div>
            
            {/* Format selection moved to buttons in header */}
        </header>
        
        <Separator className="my-6" />

        {competitors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Tournament Pending</h2>
              <p className="text-muted-foreground mb-6">
                Waiting for competitors to join {viewFormat}.
              </p>
            </CardContent>
          </Card>
        ) : (
            activeMode === 'knockout' ? (
                !bracket ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Network className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h2 className="text-2xl font-semibold mb-2">Bracket Not Ready</h2>
                      <p className="text-muted-foreground mb-6">
                        {competitors.length} {viewFormat === '2v2' ? 'teams' : 'players'} are ready. Waiting for administrator to generate the bracket.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <KnockoutBracket readOnly={true} formatOverride={viewFormat} />
                )
            ) : (
                !league ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <TableProperties className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h2 className="text-2xl font-semibold mb-2">League Not Ready</h2>
                      <p className="text-muted-foreground mb-6">
                        {competitors.length} {viewFormat === '2v2' ? 'teams' : 'players'} are ready. Waiting for administrator to generate league fixtures.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-foreground font-semibold text-xl mb-4">League Standings</h3>
                            <LeagueTable matches={league.matches} competitors={competitors} getTeamName={getTeamName} />
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-foreground font-semibold text-xl mb-4">Fixtures</h3>
                            <LeagueFixtures 
                                matches={league.matches} 
                                getTeamName={getTeamName} 
                                readOnly={true}
                            />
                        </div>
                    </div>
                )
            )
        )}
      </div>
    </main>
  )
}

export default Dashboard
