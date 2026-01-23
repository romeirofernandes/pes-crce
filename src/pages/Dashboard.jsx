'use client';

import { useState } from 'react'
import { useTournamentStore } from '../store/tournamentStore'
import KnockoutBracket from '../components/KnockoutBracket'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy } from 'lucide-react'

const Dashboard = () => {
  const data = useTournamentStore((state) => state.data)
  // Default to the active format set by admin, or 1v1
  const [viewFormat, setViewFormat] = useState(data.activeFormat || '1v1')

  const competitors = viewFormat === '2v2' ? data.teams : data.players
  const bracket = data.brackets?.[viewFormat]

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary">
                Who's the best PES player in CRCE?
                </h1>
                <p className="text-muted-foreground mt-2">
                {competitors.length} {viewFormat === '2v2' ? 'teams' : 'players'} competing in {viewFormat}
                </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">{viewFormat}</Badge>
            </div>
            
            <Tabs value={viewFormat} onValueChange={setViewFormat} className="w-full sm:w-100">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="1v1">1v1 Tournament</TabsTrigger>
                    <TabsTrigger value="2v2">2v2 Tournament</TabsTrigger>
                </TabsList>
            </Tabs>
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
        ) : !bracket ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-2">Ready to Begin</h2>
              <p className="text-muted-foreground mb-6">
                {competitors.length} {viewFormat === '2v2' ? 'teams' : 'players'} are ready. Waiting for administrator to start the tournament.
              </p>
            </CardContent>
          </Card>
        ) : (
          <KnockoutBracket readOnly={true} formatOverride={viewFormat} />
        )}
      </div>
    </main>
  )
}

export default Dashboard
