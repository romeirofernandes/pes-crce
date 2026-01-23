'use client';

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import KnockoutBracket from '../components/KnockoutBracket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Lock, 
  LogOut, 
  Plus, 
  Trash2, 
  Users, 
  RefreshCcw,
  UserPlus,
  Shield,
  Trophy
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

const Admin = () => {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true'
  })
  const [password, setPassword] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState([])

  const data = useTournamentStore((state) => state.data)
  const addPlayer = useTournamentStore((state) => state.addPlayer)
  const removePlayer = useTournamentStore((state) => state.removePlayer)
  const addTeam = useTournamentStore((state) => state.addTeam)
  const removeTeam = useTournamentStore((state) => state.removeTeam)
  const setFormat = useTournamentStore((state) => state.setFormat)
  const resetTournament = useTournamentStore((state) => state.resetTournament)
  const generateBracket = useTournamentStore((state) => state.generateBracket)

  const activeFormat = data.activeFormat || '1v1'
  const currentBracket = data.brackets?.[activeFormat]

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setPassword('')
    } else {
      alert('Invalid password')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    navigate('/')
  }

  const getPlayerName = (playerId) => {
    return data.players.find((p) => p.id === playerId)?.name || 'Unknown'
  }

  const unselectedPlayers = data.players.filter(
    (p) =>
      !selectedPlayers.includes(p.id) &&
      !data.teams.some((t) => t.players.includes(p.id)),
  )

  const handleSelectPlayer = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    } else if (
      (activeFormat === '2v2' && selectedPlayers.length < 2) ||
      (activeFormat === '1v1' && selectedPlayers.length < 1)
    ) {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const handleAddTeam = () => {
    const teamSize = activeFormat === '2v2' ? 2 : 1
    if (selectedPlayers.length === teamSize) {
      addTeam(selectedPlayers)
      setSelectedPlayers([])
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>Enter password to manage tournament</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-2"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  const competitorsCount = activeFormat === '2v2' ? data.teams.length : data.players.length

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Tournament Admin</h1>
            <p className="text-muted-foreground mt-1">Manage players, teams, and tournament settings</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Separator />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Manage Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Players
              </CardTitle>
              <CardDescription>Add or remove players from the tournament. Players added here can be used in both 1v1 and 2v2.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newPlayerName.trim()) {
                    addPlayer(newPlayerName)
                    setNewPlayerName('')
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.players.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No players yet. Add some to get started.
                  </p>
                ) : (
                  data.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium">{player.name}</span>
                      <Button
                        onClick={() => removePlayer(player.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tournament Format & specific controls */}
          <div className="space-y-6">
            <Tabs value={activeFormat} onValueChange={setFormat} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="1v1">1v1 Tournament</TabsTrigger>
                <TabsTrigger value="2v2">2v2 Tournament</TabsTrigger>
              </TabsList>
              
              <TabsContent value="2v2">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Teams</CardTitle>
                    <CardDescription>
                      Select 2 players to form a team for the 2v2 tournament.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label>Create Teams (Select 2 Players)</Label>
                        
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {unselectedPlayers.length === 0 ? (
                            <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                              All available players are already in teams.
                            </p>
                          ) : (
                            unselectedPlayers.map((player) => (
                              <Button
                                key={player.id}
                                onClick={() => handleSelectPlayer(player.id)}
                                variant={selectedPlayers.includes(player.id) ? 'default' : 'outline'}
                                size="sm"
                                className="justify-start"
                              >
                                {player.name}
                              </Button>
                            ))
                          )}
                        </div>

                        {selectedPlayers.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 rounded-lg border-2 border-dashed bg-muted/50">
                            {selectedPlayers.map((playerId) => (
                              <Badge
                                key={playerId}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => handleSelectPlayer(playerId)}
                              >
                                {getPlayerName(playerId)}
                                <span className="ml-1">×</span>
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={handleAddTeam}
                          disabled={selectedPlayers.length !== 2}
                          className="w-full"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Team
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="1v1">
                  <Card>
                      <CardHeader>
                          <CardTitle>1v1 Description</CardTitle>
                          <CardDescription>
                              Traditional knockout tournament. Uses all registered players.
                          </CardDescription>
                      </CardHeader>
                  </Card>
              </TabsContent>
            </Tabs>
            
            {/* Created Teams List (only for 2v2) - Moved here for better flow */}
            {activeFormat === '2v2' && (
             <Card>
                <CardHeader>
                <CardTitle>Created Teams ({data.teams.length})</CardTitle>
                <CardDescription>Teams registered for the tournament</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    {data.teams.length === 0 ? <p className="text-muted-foreground text-sm col-span-2 text-center">No teams created yet.</p> :
                    data.teams.map((team) => (
                    <div
                        key={team.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                        <div className="text-sm font-medium">
                        {team.players.map((pId) => getPlayerName(pId)).join(' & ')}
                        </div>
                        <Button
                        onClick={() => removeTeam(team.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                </div>
                </CardContent>
             </Card>
            )}
           </div>
        </div>

        {/* Bracket Management */}
        <Card>
          <CardHeader>
            <CardTitle>{activeFormat} Bracket Management</CardTitle>
            <CardDescription>Generate the bracket and manage match scores</CardDescription>
          </CardHeader>
          <CardContent>
            {!currentBracket ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="text-muted-foreground text-center">
                  {competitorsCount} {activeFormat === '2v2' ? 'teams' : 'players'} registered for {activeFormat}.
                  {competitorsCount < 2 
                    ? ' Need at least 2 to generate bracket.' 
                    : ' Ready to start!'}
                </p>
                <Button 
                  onClick={generateBracket} 
                  disabled={competitorsCount < 2}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Generate {activeFormat} Bracket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Click on a match to update the score.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                        if (confirm('Are you sure you want to regenerate the bracket? All progress will be lost.')) {
                            generateBracket()
                        }
                    }}
                  >
                    <RefreshCcw className="mr-2 h-3 w-3" />
                    Regenerate Bracket
                  </Button>
                </div>
                <KnockoutBracket readOnly={false} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{data.players.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active View</p>
                <p className="text-2xl font-bold">{activeFormat}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {activeFormat === '2v2' ? 'Teams' : 'Competitors'}
                </p>
                <p className="text-2xl font-bold">
                  {competitorsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will reset the tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset {activeFormat} Tournament
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently reset the {activeFormat} tournament to default state. Players will remain, but bracket data will be lost. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetTournament()
                      // Don't navigate away, just reset
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Tournament
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default Admin
