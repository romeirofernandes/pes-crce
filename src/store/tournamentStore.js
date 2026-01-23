import { create } from 'zustand'
import { db } from '../lib/firebase'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'

const TOURNAMENT_DOC = doc(db, 'tournaments', 'crce-tournament')

// Helpers for Firestore (handling nested arrays)
const dehydrateBracket = (bracket) => {
  if (!bracket) return null
  const roundsMap = {}
  bracket.rounds.forEach((round, idx) => {
    roundsMap[idx] = round
  })
  return { ...bracket, rounds: roundsMap }
}

const hydrateBracket = (bracket) => {
  if (!bracket) return null
  if (Array.isArray(bracket.rounds)) return bracket
  
  const rounds = Object.keys(bracket.rounds)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => bracket.rounds[k])
  
  return { ...bracket, rounds }
}

export const useTournamentStore = create((set, get) => ({
  data: {
    players: [],
    teams: [],
    brackets: { '1v1': null, '2v2': null },
    activeFormat: '1v1',
  },

  // Initialize: Subscribe to Firestore updates
  initialize: () => {
    // Return the unsubscribe function so we can clean up if needed (though usually global store lives forever)
    const unsubscribe = onSnapshot(TOURNAMENT_DOC, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const serverBrackets = data.brackets || { '1v1': null, '2v2': null }
        // Ensure defaults if fields are missing in legacy docs
        set({ 
            data: {
                players: data.players || [],
                teams: data.teams || [],
                brackets: {
                  '1v1': hydrateBracket(serverBrackets['1v1']),
                  '2v2': hydrateBracket(serverBrackets['2v2'])
                },
                activeFormat: data.activeFormat || '1v1'
            } 
        })
      } else {
        // Create the document if it doesn't exist
        const initialData = {
          players: [],
          teams: [],
          brackets: { '1v1': null, '2v2': null },
          activeFormat: '1v1',
        }
        setDoc(TOURNAMENT_DOC, initialData)
        set({ data: initialData })
      }
    }, (error) => {
      console.error("Error fetching tournament data:", error);
    });
    
    return unsubscribe;
  },

  setFormat: async (format) => {
    // Firestore local cache update
    await setDoc(TOURNAMENT_DOC, { activeFormat: format }, { merge: true })
  },

  addPlayer: async (name) => {
    const state = get()
    const newPlayer = { id: `p${Date.now()}`, name }
    const updatedPlayers = [...state.data.players, newPlayer]
    await updateDoc(TOURNAMENT_DOC, { players: updatedPlayers })
  },

  removePlayer: async (playerId) => {
    const state = get()
    const updatedPlayers = state.data.players.filter((p) => p.id !== playerId)
    await updateDoc(TOURNAMENT_DOC, { players: updatedPlayers })
  },

  addTeam: async (name, playerIds) => {
    const state = get()
    const newTeam = {
      id: `team${Date.now()}`,
      name,
      players: playerIds,
    }
    const updatedTeams = [...state.data.teams, newTeam]
    await updateDoc(TOURNAMENT_DOC, { teams: updatedTeams })
  },

  removeTeam: async (teamId) => {
    const state = get()
    const updatedTeams = state.data.teams.filter((t) => t.id !== teamId)
    await updateDoc(TOURNAMENT_DOC, { teams: updatedTeams })
  },

  resetTournament: async () => {
    const state = get()
    const format = state.data.activeFormat
    const newBracketsState = {
      ...state.data.brackets,
      [format]: null
    }

    const bracketsToSave = {
      '1v1': dehydrateBracket(newBracketsState['1v1']),
      '2v2': dehydrateBracket(newBracketsState['2v2'])
    }
    
    await updateDoc(TOURNAMENT_DOC, { brackets: bracketsToSave })
  },

  generateBracket: async () => {
    const state = get()
    const { teams, activeFormat, players } = state.data

    let competitors
    if (activeFormat === '1v1') {
      competitors = players.map(player => ({
        id: player.id,
        name: player.name, // Ensure name is preserved
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

    // Shuffle competitors
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

    const newBracketsState = {
      ...state.data.brackets,
      [activeFormat]: bracket
    }
    
    const bracketsToSave = {
      '1v1': dehydrateBracket(newBracketsState['1v1']),
      '2v2': dehydrateBracket(newBracketsState['2v2'])
    }

    await updateDoc(TOURNAMENT_DOC, { brackets: bracketsToSave })
  },

  updateMatch: async (roundIdx, matchIdx, homeScore, awayScore) => {
    const state = get()
    const format = state.data.activeFormat
    const currentBracket = state.data.brackets[format]

    if (!currentBracket) return

    // Deep copy to avoid mutating state directly
    const bracket = JSON.parse(JSON.stringify(currentBracket))
    if (!bracket.rounds[roundIdx] || !bracket.rounds[roundIdx][matchIdx]) return

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

    const newBracketsState = {
      ...state.data.brackets,
      [format]: bracket
    }
    
    const bracketsToSave = {
      '1v1': dehydrateBracket(newBracketsState['1v1']),
      '2v2': dehydrateBracket(newBracketsState['2v2'])
    }
    
    await updateDoc(TOURNAMENT_DOC, { brackets: bracketsToSave })
  }
}))
