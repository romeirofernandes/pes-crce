export const calculateStats = (playerId, matches, format = '1v1') => {
  const playerMatches = matches.filter(
    (m) => m.home === playerId || m.away === playerId,
  )

  let stats = {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    winPercentage: 0,
  }

  playerMatches.forEach((match) => {
    const isHome = match.home === playerId
    const playerScore = isHome ? match.homeScore : match.awayScore
    const opponentScore = isHome ? match.awayScore : match.homeScore

    stats.played += 1
    stats.goalsFor += playerScore
    stats.goalsAgainst += opponentScore

    if (playerScore > opponentScore) {
      stats.wins += 1
      stats.points += 3
    } else if (playerScore < opponentScore) {
      stats.losses += 1
    } else {
      stats.draws += 1
      stats.points += 1
    }
  })

  stats.goalDiff = stats.goalsFor - stats.goalsAgainst
  stats.winPercentage =
    stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0

  return stats
}

export const calculateTeamStats = (teamId, teams, matches) => {
  const team = teams.find((t) => t.id === teamId)
  if (!team) return null

  const teamMatches = matches.filter((m) => m.home === teamId || m.away === teamId)

  let stats = {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    members: team.players,
  }

  teamMatches.forEach((match) => {
    const isHome = match.home === teamId
    const teamScore = isHome ? match.homeScore : match.awayScore
    const opponentScore = isHome ? match.awayScore : match.homeScore

    stats.played += 1
    stats.goalsFor += teamScore
    stats.goalsAgainst += opponentScore

    if (teamScore > opponentScore) {
      stats.wins += 1
      stats.points += 3
    } else if (teamScore < opponentScore) {
      stats.losses += 1
    } else {
      stats.draws += 1
      stats.points += 1
    }
  })

  stats.goalDiff = stats.goalsFor - stats.goalsAgainst

  return stats
}

export const getStandings = (competitors, matches, format = '1v1') => {
  const standings = competitors.map((comp) => {
    if (format === '1v1') {
      return {
        ...comp,
        ...calculateStats(comp.id, matches, format),
      }
    } else {
      return {
        ...comp,
        ...calculateTeamStats(comp.id, competitors, matches),
      }
    }
  })

  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    return b.goalsFor - a.goalsFor
  })
}
