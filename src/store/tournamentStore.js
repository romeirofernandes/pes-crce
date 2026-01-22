import { create } from 'zustand'

const STORAGE_KEY = 'tournament-data'

const loadInitialData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : getDefaultData()
  } catch {
    return getDefaultData()
  }
}

const getDefaultData = () => ({
  players: [
    { id: 'p1', name: 'Neymar' },
    { id: 'p2', name: 'Mbappé' },
    { id: 'p3', name: 'Vinicius Jr' },
    { id: 'p4', name: 'Rodrygo' },
    { id: 'p5', name: 'Haaland' },
    { id: 'p6', name: 'De Bruyne' },
    { id: 'p7', name: 'Salah' },
    { id: 'p8', name: 'Benzema' },
  ],
  activeFormat: '1v1',
  teams: [],
  brackets: {
    '1v1': null,
    '2v2': null
  }
})

export const useTournamentStore = create((set, get) => ({
  data: loadInitialData(),

  addPlayer: (name) => {
    set((state) => {
      const newData = {
        ...state.data,
        players: [...state.data.players, { id: `p${Date.now()}`, name }],
        brackets: {
          ...state.data.brackets,
          '1v1': null // Invalidate 1v1 bracket
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  removePlayer: (playerId) => {
    set((state) => {
      const newData = {
        ...state.data,
        players: state.data.players.filter((p) => p.id !== playerId),
        brackets: {
          ...state.data.brackets,
          '1v1': null
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  setFormat: (format) => {
    set((state) => {
      const newData = {
        ...state.data,
        activeFormat: format,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  addTeam: (playerIds) => {
    set((state) => {
      const newTeam = {
        id: `team${Date.now()}`,
        players: playerIds,
      }
      const newData = {
        ...state.data,
        teams: [...state.data.teams, newTeam],
        brackets: {
          ...state.data.brackets,
          '2v2': null // Invalidate 2v2 bracket
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  removeTeam: (teamId) => {
    set((state) => {
      const newData = {
        ...state.data,
        teams: state.data.teams.filter((t) => t.id !== teamId),
        brackets: {
          ...state.data.brackets,
          '2v2': null
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  resetTournament: () => {
    set((state) => {
      const format = state.data.activeFormat
      const newData = {
        ...state.data,
        brackets: {
          ...state.data.brackets,
          [format]: null
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  generateBracket: () => {
    const state = get()
    const { teams, activeFormat, players } = state.data

    // For 1v1, automatically create teams from players
    let competitors
    if (activeFormat === '1v1') {
      competitors = players.map(player => ({
        id: player.id,
        players: [player.id],
      }))
    } else {
      competitors = teams
    }

    if (competitors.length < 2) return

    const bracket = {
      rounds: [],
      matchMap: {},
    }

    // Shuffle competitors for fairness
    let currentStageSources = [...competitors].sort(() => Math.random() - 0.5).map(c => ({ 
      id: c.id, 
      type: 'competitor' 
    }))

    let roundIdx = 0

    while (currentStageSources.length > 1) {
      const roundMatches = []
      const nextStageSources = []
      let matchCounter = 0
      let byeCounter = 0

      for (let i = 0; i < currentStageSources.length; i += 2) {
        const homeSource = currentStageSources[i]
        const awaySource = i + 1 < currentStageSources.length ? currentStageSources[i + 1] : null

        if (awaySource) {
          // Regular Match
          const matchId = `r${roundIdx}m${matchCounter}`
          const match = {
            id: matchId,
            home: homeSource.type === 'competitor' ? homeSource.id : null,
            away: awaySource.type === 'competitor' ? awaySource.id : null,
            homeSourceId: homeSource.type === 'match' ? homeSource.id : null,
            awaySourceId: awaySource.type === 'match' ? awaySource.id : null,
            homeScore: null,
            awayScore: null,
            completed: false,
            winner: null,
            bye: false,
            nextMatchId: null,
            nextMatchSlot: null,
          }
          
          roundMatches.push(match)
          nextStageSources.push({ id: matchId, type: 'match' })
          matchCounter++
        } else {
          // Bye
          const matchId = `r${roundIdx}bye${byeCounter}`
          const match = {
            id: matchId,
            home: homeSource.type === 'competitor' ? homeSource.id : null,
            away: null,
            homeSourceId: homeSource.type === 'match' ? homeSource.id : null,
            awaySourceId: null,
            homeScore: null,
            awayScore: null,
            completed: true,
            winner: homeSource.type === 'competitor' ? homeSource.id : null, 
            bye: true,
            nextMatchId: null,
            nextMatchSlot: null,
          }

          // If it's a bye from a previous match (Winner of match X gets a bye), we can't set winner yet.
          if (homeSource.type === 'match') {
             match.completed = false
             match.winner = null
          }

          roundMatches.push(match)
          nextStageSources.push({ id: matchId, type: 'match' }) 
          byeCounter++
        }
      }

      bracket.rounds.push(roundMatches)
      
      // Link previous round matches to current matches
      // Look at the round we just created, and update the "nextMatchId" of the sources in the PREVIOUS round
      if (roundIdx > 0) {
        const prevRound = bracket.rounds[roundIdx - 1]
        
        roundMatches.forEach(match => {
           if (match.homeSourceId) {
             const prevMatch = prevRound.find(m => m.id === match.homeSourceId)
             if (prevMatch) {
               prevMatch.nextMatchId = match.id
               prevMatch.nextMatchSlot = 'home'
             }
           }
           
           if (match.awaySourceId) {
             const prevMatch = prevRound.find(m => m.id === match.awaySourceId)
             if (prevMatch) {
               prevMatch.nextMatchId = match.id
               prevMatch.nextMatchSlot = 'away'
             }
           }
        })
      }

      currentStageSources = nextStageSources
      roundIdx++
    }

    // Populate matchMap
    bracket.rounds.forEach((round, rIdx) => {
      round.forEach((match, mIdx) => {
        bracket.matchMap[match.id] = { roundIdx: rIdx, matchIdx: mIdx }
      })
    })

    set((state) => {
      const format = state.data.activeFormat
      const newData = {
        ...state.data,
        brackets: {
          ...state.data.brackets,
          [format]: bracket
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  updateMatch: (roundIdx, matchIdx, homeScore, awayScore) => {
    set((state) => {
      const format = state.data.activeFormat
      const currentBracket = state.data.brackets[format]

      if (!currentBracket) return state

      const bracket = JSON.parse(JSON.stringify(currentBracket))
      if (!bracket.rounds[roundIdx] || !bracket.rounds[roundIdx][matchIdx]) return state

      const match = bracket.rounds[roundIdx][matchIdx]

      match.homeScore = homeScore
      match.awayScore = awayScore
      match.completed = true

      // Determine winner
      if (homeScore > awayScore) {
        match.winner = match.home
      } else if (awayScore > homeScore) {
        match.winner = match.away
      } else {
        match.winner = match.home // Default to home team in case of draw
      }

      const propagateWinner = (currentMatch, currentRoundIdx) => {
         if (!currentMatch.nextMatchId) return;

         const nextRoundIdx = currentRoundIdx + 1;
         const nextRound = bracket.rounds[nextRoundIdx];
         if (!nextRound) return;

         const nextMatch = nextRound.find(m => m.id === currentMatch.nextMatchId);
         if (!nextMatch) return;

         if (currentMatch.nextMatchSlot === 'home') {
             nextMatch.home = currentMatch.winner;
         } else {
             nextMatch.away = currentMatch.winner;
         }

         if (nextMatch.bye) {
             // Byes strictly pass the home player through
             nextMatch.winner = nextMatch.home; 
             nextMatch.completed = true;
             propagateWinner(nextMatch, nextRoundIdx);
         } else {
             // If a participant changes in a played match, we must reset it
             if (nextMatch.completed) {
                 nextMatch.completed = false;
                 nextMatch.winner = null;
                 nextMatch.homeScore = null;
                 nextMatch.awayScore = null;
             }
         }
      }

      propagateWinner(match, roundIdx);

      const newData = {
        ...state.data,
        brackets: {
          ...state.data.brackets,
          [format]: bracket
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },

  resetTournament: () => {
    set((state) => {
      const format = state.data.activeFormat
      const newData = {
        ...state.data,
        brackets: {
          ...state.data.brackets,
          [format]: null
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      return { data: newData }
    })
  },
}))
