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
    leagues: { '1v1': null, '2v2': null },
    tournamentTypes: { '1v1': 'knockout', '2v2': 'knockout' },
    activeFormat: '1v1',
  },

  // Initialize: Subscribe to Firestore updates
  initialize: () => {
    const unsubscribe = onSnapshot(TOURNAMENT_DOC, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const serverBrackets = data.brackets || { '1v1': null, '2v2': null }
        const serverLeagues = data.leagues || { '1v1': null, '2v2': null }
        const serverTournamentTypes = data.tournamentTypes || { '1v1': 'knockout', '2v2': 'knockout' }
        
        set({ 
            data: {
                players: data.players || [],
                teams: data.teams || [],
                brackets: {
                  '1v1': hydrateBracket(serverBrackets['1v1']),
                  '2v2': hydrateBracket(serverBrackets['2v2'])
                },
                leagues: serverLeagues,
                tournamentTypes: serverTournamentTypes,
                activeFormat: data.activeFormat || '1v1'
            } 
        })
      } else {
        // Create the document if it doesn't exist
        const initialData = {
          players: [],
          teams: [],
          brackets: { '1v1': null, '2v2': null },
          leagues: { '1v1': null, '2v2': null },
          tournamentTypes: { '1v1': 'knockout', '2v2': 'knockout' },
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
    await setDoc(TOURNAMENT_DOC, { activeFormat: format }, { merge: true })
  },

  setTournamentType: async (format, type) => {
    const state = get()
    const newTypes = {
        ...state.data.tournamentTypes,
        [format]: type
    }
    await updateDoc(TOURNAMENT_DOC, { tournamentTypes: newTypes })
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
    
    // Clear both bracket and league for this format to be safe
    const newBracketsState = {
      ...state.data.brackets,
      [format]: null
    }

    const newLeaguesState = {
        ...state.data.leagues,
        [format]: null
    }

    const bracketsToSave = {
      '1v1': dehydrateBracket(newBracketsState['1v1']),
      '2v2': dehydrateBracket(newBracketsState['2v2'])
    }
    
    await updateDoc(TOURNAMENT_DOC, { 
        brackets: bracketsToSave,
        leagues: newLeaguesState 
    })
  },

  generateLeague: async () => {
    const state = get()
    const { teams, activeFormat, players } = state.data

    let competitors
    if (activeFormat === '1v1') {
      competitors = players.map(player => ({
        id: player.id,
        name: player.name,
      }))
    } else {
      competitors = teams
    }

    if (competitors.length < 2) return

    // Round Robin Algorithm (Circle Method)
    const matches = []
    // Add dummy if odd
    let schedulingCompetitors = [...competitors.map(c => c.id)]
    if (schedulingCompetitors.length % 2 !== 0) {
        schedulingCompetitors.push(null) // Dummy
    }

    const n = schedulingCompetitors.length
    const rounds = n - 1
    const half = n / 2

    for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < half; i++) {
            const homeId = schedulingCompetitors[i]
            const awayId = schedulingCompetitors[n - 1 - i]

            // If either is null (dummy), it's a "bye" in league terms (no match)
            if (homeId && awayId) {
                matches.push({
                    id: `L${activeFormat}r${r}m${i}`,
                    home: homeId,
                    away: awayId,
                    homeScore: null,
                    awayScore: null,
                    completed: false,
                    roundIdx: r
                })
            }
        }

        // Rotate for next round (keep index 0 fixed)
        // [0, 1, 2, 3] -> [0, 3, 1, 2]
        schedulingCompetitors = [
            schedulingCompetitors[0],
            schedulingCompetitors[n - 1],
            ...schedulingCompetitors.slice(1, n - 1)
        ]
    }

    const newLeaguesState = {
        ...state.data.leagues,
        [activeFormat]: { matches }
    }

    await updateDoc(TOURNAMENT_DOC, { leagues: newLeaguesState })
  },

  updateLeagueMatch: async (matchId, homeScore, awayScore) => {
      const state = get()
      const format = state.data.activeFormat
      const currentLeague = state.data.leagues[format]
      
      if (!currentLeague) return

      const matches = [...currentLeague.matches]
      const matchIndex = matches.findIndex(m => m.id === matchId)
      if (matchIndex === -1) return

      matches[matchIndex] = {
          ...matches[matchIndex],
          homeScore,
          awayScore,
          completed: true
      }

      const newLeaguesState = {
          ...state.data.leagues,
          [format]: { matches }
      }

      await updateDoc(TOURNAMENT_DOC, { leagues: newLeaguesState })
  },

  generateBracket: async () => {
    const state = get()
    const { teams, activeFormat, players } = state.data

    let competitors
    if (activeFormat === '1v1') {
      competitors = players.map(player => ({
        id: player.id,
        name: player.name,
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

    // --- FAIR BRACKET ALGORITHM ---
    // 1. Determine size (power of 2)
    const n = competitors.length
    let size = 1
    while (size < n) {
        size *= 2
    }

    // 2. Determine number of byes
    const numByes = size - n
    // Matches in first round that are NOT byes
    // Total slots = size. 
    // Byes take 'numByes' slots.
    // Players playing in R1 = n - numByes. 
    // Matches in R1 = (n - numByes) / 2. 
    // Wait. Example: 5 players. Size 8. Byes 3.
    // Players playing regular matches = 5 - 3 = 2.
    // Regular Matches = 1.
    // Bye Matches = 3.
    // Total first round "entities" advancing = 1 + 3 = 4 = size/2. Correct.
    
    // 3. Shuffle competitors
    const shuffledCompetitors = [...competitors].sort(() => Math.random() - 0.5)

    // 4. Distribute into "Regular Matches" and "Bye Matches"
    // We need 2*numRegularMatches players for the regular matches.
    const numRegularMatches = (n - numByes) / 2
    
    const regularMatchPlayers = shuffledCompetitors.slice(0, numRegularMatches * 2)
    const byeMatchPlayers = shuffledCompetitors.slice(numRegularMatches * 2)

    // 5. Create the match objects for Round 0
    const round0Matches = []
    let matchCounter = 0
    
    // Regular matches
    for (let i = 0; i < regularMatchPlayers.length; i += 2) {
        const home = regularMatchPlayers[i]
        const away = regularMatchPlayers[i+1]
        
        round0Matches.push({
            id: `r0m${matchCounter++}`,
            home: home.id,
            away: away.id,
            homeScore: null,
            awayScore: null,
            completed: false,
            winner: null,
            bye: false,
            nextMatchId: null,
            nextMatchSlot: null
        })
    }

    // Bye matches
    for (let i = 0; i < byeMatchPlayers.length; i++) {
        const player = byeMatchPlayers[i]
        round0Matches.push({
            id: `r0bye${matchCounter++}`,
            home: player.id,
            away: null,
            homeScore: null, // No score for byes
            awayScore: null,
            completed: true,
            winner: player.id, // Auto-win
            bye: true,
            nextMatchId: null,
            nextMatchSlot: null
        })
    }

    // Shuffle Round 0 matches so byes are distributed randomly
    round0Matches.sort(() => Math.random() - 0.5)

    bracket.rounds.push(round0Matches)

    // 6. Generate subsequent rounds (Standard Tree)
    let currentRoundMatches = round0Matches
    let roundIdx = 1

    while (currentRoundMatches.length > 1) {
        const nextRoundMatches = []
        let nextMatchCounter = 0

        for (let i = 0; i < currentRoundMatches.length; i += 2) {
            const matchId = `r${roundIdx}m${nextMatchCounter++}`
            const homeSource = currentRoundMatches[i]
            const awaySource = currentRoundMatches[i+1]

            const nextMatch = {
                id: matchId,
                home: null, // Will be filled by propagation
                away: null,
                homeSourceId: homeSource.id,
                awaySourceId: awaySource.id,
                homeScore: null,
                awayScore: null,
                completed: false,
                winner: null,
                bye: false,
                nextMatchId: null,
                nextMatchSlot: null
            }

            // Link previous matches to this one
            homeSource.nextMatchId = matchId
            homeSource.nextMatchSlot = 'home'
            awaySource.nextMatchId = matchId
            awaySource.nextMatchSlot = 'away'

            // If source was a completed BYE, auto-propagate winner now
            if (homeSource.bye && homeSource.winner) {
                nextMatch.home = homeSource.winner
            }
            if (awaySource.bye && awaySource.winner) {
                nextMatch.away = awaySource.winner
            }

            nextRoundMatches.push(nextMatch)
        }
        
        bracket.rounds.push(nextRoundMatches)
        currentRoundMatches = nextRoundMatches
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
  },
  
  // New action to swap competitors in a bracket match (only allowed in Round 0 and if match not started)
  swapBracketCompetitors: async (roundIdx, matchId1, matchId2) => {
      const state = get()
      const format = state.data.activeFormat
      const currentBracket = state.data.brackets[format]

      if (!currentBracket) return
      
      // Deep copy
      const bracket = JSON.parse(JSON.stringify(currentBracket))
      
      // Find matches in the specified round
      const round = bracket.rounds[roundIdx]
      if (!round) return
      
      const match1 = round.find(m => m.id === matchId1)
      const match2 = round.find(m => m.id === matchId2)
      
      if (!match1 || !match2) return

      // Only allow swapping for uncompleted matches or simple byes in round 0 for safety
      // But user requested "easy", so let's allow swapping players if no score is set.
      
      // Case 1: Swap Home Competitors
      // Ideally we want to swap the *slots*. 
      // But the structure has competitors directly in 'home'/'away' for Round 0.
      
      // We will perform a swap of the entire 'home' or 'away' entrant if they are valid competitors.
      // This is complex because a match has 2 slots.
      // For simplicity, let's assume the user is clicking "Swap" on a match and selecting another match to swap *entirely*?
      // OR selecting a specific player to swap.
      // The requirement says "swap two people". 
      
      // Let's implement a 'updateBracketMatchCompetitor' that sets a competitor for a slot.
      // But swapping is safer.
      
      // Implementation: Swap match1.home with match2.home (simplified for now, can be expanded)
      // Actually, let's just make a generic "swap slots" function.
      
      // Since the UI will probably just let you drag or pick two players, let's defer the specific logic to the UI 
      // and here provides a primitive: "setMatchCompetitor"
  },
  
  updateBracketMatchCompetitor: async (roundIdx, matchIdx, slot, competitorId) => {
      const state = get()
      const format = state.data.activeFormat
      const currentBracket = state.data.brackets[format]

      if (!currentBracket) return

      const bracket = JSON.parse(JSON.stringify(currentBracket))
      if (!bracket.rounds[roundIdx] || !bracket.rounds[roundIdx][matchIdx]) return

      const match = bracket.rounds[roundIdx][matchIdx]
      
      // 1. Update the slot
      if (slot === 'home') match.home = competitorId
      if (slot === 'away') match.away = competitorId
      
      // 2. Handle Match State
      if (match.bye) {
          // If BYE, the winner is always the present competitor (home or away)
          match.winner = match.home || match.away
          // Match remains completed (byes are auto-completed)
      } else {
          // If it was a regular match and it was completed, we must invalidate it
          // because the score applied to the previous player context.
          if (match.completed) {
              match.completed = false
              match.homeScore = null
              match.awayScore = null
              match.winner = null
          }
      }

      // 3. Propagation Logic (Recursive)
      // This handles both pushing new winners forward AND resetting future matches if a source is reset
      const propagateUpdate = (currentMatch, currentRoundIdx) => {
         if (!currentMatch.nextMatchId) return;

         const nextRoundIdx = currentRoundIdx + 1;
         const nextRound = bracket.rounds[nextRoundIdx];
         if (!nextRound) return;

         const nextMatch = nextRound.find(m => m.id === currentMatch.nextMatchId);
         if (!nextMatch) return;

         // Determine what to pass to the next match
         // If current match is incomplete (or reset), we pass null
         const winnerToPropagate = currentMatch.completed ? currentMatch.winner : null;
         
         // Update the correct slot in the next match
         if (currentMatch.nextMatchSlot === 'home') {
             nextMatch.home = winnerToPropagate;
         } else {
             nextMatch.away = winnerToPropagate;
         }

         // Now handle the next match's state based on the new input
         if (nextMatch.bye) {
             // If next match is a bye...
             if (winnerToPropagate) {
                 // We have a player, so they auto-win
                 nextMatch.winner = winnerToPropagate
                 nextMatch.completed = true
             } else {
                 // We lost the player (reset), so the bye is now pending/empty
                 nextMatch.winner = null
                 nextMatch.completed = false 
             }
             // Recursively propagate this bye's status
             propagateUpdate(nextMatch, nextRoundIdx)
         } else {
             // Regular match
             // If this match WAS completed, we must reset it because one of its participants changed (or became null)
             // Even if we just swapped Player A for Player B, the old score (A vs C) is invalid for (B vs C).
             if (nextMatch.completed) {
                 nextMatch.completed = false;
                 nextMatch.winner = null;
                 nextMatch.homeScore = null;
                 nextMatch.awayScore = null;
                 
                 // Since we reset this match, we must propagate the reset (null) forward to clear *its* next match
                 propagateUpdate(nextMatch, nextRoundIdx);
             }
         }
      }

      // Start propagation from the modified match
      propagateUpdate(match, roundIdx);

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
